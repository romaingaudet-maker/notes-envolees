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
     qui joue les phrases (null : chaque comptine garde le sien) ; `free` : c'est l'élève qui
     fait la justesse de la note (voix, cordes, coulisse), la page est plus tolérante (FREE_TOL). */
  const INSTS = {
    none: { name: 'Autre instrument en do', the: '', at: '', fam: 'C', play: 0, voice: null },
    // la voix : on chante les notes en disant leur nom ; la page vérifie la hauteur et le nom (src/ear.js)
    voix: { name: 'Voix', the: 'la voix', at: 'à la voix', fam: 'C', play: 0, voice: null, sing: true, free: true },
    piano: { name: 'Piano', the: 'le piano', at: 'au piano', fam: 'C', play: 0, voice: 'piano' },
    flute: { name: 'Flûte', the: 'la flûte', at: 'à la flûte', fam: 'C', play: 12, voice: 'flute' },
    clarinette: { name: 'Clarinette en si♭', the: 'la clarinette en si♭', at: 'à la clarinette', fam: 'Bb', play: -2, voice: 'clarinet' },
    saxalto: { name: 'Saxophone alto', the: 'le saxophone alto', at: 'au saxophone alto', fam: 'Eb', play: -9, voice: 'sax' },
    trompette: { name: 'Trompette en si♭', the: 'la trompette en si♭', at: 'à la trompette', fam: 'Bb', play: -2, voice: 'trumpet' },
    trombone: { name: 'Trombone', the: 'le trombone', at: 'au trombone', fam: 'C', play: -12, voice: 'trombone', free: true },
    cor: { name: 'Cor en fa', the: 'le cor en fa', at: 'au cor', fam: 'F', play: -7, voice: 'horn' },
    violon: { name: 'Violon', the: 'le violon', at: 'au violon', fam: 'C', play: 0, voice: 'violin', free: true },
    alto: { name: 'Alto', the: 'l’alto', at: 'à l’alto', fam: 'C', play: 0, voice: 'viola', free: true },
    violoncelle: { name: 'Violoncelle', the: 'le violoncelle', at: 'au violoncelle', fam: 'C', play: -12, voice: 'cello', free: true },
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
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    // les modes de jeu : un chemin et son drapeau (Aventure), un cadenas ouvert (Découverte), une coupe (Défi) ; fermé
    aventure: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5c3.5 0 3-5 7-5s3.5 3.5 7.5 2.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0.1 3.6"/><path d="M15 15V3.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M15.6 3.4l6 2.6-6 2.8z" fill="currentColor"/></svg>',
    decouverte: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10.5" width="14" height="10.5" rx="2.6" fill="currentColor"/><path d="M7.5 10.5V7a4.2 4.2 0 0 1 8.1-1.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    defi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10v5a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 5.5H4.2a3 3 0 0 0 3.3 4.3M17 5.5h2.8a3 3 0 0 1-3.3 4.3M12 13.5v4M8 21h8M9.2 17.5h5.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10.5" rx="2.6" fill="currentColor"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21.5V3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6.8 3.6h12l-3.2 4.4 3.2 4.4h-12z" fill="currentColor"/></svg>',
    // les petits ronds du repos : une phrase (une rangée de perles), toute la comptine (deux rangées)
    phrase: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="3.6" cy="15" r="2.9"/><circle cx="9.2" cy="10" r="2.9"/><circle cx="14.8" cy="12.6" r="2.9"/><circle cx="20.4" cy="7.8" r="2.9"/></g></svg>',
    song: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="3.6" cy="8" r="2.4"/><circle cx="9.2" cy="4.2" r="2.4"/><circle cx="14.8" cy="6.2" r="2.4"/><circle cx="20.4" cy="2.9" r="2.4"/><circle cx="3.6" cy="20.6" r="2.4"/><circle cx="9.2" cy="16.8" r="2.4"/><circle cx="14.8" cy="18.8" r="2.4"/><circle cx="20.4" cy="15.5" r="2.4"/></g></svg>',
  };
  const star = (on, size = 24) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z" fill="${on ? '#F5C32C' : 'none'}" stroke="${on ? '#C8901A' : 'currentColor'}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const chip = (letter, name) => `<span class="nchip" data-l="${letter}">${name}</span>`;
  /* La jauge du grand rond, pendant le jeu : un arc au-dessus de la note entendue (bas à gauche, juste en haut, en
     vert, haut à droite) ; le point tourne avec l'écart à la note (±50 cents → ±60°, la zone verte : ±15 cents). */
  const GAUGE = '<svg class="pu-gauge" viewBox="0 0 156 156" aria-hidden="true"><path class="g-trk" d="M17.38 43A70 70 0 0 1 138.62 43"/><path class="g-ok" d="M56.37 11.43A70 70 0 0 1 99.63 11.43"/><g class="needle off" id="needle"><circle cx="78" cy="8" r="6"/></g></svg>';

  /* ---------------- réglages et étoiles (sur cet appareil) ---------------- */
  // préfixe NE_NS : la version de qualification garde ses réglages et ses étoiles à part
  const SET_KEY = (window.NE_NS || '') + 'notes-envolees-reglages', REC_KEY = (window.NE_NS || '') + 'notes-envolees-etoiles';
  function load(k, dflt) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? Object.assign(dflt, v) : dflt; } catch (e) { return dflt; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  // mode : toujours 'mic' (on joue sur un vrai instrument, la page écoute au micro ; plus de xylophone à l'écran)
  // prenom : facultatif (accueil) ; choisi : l'élève a choisi lui-même son instrument (sinon la page le lui demande)
  const settings = load(SET_KEY, { mode: 'mic', inst: 'none', level: 1, play: 'phrases', prenom: '', choisi: false });
  if (OLD_INST[settings.inst]) settings.inst = OLD_INST[settings.inst];
  if (!INSTS[settings.inst]) settings.inst = 'none';
  settings.mode = 'mic';
  settings.level = settings.level === 2 ? 2 : 1;
  const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{M}' \-’]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  settings.prenom = cleanName(settings.prenom);
  // réglages d'avant le prénom : un instrument déjà choisi (autre que « autre instrument en do ») compte comme choisi
  settings.choisi = !!settings.choisi || settings.inst !== 'none';
  /* jeu : le mode de jeu, choisi à la première visite (absent : pas encore choisi, la page le demande une fois) ;
     affiche : en Défi, l'élève accepte que son record paraisse sur l'accueil, pour tout le monde (avec son prénom) */
  const JEUX = ['aventure', 'decouverte', 'defi'];
  if (settings.jeu != null && !JEUX.includes(settings.jeu)) settings.jeu = 'aventure';
  settings.affiche = !!settings.affiche;
  const jeu = () => settings.jeu || 'aventure';
  const records = load(REC_KEY, {});

  /* ---------------- les modes de jeu ----------------
     Aventure (par défaut) : les comptines s'ouvrent une à une, au fil du chemin ; une comptine terminée (une étoile au
     moins, à l'un des niveaux) ouvre la suivante. Découverte : tout est ouvert. Défi : une course, les 20 comptines
     dans l'ordre, chacune au niveau 2, d'un coup, en rythme et sans erreur ; une erreur (ou un abandon après avoir
     joué) renvoie au départ, la comptine 1. Le record (comptines d'affilée depuis le départ) peut paraître sur
     l'accueil, au tableau d'honneur, si l'élève le veut. */
  const JEU = {
    aventure: { name: 'Aventure', d: 'Les comptines s’ouvrent une à une : termine-en une pour ouvrir la suivante.' },
    decouverte: { name: 'Découverte', d: 'Toutes les comptines sont ouvertes : joue celles que tu veux.' },
    defi: { name: 'Défi', d: 'Les 20 comptines dans l’ordre, en rythme, d’un coup et sans erreur. Une erreur : retour au départ ! Ton record peut paraître sur l’accueil.' },
  };
  const bestOf = (id) => Math.max(+records[id] || 0, +records[id + '@2'] || 0);

  /* Le Défi, sur cet appareil : pos, les comptines réussies d'affilée dans la course en cours (la comptine à jouer
     est LIB[pos] ; 20 : Défi terminé) ; best, le record ; departs, les courses commencées ; bestDeparts, au départ
     n° combien le record a été fait (à record égal, le moins de départs passe devant) ; last, la dernière nouvelle,
     pour l'accueil. (La première version, une réussite par comptine dans n'importe quel ordre, est oubliée.) */
  const DEFI_KEY = (window.NE_NS || '') + 'notes-envolees-defi';
  const DEFI0 = { v: 2, pos: 0, best: 0, departs: 1, bestDeparts: 0, last: null };
  const defi = (() => {
    try { const v = JSON.parse(localStorage.getItem(DEFI_KEY) || 'null'); if (v && v.v === 2) return Object.assign({}, DEFI0, v); } catch (e) { /* rien de gardé */ }
    return Object.assign({}, DEFI0);
  })();
  const defiSong = () => LIB[defi.pos] || null; // l'étape du moment (null : Défi terminé)

  function isOpen(song, j = jeu()) {
    if (j === 'defi') return song === defiSong(); // en Défi, seulement l'étape du moment
    if (j !== 'aventure') return true;
    const i = LIB.indexOf(song);
    return i <= 0 || bestOf(song.id) > 0 || bestOf(LIB[i - 1].id) > 0;
  }
  // en Aventure, la prochaine comptine à jouer : la première ouverte et pas encore terminée
  const nextToPlay = () => (jeu() === 'aventure' ? LIB.find((s) => isOpen(s) && !bestOf(s.id)) || null : null);
  // le nom au tableau d'honneur : le prénom ; s'il y a un deuxième mot, seulement son initiale (« Léa M. »)
  const publicName = () => { const w = settings.prenom.split(' ').filter(Boolean); return w.length > 1 ? `${w[0]} ${w[1][0].toUpperCase()}.` : w[0] || ''; };
  // l'état d'une comptine sur le chemin de l'accueil (Aventure, Découverte) : ouverte ou fermée, la prochaine à jouer
  function songState(s, NX = nextToPlay()) {
    const open = isOpen(s), i = LIB.indexOf(s);
    return { open, next: s === NX, lockedBy: open ? null : LIB[i - 1] || null };
  }
  const inst = () => {
    const i = INSTS[settings.inst], f = FAMS[i.fam];
    return Object.assign({}, i, { off: f.off, short: f.short, key: f.key, how: f.how });
  };
  const instOptions = () => Object.entries(INSTS).map(([k, v]) => `<option value="${k}"${settings.inst === k ? ' selected' : ''}>${v.name}</option>`).join('');
  // le timbre qui joue la musique de la page : celui de l'instrument choisi, sinon celui de la comptine
  const voiceNow = () => inst().voice || (G && G.song.voice);
  const FREE_NOTE = ' Comme c’est toi qui fais la justesse de la note, la page accepte une note un peu trop haute ou trop basse.';
  const instNote = () => {
    const i = inst();
    if (i.sing) return 'Chante chaque note en disant son nom (do, ré, mi…) : la page écoute au micro la hauteur et le nom. Une voix grave peut chanter une octave plus bas. Les phrases gardent le timbre de chaque comptine.' + FREE_NOTE;
    if (!i.voice) return 'Pour un instrument en do qui n’est pas dans la liste : les notes sonnent comme elles sont écrites, et chaque comptine garde son propre timbre.';
    const of = i.the.startsWith('l’') ? 'de ' + i.the : i.the.startsWith('le ') ? 'du ' + i.the.slice(3) : 'de ' + i.the;
    const sound = ` Les phrases sont jouées avec le son enregistré ${of}.`;
    if (i.fam !== 'C') return `Instrument ${i.short} : ${i.how}.${sound}`;
    if (i.voice === 'xylo') return `Le xylophone sonne une octave plus haut que ce qui est écrit : la page aussi.${sound}`;
    const reg = i.play === -12 ? 'la page joue une octave plus bas, dans son registre.' : i.play === 12 ? 'la page joue une octave plus haut, dans son registre.' : 'les notes sonnent comme elles sont écrites.';
    return `Instrument en do : ${reg}${sound}${i.free ? FREE_NOTE : ''}`;
  };
  function instrLine(song) {
    const i = inst();
    if (i.sing) return `En do majeur, jouée ${song.instrument} : chante-la en disant le nom des notes.`;
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
    const ipn = app.querySelector('#ip-name');
    if (ipn) ipn.textContent = instShort();
    if (G && view === 'song') {
      if (prepping()) cancelAttempt();
      expectNext();
      if (el.instr) el.instr.textContent = instrLine(G.song);
      if (G.cal && !singing()) calStop();
    }
    applyVoice();
  }
  function setLevel(v) {
    settings.level = v === 2 ? 2 : 1;
    save(SET_KEY, settings);
    if (G && view === 'song') { stopAll(); renderSong(G.song); }
  }

  /* ---------------- l'élève : son prénom, son instrument, son mode de jeu ----------------
     Première visite (sur l'accueil, ou dans une comptine ouverte directement par un lien) : trois écrans, en plein
     écran sur téléphone. « Comment t'appelles-tu ? » (facultatif), puis « Quel est ton instrument ? » : un dessin par
     instrument, on le touche, c'est choisi ; enfin « Comment veux-tu jouer ? » : Aventure, Découverte ou Défi.
     Ensuite, une ligne le rappelle en haut de l'accueil (« Bonjour, Léa ! », son instrument, son mode de jeu) ; son
     bouton « Changer », comme dans une comptine le bouton à son nom, ouvre les réglages : le prénom, le mode de jeu et
     l'instrument s'y changent directement, sans repasser par les trois écrans. Quand le suivi est branché, le prénom
     part avec les résultats (voir les mentions légales). */
  const INST_LIST = ['flute', 'clarinette', 'saxalto', 'trompette', 'trombone', 'cor', 'violon', 'alto', 'violoncelle', 'piano', 'xylophone', 'voix', 'none'];
  // nom court (bouton d'une comptine, rappel de l'accueil) ; sur les cartes à dessin, une précision si besoin
  const INST_TILE = { flute: 'Flûte', clarinette: 'Clarinette', saxalto: 'Saxophone', trompette: 'Trompette', trombone: 'Trombone', cor: 'Cor', violon: 'Violon', alto: 'Alto', violoncelle: 'Violoncelle', piano: 'Piano', xylophone: 'Xylophone', voix: 'Voix', none: 'Autre' };
  const INST_CARD = { saxalto: ['Saxophone', 'alto'], voix: ['Je chante', 'avec ma voix'], none: ['Autre', 'instrument'] };
  const instShort = (k = settings.inst) => INST_TILE[k] || INST_TILE.none;
  const instPic = (k = settings.inst) => (typeof INST_ICON !== 'undefined' && (INST_ICON[k] || INST_ICON.none)) || ICON.note;
  // les cartes à dessin (l'instrument déjà choisi est marqué)
  const instCards = () => INST_LIST.map((k) => {
    const [t, sub] = INST_CARD[k] || [INST_TILE[k], ''];
    return `<button class="ic-card" type="button" data-k="${k}" aria-pressed="${settings.choisi && settings.inst === k}"><span class="ic-pic">${instPic(k)}</span><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  }).join('');
  const helloHtml = () => (settings.prenom ? `Bonjour, <b>${esc(settings.prenom)}</b>${NB}!` : `Bonjour${NB}!`);
  // le rappel, en haut de l'accueil des deux versions : prénom, instrument, mode de jeu (en Défi, l'étape et le record)
  const jeuHtml = () => `<span class="ec-jeu">${ICON[jeu()]}${JEU[jeu()].name}</span>`;
  function defiLine() {
    if (jeu() !== 'defi') return '';
    const where = defiSong() ? `étape ${defi.pos + 1} sur ${LIB.length}` : 'Défi terminé';
    return `${where} · record${NB}: ${defi.best || 'pas encore'}${settings.affiche && canBoard() ? ' · au tableau d’honneur' : ''}`;
  }
  function eleveHtml() {
    const dl = defiLine();
    return `<section class="eleve-card" aria-label="Toi, ton instrument et ton mode de jeu">
      <div class="ec-sum">
        <span class="ec-pic">${instPic()}</span>
        <div class="ec-txt">
          <p class="ec-hello">${helloHtml()}</p>
          <p class="ec-row"><span class="ec-inst">${esc(instShort())}</span>${jeuHtml()}<button class="ec-edit" type="button">Changer</button></p>
          <p class="ec-defi"${dl ? '' : ' hidden'}>${esc(dl)}</p>
        </div>
      </div>
    </section>`;
  }
  function eleveRefresh(card) {
    if (!card || !document.contains(card)) return;
    card.querySelector('.ec-pic').innerHTML = instPic();
    card.querySelector('.ec-hello').innerHTML = helloHtml();
    card.querySelector('.ec-inst').textContent = instShort();
    card.querySelector('.ec-jeu').outerHTML = jeuHtml();
    const dl = defiLine(), p = card.querySelector('.ec-defi');
    p.textContent = dl;
    p.hidden = !dl;
  }
  // « Changer » : les réglages, où le prénom, le mode de jeu et l'instrument se changent directement
  function bindEleve(card) {
    if (!card) return;
    card.querySelector('.ec-edit').addEventListener('click', () => reglages({ card }));
  }
  // pourquoi le prénom (première visite et réglages)
  const nameWhy = () => (Suivi.configured ? 'Ce n’est pas obligatoire. Ton professeur le verra avec tes résultats.' : 'Ce n’est pas obligatoire. Il reste sur cet appareil.');
  /* La première visite : à l'accueil comme dans une comptine ouverte directement, tant que l'instrument n'est pas
     choisi : le prénom, l'instrument, puis le mode de jeu. Un élève inscrit avant les modes de jeu les découvre une
     fois (avec la question du prénom, s'il ne l'a pas encore donné). */
  function welcome(onDone) {
    if (!settings.choisi) onboard({ onDone });
    else if (!settings.jeu) onboard({ onDone, steps: settings.prenom ? [3] : [1, 3], nouveau: true });
  }
  // les cartes des modes de jeu (première visite) : un dessin, le nom, ce qui le distingue
  const jeuCards = (cur) => JEUX.map((k) => `<button class="jeu-card" type="button" role="radio" data-jeu="${k}" aria-checked="${k === cur}"><span class="jeu-ic">${ICON[k]}</span><b>${JEU[k].name}${k === 'aventure' ? '<small>par défaut</small>' : ''}</b><span class="jeu-d">${JEU[k].d}</span></button>`).join('');
  // l'accord pour le tableau d'honneur du Défi : il faut un prénom, et que cet appareil envoie le suivi
  const sendsHere = () => Suivi.configured && !Suivi.excluded();
  const canBoard = () => !!publicName() && sendsHere();
  const defiOkHtml = (cls) => `<label class="${cls}" hidden><input type="checkbox" class="defi-ok"${settings.affiche ? ' checked' : ''}><span class="defi-ok-t"></span></label>`;
  function defiOkUI(label, on) {
    if (!label) return;
    const box = label.querySelector('input'), can = canBoard();
    label.hidden = !on;
    box.disabled = !can;
    if (!can) box.checked = false;
    label.classList.toggle('is-off', !can);
    label.querySelector('.defi-ok-t').textContent = can
      ? `Afficher mon record sur l’accueil, au tableau d’honneur, pour tout le monde (avec mon prénom${NB}: ${publicName()})`
      : !sendsHere() ? `Ici, rien ne part de cet appareil${Suivi.configured ? ' (le suivi y est coupé)' : ''}${NB}: pas de tableau d’honneur.`
        : 'Pour paraître au tableau d’honneur de l’accueil, il faut écrire ton prénom.';
  }
  // un autre mode de jeu (ou l'accord pour le tableau d'honneur) : la page en tient compte tout de suite
  function setJeu(k, affiche) {
    const was = settings.jeu, wasAff = settings.affiche;
    settings.jeu = JEUX.includes(k) ? k : 'aventure';
    settings.affiche = !!affiche && canBoard();
    save(SET_KEY, settings);
    if (settings.affiche !== wasAff || (settings.jeu === 'defi' && was !== 'defi' && defiStarted())) defiSend();
    return was !== settings.jeu;
  }
  // steps : les écrans montrés (1 le prénom, 2 l'instrument, 3 le mode de jeu) ; nouveau : un élève déjà inscrit
  function onboard({ onDone, steps = [1, 2, 3], nouveau = false } = {}) {
    if (app.querySelector('.onb')) return;
    const why = nameWhy();
    const jeu0 = settings.jeu, name0 = publicName();
    let pick = jeu();
    const wrap = document.createElement('div');
    wrap.className = 'onb';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = `<div class="onb-in">
      <div class="onb-top"><span class="onb-brand">Les Notes Envolées</span><span class="onb-dots" aria-hidden="true">${steps.map(() => '<i></i>').join('')}</span></div>
      <form class="onb-step onb-s1" hidden novalidate>
        <h2 class="onb-t" id="onb-t1" tabindex="-1">Bonjour${NB}!<span>Comment t’appelles-tu${NB}?</span></h2>
        <input class="onb-name" name="prenom" type="text" maxlength="30" autocomplete="given-name" autocapitalize="words" spellcheck="false" enterkeyhint="next" placeholder="Ton prénom" aria-label="Ton prénom" value="${esc(settings.prenom)}">
        <p class="onb-why">${why}</p>
        <button class="btn-big onb-next" type="submit"><span>Suivant</span>${ICON.next}</button>
      </form>
      <section class="onb-step onb-s2" hidden aria-labelledby="onb-t2">
        <h2 class="onb-t" id="onb-t2" tabindex="-1"></h2>
        <p class="onb-sub">Touche son dessin.</p>
        <div class="ic-grid">${instCards()}</div>
        <button class="onb-back" type="button" data-back="2">${ICON.back}<span>Mon prénom</span></button>
      </section>
      <section class="onb-step onb-s3" hidden aria-labelledby="onb-t3">
        <h2 class="onb-t" id="onb-t3" tabindex="-1"></h2>
        <p class="onb-sub">${nouveau ? 'Nouveau : trois façons de jouer. Tu pourras changer quand tu veux, dans les réglages.' : 'Tu pourras changer quand tu veux, dans les réglages.'}</p>
        <div class="jeu-grid" role="radiogroup" aria-labelledby="onb-t3">${jeuCards(pick)}</div>
        ${defiOkHtml('onb-defi')}
        <button class="btn-big onb-go" type="button"><span>C’est parti${NB}!</span>${ICON.next}</button>
        <button class="onb-back" type="button" data-back="3">${ICON.back}<span></span></button>
      </section>
    </div>`;
    // la page derrière ne réagit plus, et ne défile plus
    const behind = [...app.children];
    behind.forEach((c) => { c.inert = true; });
    app.appendChild(wrap);
    document.documentElement.classList.add('onb-open');
    const S = { 1: wrap.querySelector('.onb-s1'), 2: wrap.querySelector('.onb-s2'), 3: wrap.querySelector('.onb-s3') };
    const name = wrap.querySelector('.onb-name'), dots = wrap.querySelectorAll('.onb-dots i'), okLbl = wrap.querySelector('.onb-defi');
    const after = (k) => steps[steps.indexOf(k) + 1], before = (k) => steps[steps.indexOf(k) - 1];
    const BACK = { 1: 'Mon prénom', 2: 'Mon instrument' };
    const step = (k) => {
      [1, 2, 3].forEach((j) => { S[j].hidden = j !== k; });
      dots.forEach((d, i) => d.classList.toggle('on', i === steps.indexOf(k)));
      wrap.setAttribute('aria-labelledby', 'onb-t' + k);
      wrap.scrollTop = 0;
      const hi = settings.prenom ? `${esc(settings.prenom)}, ` : '';
      if (k === 2) {
        wrap.querySelector('#onb-t2').innerHTML = hi ? `${hi}quel est ton instrument${NB}?` : `Quel est ton instrument${NB}?`;
        wrap.querySelector('#onb-t2').focus({ preventScroll: true });
      } else if (k === 3) {
        wrap.querySelector('#onb-t3').innerHTML = hi ? `${hi}comment veux-tu jouer${NB}?` : `Comment veux-tu jouer${NB}?`;
        const b3 = S[3].querySelector('[data-back="3"]');
        b3.hidden = !before(3);
        if (before(3)) b3.querySelector('span').textContent = BACK[before(3)];
        defiOkUI(okLbl, pick === 'defi' || settings.affiche);
        wrap.querySelector('#onb-t3').focus({ preventScroll: true });
      } else if (FINE.matches) name.focus({ preventScroll: true }); // au clavier, on écrit tout de suite (pas sur téléphone : le clavier cacherait l'écran)
      else wrap.querySelector('#onb-t1').focus({ preventScroll: true });
    };
    const saveName = () => {
      const v = cleanName(name.value);
      if (v !== settings.prenom) { settings.prenom = v; save(SET_KEY, settings); }
    };
    const next = (k) => { const n = after(k); if (n) step(n); else close(); };
    S[1].addEventListener('submit', (e) => { e.preventDefault(); saveName(); name.blur(); next(1); });
    wrap.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { const p = before(+b.dataset.back); if (p) step(p); }));
    let done = false;
    const onKey = (e) => {
      // Échap : seulement quand l'instrument et le mode sont déjà choisis (« Changer ») ; sinon, il faut les choisir
      if (e.key === 'Escape' && settings.choisi && settings.jeu) { e.preventDefault(); close(); }
    };
    function close() {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey, true);
      behind.forEach((c) => { c.inert = false; });
      document.documentElement.classList.remove('onb-open');
      wrap.classList.add('is-out');
      setTimeout(() => wrap.remove(), RM.matches ? 0 : 220);
      // le prénom a changé : le nom au tableau d'honneur aussi
      if (publicName() !== name0 && settings.affiche) defiSend();
      // un autre mode de jeu : la page se redessine (comptines ouvertes ou fermées, le Défi)
      if (settings.jeu !== jeu0) { route(false); return; }
      if (onDone) onDone();
    }
    document.addEventListener('keydown', onKey, true);
    wrap.querySelectorAll('.ic-card').forEach((b) => b.addEventListener('click', () => {
      if (done) return;
      saveName();
      wrap.querySelectorAll('.ic-card').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      b.classList.add('is-picked');
      settings.choisi = true;
      setInst(b.dataset.k);
      setTimeout(() => { if (!done) next(2); }, RM.matches ? 0 : 340);
    }));
    wrap.querySelectorAll('.jeu-card').forEach((b) => b.addEventListener('click', () => {
      pick = b.dataset.jeu;
      wrap.querySelectorAll('.jeu-card').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      defiOkUI(okLbl, pick === 'defi' || settings.affiche);
    }));
    wrap.querySelector('.onb-go').addEventListener('click', () => {
      setJeu(pick, okLbl.hidden ? settings.affiche : okLbl.querySelector('input').checked);
      close();
    });
    step(steps[0]);
  }
  /* Les réglages, sur une seule feuille : le prénom, le mode de jeu et l'instrument, chacun modifiable directement ;
     dans une comptine, aussi le niveau, la vitesse (la tortue : la page joue plus lentement ; au niveau 2, le décompte
     et la mesure aussi) et, pour la voix, « Régler ma voix ». On l'ouvre par « Changer » (le rappel, en haut de
     l'accueil) ou par le bouton à son nom, en haut d'une comptine ; la tortue reste dessinée sur ce bouton tant que la
     vitesse lente est choisie. card : le rappel de l'accueil d'où l'on vient (remis à jour en fermant). */
  function setSlow(on) {
    if (!G) return;
    G.slow = !!on;
    if (G.slow) G.usedSlow = true;
    const ic = app.querySelector('#ip-slow');
    if (ic) ic.hidden = !G.slow;
  }
  function reglages({ card } = {}) {
    if (app.querySelector('.ec-modal, .onb')) return;
    const inSong = !!G && view === 'song';
    let pick = jeu();
    const name0 = publicName(), aff0 = settings.affiche, inst0 = settings.inst;
    const wrap = document.createElement('div');
    wrap.className = 'ec-modal rg-modal';
    // le prénom, le mode de jeu (avec ce qui le distingue), dans une comptine le niveau et la vitesse (pas en Défi :
    // niveau 2, vitesse normale), puis l'instrument
    wrap.innerHTML = `<div class="ec-sheet" role="dialog" aria-modal="true" aria-labelledby="rg-title">
      <div class="rg-in">
        <div class="rg-head"><h2 class="rg-title" id="rg-title">Réglages</h2><button class="rg-x" type="button" aria-label="Fermer">${ICON.close}</button></div>
        <label class="rg-lbl" for="rg-name">Ton prénom</label>
        <input class="rg-name" id="rg-name" type="text" maxlength="30" autocomplete="given-name" autocapitalize="words" spellcheck="false" enterkeyhint="done" placeholder="Ton prénom" value="${esc(settings.prenom)}">
        <p class="rg-note">${nameWhy()}</p>
        <p class="rg-lbl">Mode de jeu</p>
        <div class="seg rg-seg rg-jeu" role="radiogroup" aria-label="Mode de jeu">${JEUX.map((k) => `<button type="button" role="radio" data-jeu="${k}" aria-checked="${k === pick}">${ICON[k]}<span>${JEU[k].name}</span></button>`).join('')}</div>
        <p class="rg-note rg-jeu-note" aria-live="polite"></p>
        ${defiOkHtml('rg-defi')}${inSong ? `
        <p class="rg-lbl rg-nodefi">Niveau</p>
        <div class="seg rg-seg rg-level rg-nodefi" role="radiogroup" aria-label="Niveau">
          <button type="button" role="radio" data-level="1" aria-checked="${G.level !== 2}"><b class="lv">1</b><span>Les notes</span></button>
          <button type="button" role="radio" data-level="2" aria-checked="${G.level === 2}"><b class="lv">2</b><span>Notes et rythme</span></button>
        </div>
        <p class="rg-note rg-nodefi">Changer de niveau recommence la comptine.</p>
        <p class="rg-lbl rg-nodefi">Vitesse</p>
        <div class="seg rg-seg rg-speed rg-nodefi" role="radiogroup" aria-label="Vitesse">
          <button type="button" role="radio" data-slow="0" aria-checked="${!G.slow}">Normale</button>
          <button type="button" role="radio" data-slow="1" aria-checked="${G.slow}">${ICON.turtle}<span>Lente</span></button>
        </div>
        <p class="rg-note rg-nodefi">Lente${NB}: la page joue plus lentement${G.level === 2 ? ', et compte plus lentement avant que tu joues' : ''}.</p>` : ''}
        <p class="rg-lbl">Ton instrument</p>
        <div class="ic-grid rg-grid">${instCards()}</div>
        <p class="rg-note rg-inst-note" aria-live="polite">${esc(instNote())}</p>${inSong ? `
        <button class="btn rg-voice" type="button"${inst().sing ? '' : ' hidden'}>${ICON.mic}<span>Régler ma voix</span></button>` : ''}
        <button class="btn-big rg-ok" type="button"><span>OK</span></button>
      </div>
    </div>`;
    const behind = [...app.children];
    behind.forEach((c) => { c.inert = true; });
    app.appendChild(wrap);
    document.documentElement.classList.add('onb-open'); // l'accueil ne défile plus derrière
    const sheet = wrap.querySelector('.ec-sheet'), note = wrap.querySelector('.rg-inst-note'), voice = wrap.querySelector('.rg-voice');
    const nameEl = wrap.querySelector('.rg-name'), jeuNote = wrap.querySelector('.rg-jeu-note'), okLbl = wrap.querySelector('.rg-defi'), box = okLbl.querySelector('input');
    // l'accord pour le tableau d'honneur, tel que l'élève l'a coché (gardé s'il efface son prénom un instant)
    let want = box.checked;
    // le mode choisi : ce qui le distingue ; en Défi, l'accord pour le tableau d'honneur, ni niveau ni vitesse
    const jeuUI = () => {
      wrap.querySelectorAll('.rg-jeu [role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.jeu === pick)));
      // dans une comptine, ce qui suivra : elle recommence, ou (pas encore ouverte dans ce mode) la page dit laquelle jouer
      const nx = defiSong(), then = !inSong || pick === jeu() ? '' : isOpen(G.song, pick) ? ' La comptine recommence.'
        : pick === 'defi' ? (nx ? ` Ta prochaine étape${NB}: «${NB}${nb(nx.title)}${NB}».` : '') : ' Cette comptine n’est pas encore ouverte en Aventure.';
      jeuNote.textContent = `${JEU[pick].d}${pick === 'defi' ? ' Il se joue au niveau 2 (notes et rythme), à vitesse normale.' : ''}${then}`;
      wrap.querySelectorAll('.rg-nodefi').forEach((x) => { x.hidden = pick === 'defi'; });
      defiOkUI(okLbl, pick === 'defi' || settings.affiche);
      if (!box.disabled) box.checked = want;
    };
    jeuUI();
    // « Régler ma voix » (la voix, dans une comptine) : il respire tant que la voix n'est pas réglée sur cet appareil
    const voiceBtn = () => { if (voice) { voice.hidden = !inst().sing; voice.classList.toggle('is-ready', !hasMyVoice()); } };
    voiceBtn();
    sheet.tabIndex = -1;
    sheet.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    let shut = false;
    function close() {
      if (shut) return;
      shut = true;
      behind.forEach((c) => { c.inert = false; });
      wrap.remove();
      document.documentElement.classList.remove('onb-open');
      document.removeEventListener('keydown', onKey, true);
      settings.prenom = cleanName(nameEl.value);
      save(SET_KEY, settings);
      // le mode de jeu et l'accord pour le tableau d'honneur (setJeu les garde et, s'ils changent, les envoie) ; un
      // autre prénom, quand l'élève paraît déjà au tableau d'honneur : le nouveau nom part aussi
      const otherJeu = setJeu(pick, okLbl.hidden ? settings.affiche : box.checked);
      if (settings.affiche && aff0 && publicName() !== name0) defiSend();
      if (inSong) {
        // un autre mode de jeu : la comptine recommence avec lui (fermée en Aventure, au niveau 2 en Défi)
        if (otherJeu) { route(false); return; }
        if (el.bRg && document.contains(el.bRg)) el.bRg.focus({ preventScroll: true });
        return;
      }
      // l'accueil : redessiné au même endroit si le mode, le tableau d'honneur ou le pion du Défi changent ; sinon, le
      // rappel suffit
      if (otherJeu || settings.affiche !== aff0 || (settings.affiche && publicName() !== name0) || (jeu() === 'defi' && settings.inst !== inst0)) {
        const y = window.scrollY;
        route(false);
        window.scrollTo(0, y);
        const ed = app.querySelector('.ec-edit');
        if (ed) ed.focus({ preventScroll: true });
        return;
      }
      eleveRefresh(card);
      const ed = card && document.contains(card) ? card.querySelector('.ec-edit') : null;
      if (ed) ed.focus({ preventScroll: true });
    }
    document.addEventListener('keydown', onKey, true);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); }); // toucher à côté : on ferme
    wrap.querySelector('.rg-x').addEventListener('click', close);
    wrap.querySelector('.rg-ok').addEventListener('click', close);
    // le prénom : gardé en fermant ; la case du tableau d'honneur le suit (il faut un prénom, et elle le montre)
    nameEl.addEventListener('input', () => { settings.prenom = cleanName(nameEl.value); jeuUI(); });
    nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });
    box.addEventListener('change', () => { want = box.checked; });
    wrap.querySelectorAll('.rg-jeu [role="radio"]').forEach((b) => b.addEventListener('click', () => { pick = b.dataset.jeu; jeuUI(); }));
    wrap.querySelectorAll('.ic-card').forEach((b) => b.addEventListener('click', () => {
      wrap.querySelectorAll('.ic-card').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      settings.choisi = true;
      setInst(b.dataset.k);
      note.textContent = instNote();
      voiceBtn();
    }));
    if (!inSong) return;
    wrap.querySelectorAll('.rg-speed [role="radio"]').forEach((b) => b.addEventListener('click', () => {
      setSlow(b.dataset.slow === '1');
      wrap.querySelectorAll('.rg-speed [role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    }));
    // un autre niveau : la comptine recommence (la feuille se ferme d'abord)
    wrap.querySelectorAll('.rg-level [role="radio"]').forEach((b) => b.addEventListener('click', () => {
      const v = +b.dataset.level, was = G.level;
      close();
      if (v !== was && G && view === 'song') setLevel(v);
    }));
    voice.addEventListener('click', () => { close(); if (G && view === 'song') calStart(false); });
  }

  /* ---------------- la justesse ----------------
     La note entendue (r : demi-ton le plus proche, cents : écart à ce demi-ton, son réel) est-elle la note
     écrite attendue, à l'octave près ? Pour un instrument à touches, à pistons, à clés : le demi-ton le plus
     proche (±0,5 demi-ton). Quand l'élève fait lui-même la justesse (voix, violon, alto, violoncelle,
     trombone), jusqu'à FREE_TOL demi-ton d'écart : une note un peu trop haute ou trop basse est acceptée,
     mais pas la note voisine jouée juste (à 1 demi-ton). */
  const FREE_TOL = 0.7;
  const offTarget = (hit, midi) => { // écart à la note attendue la plus proche (en demi-tons, dans [-6, 6[)
    const m = hit.r + (hit.cents || 0) / 100 - inst().off;
    return ((((m - midi) % 12) + 18) % 12) - 6;
  };
  const rightPitch = (hit, midi) => mod12(hit.r - inst().off) === mod12(midi) || (!!inst().free && Math.abs(offTarget(hit, midi)) <= FREE_TOL);
  // l'oreille suit l'accord d'un instrument un peu haut ou bas ; pas quand l'élève fait la justesse (elle suivrait ses erreurs)
  const tuneTo = (hit, midi) => { if (!inst().free) Ear.nudge(Math.round(offTarget(hit, midi) * 100)); };

  /* ---------------- la voix : chanter les notes en disant leur nom ----------------
     L'oreille (src/ear.js) reconnaît la syllabe chantée au début de chaque note, sur cet appareil :
     des modèles par défaut (src/voix-modeles.js) et, si l'élève a « réglé sa voix », les siens en plus,
     rangés ici (le timbre de chaque syllabe, jamais le son). Une note n'est juste que si la hauteur ET
     le nom le sont ; quand la reconnaissance hésite, on ne pénalise pas. */
  const SYL_FR = { do: 'do', re: 'ré', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si' };
  const VOICE_KEY = (window.NE_NS || '') + 'notes-envolees-voix';
  const singing = () => !!inst().sing && settings.mode === 'mic';
  const sylOf = (midi) => PitchKit.SYL_PC[mod12(midi)];
  // 'oui', 'non' (un autre nom, nettement) ou null (pas de syllabe, ou la reconnaissance hésite)
  const nameSaid = (syl, midi) => (syl ? PitchKit.sayMatch(syl, sylOf(midi), syl.user) : null);
  let defVoice = null;
  // VOICE_V : la façon de résumer le timbre ; un réglage fait autrement (version précédente) est à refaire
  const VOICE_V = 2;
  function myVoiceRaw() { try { const v = JSON.parse(localStorage.getItem(VOICE_KEY) || 'null'); return v && v.m && v.v === VOICE_V ? v : null; } catch (e) { return null; } }
  const hasMyVoice = () => !!myVoiceRaw();
  function myVoice() { const v = myVoiceRaw(); return v ? PitchKit.unpackModels(v) : null; }
  function applyVoice() {
    if (!singing() || typeof VOIX_MODELES === 'undefined') { Ear.setVoice(null); return; }
    if (!defVoice) defVoice = PitchKit.unpackModels(VOIX_MODELES);
    const mine = G && G.cal ? null : myVoice();
    Ear.setVoice(defVoice, mine);
  }
  /* « Régler ma voix » : la page joue do, ré, mi… jusqu'à si ; l'élève chante chaque note en disant son nom */
  const CAL_PCS = [0, 2, 4, 5, 7, 9, 11];
  // first : proposé avant le premier essai (sinon, l'élève a touché « Régler ma voix », dans les réglages)
  function calStart(first) {
    if (!G || !singing()) return;
    if (!Ear.active()) { startMic().then(() => { if (G && Ear.active() && !G.cal) calStart(first); }); return; }
    if (!Ear.voiceOk()) { setHint('Ce navigateur ne me laisse pas reconnaître les noms chantés : je vérifie seulement la hauteur.', ''); flashTop(4500); return; }
    G.acts++;
    cancelAttempt(true);
    stopPlayback(true);
    G.cal = { i: 0, seqs: {}, first: !!first };
    applyVoice();
    bandUI();
    if (first) {
      setHint(`D’abord, la page apprend ta voix${NB}: chante chaque note en disant son nom`, '');
      later(() => { if (G && G.cal && G.cal.i === 0) calStep(); }, 2200);
      return;
    }
    calStep();
  }
  function calStep() {
    const c = G && G.cal;
    if (!c) return;
    const pc = CAL_PCS[c.i], L = PC_LETTER[pc];
    c.on = true;
    Ear.expect(pc);
    Sound.tap(voiceNow(), 60 + pc, 0.9);
    setHint(`Réglage ${c.i + 1}/7${NB}: chante ${chip(L, NOTE_FR[L])} en disant «${NB}${SYL_FR[PitchKit.SYL[c.i]]}${NB}»`, '');
  }
  function calHit(hit) {
    const c = G.cal, pc = CAL_PCS[c.i], L = PC_LETTER[pc];
    if (!hit.seq || !hit.seq.length || !c.on) return; // pas avant que la page ait joué la première note

    const want = PitchKit.SYL[c.i];
    // la bonne note (à l'octave près) : sinon, ce pourrait être un autre nom (mi et fa, si et do sont voisins)
    if (mod12(hit.r) !== pc) {
      retrigger(el.heard, 'is-wrong');
      setHint(`J’entends ${PC_FR[mod12(hit.r)]}, pas ${chip(L, NOTE_FR[L])}`, 'down');
      return;
    }
    // on ne vérifie pas le nom avec les modèles par défaut : c'est justement quand ils reconnaissent mal
    // la voix de l'élève que le réglage sert ; il chante le nom qu'on lui demande
    retrigger(el.heard, 'is-good');
    c.seqs[want] = hit.seq;
    if (++c.i < CAL_PCS.length) { later(() => { if (G && G.cal === c) calStep(); }, 650); return; }
    try { localStorage.setItem(VOICE_KEY, JSON.stringify(Object.assign({ v: VOICE_V }, PitchKit.packModels(Object.fromEntries(PitchKit.SYL.map((s) => [s, [c.seqs[s]]])))))); } catch (e) { /* stockage indisponible : réglage pour cette visite seulement */ }
    G.cal = null;
    applyVoice();
    expectNext();
    setHint(`Ta voix est réglée${NB}! Touche «${NB}${GO}${NB}»`, 'ok');
    flashTop(3600);
  }
  function calStop() {
    if (!G || !G.cal) return;
    G.cal = null;
    applyVoice();
    expectNext();
    idleHint();
    bandUI();
  }

  /* ---------------- suivi des parties, pour le professeur (src/suivi.js) ---------------- */
  // le prénom (s'il a été donné) part avec chaque envoi : la page de suivi montre le dernier connu de chaque appareil
  const track = (type, data) => Suivi.send(type, Object.assign({ inst: settings.inst, mode: settings.mode, jeu: jeu() }, settings.prenom ? { prenom: settings.prenom } : {}, data));
  /* Le Défi part au suivi à chaque étape réussie ou ratée (le professeur voit la course), et au tableau d'honneur de
     l'accueil si l'élève l'accepte : comptines = le record, essais = au départ n° combien il a été fait. */
  const defiStarted = () => !!(defi.best || defi.pos || defi.departs > 1);
  function defiSend() {
    const nom = publicName();
    track('defi', { comptines: defi.best, essais: defi.bestDeparts || defi.departs, etape: defi.pos, departs: defi.departs, publier: settings.affiche && nom ? 1 : 0, nom });
  }
  const defiSave = () => { save(DEFI_KEY, defi); defiSend(); };
  // une étape réussie : la course avance, le record aussi s'il est battu ; la 20e réussie, le Défi est terminé
  function defiWin() {
    defi.pos++;
    const rec = defi.pos > defi.best;
    if (rec) { defi.best = defi.pos; defi.bestDeparts = defi.departs; }
    defi.last = { type: defi.pos >= LIB.length ? 'fini' : 'ok', at: defi.pos - 1, rec, t: Date.now() };
    defiSave();
    return rec;
  }
  // une erreur, ou un abandon après avoir joué : retour au départ, une nouvelle course commence
  function defiFail() {
    defi.last = { type: 'fail', at: defi.pos, t: Date.now() };
    defi.pos = 0;
    defi.departs++;
    defiSave();
  }
  // le Défi terminé : une nouvelle course, pour battre son nombre de départs ou pour le plaisir
  function defiRestart() {
    defi.pos = 0;
    defi.departs++;
    defi.last = null;
    defiSave();
  }
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
      erreurs: lv2 ? G.fails : G.errors, montrees: G.helped, lent: !!G.usedSlow, duree: secsSince(G.t0), motif: why,
    });
  }
  const micErrs = new Set();
  Sound.setTranspose(inst().play);
  Sound.useSamples(inst().voice);

  let view = 'home';
  let G = null; // partie en cours
  applyVoice();
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  function stopAll() {
    if (G) { cancelAttempt(true); stopPlayback(true); }
    timers.forEach(clearTimeout);
    timers.clear();
  }
  function setWorld(theme) {
    const root = document.documentElement;
    if (theme) root.dataset.world = theme; else delete root.dataset.world;
    root.dataset.view = theme ? 'song' : 'home';
  }

  /* L'écran reste allumé dans une comptine (verrou d'écran, « Screen Wake Lock ») : sinon le téléphone posé sur le
     pupitre s'assombrit puis se met en veille pendant que l'élève joue, et le micro s'arrête. Rendu sur l'accueil.
     Le navigateur le lâche quand la page passe en arrière-plan : on le reprend au retour, et au premier toucher
     (certains navigateurs ne l'accordent qu'après un geste). Navigateur trop ancien : l'écran s'éteint comme avant. */
  const Veille = (() => {
    let lock = null, want = false, asking = false;
    async function take() {
      if (!want || lock || asking || document.hidden || !navigator.wakeLock) return;
      asking = true;
      try {
        const l = await navigator.wakeLock.request('screen');
        if (!want) { l.release().catch(() => {}); return; }
        lock = l;
        l.addEventListener('release', () => { if (lock === l) lock = null; });
      } catch (e) {
        /* refusé (mode économie d'énergie, page cachée…) : on réessaiera au prochain geste */
      } finally {
        asking = false;
      }
    }
    function drop() { const l = lock; lock = null; if (l) l.release().catch(() => {}); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) take(); });
    document.addEventListener('pointerdown', () => { take(); }, true);
    return { keep(on) { want = !!on; if (want) take(); else drop(); }, held: () => !!lock };
  })();

  /* ================================ ACCUEIL ================================ */
  const OFFSETS = [0, -26, 18, 28, -14, 26, -22, 12, -26, 20, -8, 24, -20, 10, -24, 18, -10, 26, -18, 8];

  function renderHome() {
    trackLeave('accueil');
    view = 'home';
    G = null;
    Veille.keep(false);
    if (Ear.active()) Ear.stop();
    D.leave();
    D = PAPER;
    setWorld(null);
    if (window.HomeSkin && window.HomeSkin.render({ app, LIB, records, settings, inst, instOptions, instNote, setInst, save, SET_KEY, star, ICON, esc, nb, titleHtml, LEVEL, framed, ONLINE_URL, LEGAL_URL, decorFor, GO, eleveHtml, bindEleve, HOWTO, songState, nextToPlay, defiHomeHtml })) {
      welcome(() => eleveRefresh(app.querySelector('.eleve-card')));
      homeExtras();
      return;
    }
    const NX = nextToPlay();
    const medals = jeu() === 'defi' ? '' : LIB.map((s, i) => {
      const best = +records[s.id] || 0, best2 = +records[s.id + '@2'] || 0;
      const st = songState(s, NX);
      const badge = best ? `<span class="medal-badge" aria-label="Record : ${best} étoile${best > 1 ? 's' : ''}">${[1, 2, 3].map((k) => star(k <= best, 15)).join('')}</span>` : '';
      // en Aventure : fermée (un cadenas ; la toucher dit laquelle terminer d'abord), ou la prochaine à jouer (« À toi ! »)
      return `<li class="medal${best ? ' is-won' : ''}${st.open ? '' : ' is-locked'}${st.next ? ' is-next' : ''}" data-i="${i}"><a class="medal-link" href="#${s.id}" style="--off:${OFFSETS[i % OFFSETS.length]}px">
        <span class="medal-disc" style="--c:${PAPER.color(s.theme)}">${Scenes.emblem(s.theme)}
          <svg class="medal-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="46"/></svg>
          <span class="medal-num" aria-hidden="true">${s.level}</span>${badge}${st.open ? '' : `<span class="medal-lock" aria-hidden="true">${ICON.lock}</span>`}${st.next ? `<span class="medal-next" aria-hidden="true">À toi${NB}!</span>` : ''}
        </span>
        <span class="medal-title">${titleHtml(s.title)}</span>
        <span class="medal-meta">${LEVEL(s.level)} · ${s.notes.length} notes${best2 ? `<span class="medal-r2" aria-label="Niveau 2 : ${best2} étoile${best2 > 1 ? 's' : ''}">${ICON.metro}${'★'.repeat(best2)}</span>` : ''}</span>${st.lockedBy ? `<span class="vh">, fermée${NB}: termine d’abord «${NB}${esc(nb(st.lockedBy.title))}${NB}»</span>` : ''}${st.next ? '<span class="vh">, la prochaine à jouer</span>' : ''}
      </a></li>`;
    }).join('');
    const chips = [['C', 'Do'], ['D', 'Ré'], ['E', 'Mi'], ['F', 'Fa'], ['G', 'Sol'], ['A', 'La'], ['B', 'Si']]
      .map(([l, n]) => `<span class="chip" data-l="${l}">${n}</span>`).join('');
    const micNote = framed && ONLINE_URL
      ? `<p class="inst-online">Ici, dans claude.ai, le micro n’est pas disponible. Pour jouer avec ton instrument, ouvre la <a href="${esc(ONLINE_URL)}" target="_blank" rel="noopener">version en ligne</a>.</p>`
      : '';
    app.innerHTML = `
    <main class="home grain">
      <div class="home-in">
        <header class="home-head">
          <p class="eyebrow">Jeu d’oreille · ${LIB.length} comptines</p>
          <h1 class="home-title"><span class="w">Les Notes</span><span class="w">Envol<span class="lift c1">é</span><span class="lift c2">e</span><span class="lift c3">s</span><span class="flyaway" aria-hidden="true"><i style="--c:var(--n-do);--dl:-.3s"></i><i style="--c:var(--n-sol);--dl:-1.1s;translate:0 -.25em"></i><i style="--c:var(--n-la);--dl:-1.9s;translate:0 -.55em"></i></span></span></h1>
          <p class="home-lede"><strong>Les notes se sont envolées.</strong> Retrouve-les à l’oreille : la page t’écoute au micro.</p>
          <div class="home-eleve">${eleveHtml()}${micNote}</div>
        </header>
        ${jeu() === 'defi' ? `<section class="dh" id="defi-home" aria-labelledby="dh-t">${defiHomeHtml(PAPER.color)}</section>` : `<section class="score" id="score" aria-label="Les comptines, de la plus facile à la plus difficile">
          <svg class="staff" aria-hidden="true"></svg>
          <ol class="medals">${medals}</ol>
        </section>`}
        <section class="defi-board" id="defi-board" aria-labelledby="db-t" hidden></section>
        <section class="howto">
          <h2>Comment jouer</h2>
          <ol class="steps">${HOWTO.map((t) => `<li><p>${t}</p></li>`).join('')}</ol>
          <div class="side-cards">
            <div class="legend">
              <h3>Le code couleur des notes</h3>
              <p>Toutes les comptines sont en do majeur : pas de dièse, pas de bémol. Les notes graves portent un point dessous, les aiguës un point dessus.</p>
              <div class="chips">${chips}</div>
            </div>
          </div>
        </section>
        <p class="home-foot">${Suivi.configured
          ? 'Chaque visite d’une comptine repart de zéro ; ton meilleur nombre d’étoiles reste sur cet appareil. Pour que ton professeur suive tes progrès et pour améliorer le jeu, le déroulé des parties (comptine, instrument, étoiles, erreurs) est enregistré avec ton prénom si tu l’as écrit et l’adresse IP de la connexion, puis effacé au bout de 13 mois ; le son du micro n’est jamais envoyé.'
          : 'Chaque visite d’une comptine repart de zéro ; seul ton meilleur nombre d’étoiles reste sur cet appareil.'} Le micro s’allume tout seul dans une comptine (le navigateur demande d’abord l’autorisation). Sur ordinateur, la barre d’espace lance «${NB}${GO}${NB}». Comptines traditionnelles du domaine public. Sons d’instruments enregistrés, libres de droits : VSCO 2 Community Edition, VCSL, Weresax (Karoryfer) et Sonatina Symphonic Orchestra (licence CC Sampling Plus 1.0). Reconnaissance des noms chantés : modèles tirés des voix de synthèse Kokoro (licence Apache 2.0).<a class="legal-link" href="${esc(LEGAL_URL)}">Mentions légales et confidentialité</a></p>
      </div>
    </main>`;
    const card = app.querySelector('.eleve-card');
    bindEleve(card);
    welcome(() => eleveRefresh(card));
    layoutMedals();
    homeExtras();
  }

  /* ---------------- le tableau d'honneur du Défi, sur l'accueil (pour tout le monde) ----------------
     Les meilleurs records du Défi, lus chez le Worker du suivi (GET /defi, sans clé) : seulement ceux des élèves
     qui l'ont accepté, avec le nom qu'ils ont donné (« Léa », ou « Léa M. »). Classement : le plus de comptines
     réussies d'affilée, puis le moins de départs (le Worker les appelle « comptines » et « essais »). Rien ne
     s'affiche si le Worker ne répond pas (pas encore mis à jour, hors ligne). En qualification, le tableau de la
     production (la qualification n'envoie rien). */
  const BOARD_URL = window.NE_SUIVI_LECTURE || Suivi.url;
  let defiSynced = false;
  function homeExtras() {
    // une fois par visite : la course du Défi repart au suivi (au cas où un envoi se serait perdu)
    if (!defiSynced && (defiStarted() || settings.affiche)) { defiSynced = true; defiSend(); }
    const again = app.querySelector('.dh-restart');
    if (again) again.addEventListener('click', () => { defiRestart(); route(false); });
    const box = app.querySelector('#defi-board');
    if (!box || !BOARD_URL) return;
    fetch(BOARD_URL + '/defi', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || !Array.isArray(j.classement) || !document.contains(box)) return;
        box.innerHTML = boardHtml(j.classement);
        box.hidden = false;
      })
      .catch(() => { /* pas de tableau d'honneur cette fois */ });
  }
  function boardHtml(list) {
    const me = settings.affiche ? publicName() : '';
    const rows = list.slice(0, 10).map((x, i) => {
      const n = Math.max(0, +x.comptines || 0), e = Math.max(1, +x.essais || 1);
      return `<li class="db-row${me && x.nom === me ? ' is-me' : ''}"><span class="db-rank">${i + 1}</span><span class="db-who"><b class="db-name">${esc(String(x.nom || '').slice(0, 30))}</b><span class="db-inst">${esc(instShort(x.inst))}</span></span><span class="db-score"><span><b>${n}</b>/${LIB.length}</span><small>${e === 1 ? 'du premier coup' : `au ${e}e départ`}</small></span></li>`;
    }).join('');
    return `<h2 class="db-t" id="db-t">${ICON.defi}<span>Défi${NB}: le tableau d’honneur</span></h2>
      <p class="db-sub">Le plus de comptines d’affilée, dans l’ordre, en rythme et sans erreur (à égalité, le moins de départs).</p>
      ${rows ? `<ol class="db-list">${rows}</ol>` : `<p class="db-empty">Personne pour l’instant. Choisis le mode Défi (bouton «${NB}Changer${NB}», en haut) et relève-le${NB}!</p>`}`;
  }

  /* ---------------- la présentation du Défi, sur l'accueil (les deux versions) ----------------
     À la place du chemin : la règle ; l'étape du moment (son décor, son titre, « Commencer », « Continuer » ou
     « Repartir » après un retour au départ) ; la course des 20 comptines (celles réussies dans cette course, celle
     du moment avec l'instrument de l'élève comme pion, le drapeau du record) ; le numéro du départ et le record.
     Après une erreur, la page le rappelle ; le Défi terminé, on peut le recommencer. colorOf : la couleur d'un décor
     (papier ou laine) ; discOf : l'image de l'étape du moment (en laine, le tambour de son décor en 3D ; sinon, le
     dessin du décor). */
  function defiHomeHtml(colorOf, discOf) {
    if (jeu() !== 'defi') return '';
    const N = LIB.length, i = defi.pos, cur = defiSong(), last = defi.last;
    const msg = !last ? ''
      : last.type === 'fail' ? `<p class="dh-msg is-fail">Retour au départ${NB}: tu étais à l’étape ${last.at + 1}. Ça repart${NB}!</p>`
        : last.type === 'ok' && last.rec && i === last.at + 1 ? `<p class="dh-msg is-ok">Nouveau record${NB}: ${defi.best} comptine${defi.best > 1 ? 's' : ''} d’affilée${NB}!</p>` : '';
    const now = cur
      ? `<div class="dh-now">
          ${discOf ? discOf(cur) : `<span class="dh-disc" style="--c:${colorOf(cur.theme)}" aria-hidden="true">${Scenes.emblem(cur.theme)}</span>`}
          <div class="dh-now-t">
            <p class="dh-k">Étape ${i + 1} sur ${N}</p>
            <h3 class="dh-title">${titleHtml(cur.title)}</h3>
            <p class="dh-meta">${LEVEL(cur.level)} · ${cur.notes.length} notes</p>
          </div>
          <a class="btn-big dh-go" href="#${cur.id}"><span class="ic">${ICON.play}</span><span>${i ? 'Continuer' : defi.departs > 1 ? 'Repartir' : 'Commencer'}</span></a>
        </div>`
      : `<div class="dh-now is-fini">
          <span class="dh-disc dh-cup" aria-hidden="true">${ICON.defi}</span>
          <div class="dh-now-t">
            <p class="dh-k">Défi terminé</p>
            <h3 class="dh-title">Les ${N} comptines d’affilée${NB}!</h3>
            <p class="dh-meta">${defi.bestDeparts > 1 ? `Au ${defi.bestDeparts}e départ.` : 'Du premier coup.'} Bravo${NB}!</p>
          </div>
          <button class="btn-big dh-go dh-restart" type="button"><span class="ic">${ICON.reset}</span><span>Recommencer le Défi</span></button>
        </div>`;
    const track = LIB.map((s, k) => {
      const c = colorOf(s.theme), st = k < i ? ` is-done${darkBg(c) ? ' is-dark' : ''}` : k === i ? ' is-now' : '';
      const what = k < i ? 'réussie dans cette course' : k === i ? 'à jouer maintenant' : 'pas encore';
      const rec = defi.best && k === defi.best - 1 ? `<span class="dh-rec" aria-hidden="true">${ICON.flag}</span>` : '';
      return `<li class="dh-case${st}" style="--c:${c}"><span class="vh">Étape ${k + 1}${NB}: ${esc(nb(s.title))}, ${what}${rec ? ' (ton record)' : ''}</span><span class="dh-n" aria-hidden="true">${k < i ? ICON.check : k + 1}</span>${rec}${k === i ? `<span class="dh-pawn" aria-hidden="true">${instPic()}</span>` : ''}</li>`;
    }).join('');
    const stats = [`Départ n°${NB}${defi.departs}`, `Record${NB}: ${defi.best ? `${defi.best} comptine${defi.best > 1 ? 's' : ''} d’affilée` : 'pas encore'}`, settings.affiche && canBoard() ? 'Au tableau d’honneur' : ''].filter(Boolean);
    return `<header class="dh-head">
        <h2 class="dh-t" id="dh-t">${ICON.defi}<span>Le Défi</span></h2>
        <p class="dh-rule">Les ${N} comptines dans l’ordre, au niveau 2${NB}: chacune d’un coup, en rythme et sans erreur. Une erreur (ou un abandon), et c’est le retour au départ${NB}!</p>
      </header>
      ${msg}${now}
      <div class="dh-board">
        <p class="dh-end dh-start" aria-hidden="true">${ICON.flag}<span>Départ</span></p>
        <ol class="dh-track" aria-label="La course${NB}: ${N} étapes">${track}</ol>
        <p class="dh-end dh-finish" aria-hidden="true"><span>Arrivée</span>${ICON.defi}</p>
      </div>
      <p class="dh-stats">${stats.map((x) => `<span>${x}</span>`).join('')}</p>`;
  }

  // une couleur de décor sombre (#rrggbb) : la coche d'une case réussie s'y écrit en clair
  function darkBg(hex) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return false;
    const lin = (k) => { const v = parseInt(m[1].slice(k, k + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4) < 0.21;
  }

  /* Aventure : une comptine pas encore ouverte (touchée sur le chemin, ou ouverte par un lien) dit laquelle terminer
     d'abord, propose la prochaine à jouer, et rappelle qu'en Découverte tout est ouvert. */
  function renderLocked(song) {
    trackLeave('autre');
    view = 'locked';
    G = null;
    Veille.keep(false);
    if (Ear.active()) Ear.stop();
    D.leave();
    D = PAPER;
    setWorld(song.theme); // les couleurs de la comptine…
    document.documentElement.dataset.view = 'locked'; // …mais une page qui défile, pas l'écran de jeu
    const DF = jeu() === 'defi', prev = LIB[LIB.indexOf(song) - 1], nx = DF ? defiSong() : nextToPlay();
    // en Défi : les comptines se jouent dans l'ordre (l'étape du moment) ; en Aventure : celle d'avant d'abord
    const why = !DF ? `Elle s’ouvrira quand tu auras terminé «${NB}${esc(nb(prev.title))}${NB}». En Aventure, les comptines s’ouvrent une à une.`
      : nx ? `En Défi, les comptines se jouent dans l’ordre. Ta prochaine étape${NB}: la ${defi.pos + 1}${defi.pos ? 'e' : 're'}, «${NB}${esc(nb(nx.title))}${NB}».`
        : `Tu as terminé le Défi${NB}! Recommence-le depuis l’accueil, ou passe en Découverte pour jouer celle-ci.`;
    app.innerHTML = `
    <main class="locked">
      <section class="lk-card" aria-labelledby="lk-t">
        <span class="lk-ic" aria-hidden="true">${DF ? ICON.defi : ICON.lock}</span>
        <p class="lk-k">Comptine ${song.level} · mode ${DF ? 'Défi' : 'Aventure'}</p>
        <h1 class="lk-t" id="lk-t">${titleHtml(song.title)}</h1>
        <p class="lk-p">${why}</p>
        <div class="lk-act">
          ${nx ? `<a class="btn-big lk-go" href="#${nx.id}"><span class="ic">${ICON.play}</span><span>Jouer «${NB}${esc(nb(nx.title))}${NB}»</span></a>` : ''}
          <a class="lk-back" href="#">${ICON.back}<span>${DF ? 'Le Défi' : 'Les comptines'}</span></a>
        </div>
        <p class="lk-free">Tout ouvrir${NB}? <button class="lk-disc" type="button">${ICON.decouverte}<span>Passer en mode Découverte</span></button></p>
      </section>
    </main>`;
    app.querySelector('.lk-disc').addEventListener('click', () => { setJeu('decouverte', settings.affiche); route(false); });
    const go = app.querySelector('.lk-go');
    if (go) go.focus({ preventScroll: true });
    welcome(() => {});
  }

  // « Comment jouer », sur l'accueil des deux versions
  const HOWTO = [
    'La première fois, la page te demande ton prénom, ton instrument (touche son dessin) et ta façon de jouer. Pour en changer, touche « Changer » en haut de l’accueil, ou le nom de ton instrument en haut d’une comptine : tout se change au même endroit, dans les réglages. Les noms de notes sont ceux de ta partition : la page joue dans le ton de ton instrument, avec son vrai son.',
    'Choisis une comptine : les plus faciles sont au début du chemin. Trois façons de jouer. Aventure : les comptines s’ouvrent une à une, termine-en une pour ouvrir la suivante. Découverte : tout est ouvert. Défi : les 20 comptines dans l’ordre, en rythme, d’un coup et sans erreur ; une erreur, et c’est le retour au départ. Si tu le veux, ton record paraît au tableau d’honneur de l’accueil.',
    'Choisis ton niveau. Niveau 1, les notes : retrouve-les à ton rythme. Niveau 2, notes et rythme : joue en mesure après le décompte. Au début, tu joues toute la comptine d’un coup ; ensuite, la page te ramène sur les phrases à corriger, une par une.',
    'De chaque côté du grand rond, choisis ce que tu joues : « Toute la comptine » ou « Phrase 1 » (la phrase affichée). Touche ensuite le grand rond « À toi de jouer ! » : la page la joue, compte « 1, 2, 3, 4 », puis c’est à toi. Pendant que tu joues, le rond montre la note qu’il entend. La première note de chaque phrase est écrite : joue-la, puis cherche les suivantes. Avec la voix, chante chaque note en disant son nom.',
    'Si ce n’est pas la bonne, une flèche t’aide : plus aigu ou plus grave. Chaque note retrouvée se pose à sa hauteur et le décor s’anime.',
    'Au niveau 1, pendant que tu joues une phrase, « Jusqu’à la note » la rejoue jusqu’à la note à trouver. Pour que la page joue plus lentement, touche le nom de ton instrument, en haut : « Vitesse : lente ».',
  ];

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
    /* marge de dessin : de quoi loger les bouts arrondis à gauche et à droite, presque rien en haut et en bas (la carte
       de l'élève est juste au-dessus : une zone peinte qui la chevauche la faisait salir par certains moteurs de rendu) */
    const MX = 200, MY = 40;
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    svg.innerHTML = `<defs><mask id="staff-mask" maskUnits="userSpaceOnUse" x="${-MX}" y="${-MY}" width="${W + 2 * MX}" height="${H + 2 * MY}"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#fff" stroke-width="64"/><path d="${d}" stroke="#000" stroke-width="60"/>
      <path d="${d}" stroke="#fff" stroke-width="34"/><path d="${d}" stroke="#000" stroke-width="30"/>
      <path d="${d}" stroke="#fff" stroke-width="3"/></g></mask></defs>
      <rect class="ink" x="${-MX}" y="${-MY}" width="${W + 2 * MX}" height="${H + 2 * MY}" mask="url(#staff-mask)"/>`;
  }

  /* ================================ COMPTINE ================================ */
  const wOf = (d) => (d <= 0.25 ? 0.8 : d <= 0.5 ? 0.9 : d <= 0.75 ? 0.95 : d <= 1 ? 1 : d <= 1.5 ? 1.25 : d <= 2 ? 1.45 : 1.7);
  const PRAISE = ['Bravo !', 'Oui !', 'Super !', 'Bien joué !', 'Exactement !', 'Quelle oreille !', 'C’est ça !', 'Génial !'];
  let el = {};

  function renderSong(song) {
    trackLeave(G && G.song === song ? 'recommence' : 'autre');
    view = 'song';
    Veille.keep(true);
    D.leave();
    D = decorFor(song.theme);
    setWorld(song.theme);
    // le Défi : toujours au niveau 2 (notes et rythme), à vitesse normale
    const DEFI = jeu() === 'defi';
    const keepSlow = !DEFI && G && G.slow;
    const lv2 = DEFI || settings.level === 2;
    G = {
      song, level: lv2 ? 2 : 1, found: new Set(), revealed: new Set(), errors: 0, attempts: 0, cursor: null, view: 0,
      slow: !!keepSlow, playing: null, done: false, lastStars: 0, defi: DEFI,
      // niveau 2
      passed: new Set(), fails: 0, tries: song.phrases.map(() => 0), take: null, results: [], moveTo: null, keepMic: false, fullRes: null,
      // whole : ce que joue le grand rond, toute la comptine (au début) ou la phrase affichée (au choix, les petits ronds)
      // begun : un essai est allé jusqu'au bout (en haut du pupitre, ce que dit la page remplace alors le niveau)
      // miss : notes manquées pendant la comptine entière (niveau 1) ; queue : phrases à corriger ; acts : gestes de l'élève
      whole: true, begun: false, miss: new Set(), queue: [], acts: 0,
      // live : essai en cours au niveau 1 (après l'écoute et le décompte) ; cnt : décompte du niveau 1 ; helped : notes montrées
      live: null, cnt: null, helped: 0, nudged: false,
      // suivi : début de la partie (temps page visible), « lentement » utilisé, résultat déjà envoyé
      t0: Suivi.clock(), usedSlow: !!keepSlow, tracked: false,
    };
    track('debut', { c: song.id, niveau: G.level, entiere: true });
    const idx = LIB.indexOf(song);
    const next = LIB[(idx + 1) % LIB.length];
    const span = song.maxStep - song.minStep;
    const panels = song.phrases.map((ph, p) => `
      <div class="panel" data-p="${p}"${p ? ' hidden' : ''}>
        <p class="ph-lyric">${ph.notes.map((n) => `<span class="syl" data-n="${n}">${esc(song.notes[n].syl)}</span>`).join('')}</p>
        <div class="beads" style="--span:${span};--cols:${ph.notes.map((n) => `${wOf(song.notes[n].dur)}fr`).join(' ')}">${ph.notes.map((n) => `<span class="bc"><button class="bead" type="button" data-n="${n}"><span>?</span></button></span>`).join('')}</div>
        <div class="rstrip" aria-hidden="true" hidden></div>
      </div>`).join('');
    const pills = song.phrases.map((ph, p) => `<li><button class="pill" type="button" data-p="${p}" aria-label="Phrase ${p + 1}">${p + 1}</button></li>`).join('');
    // le pupitre : de chaque côté du grand rond, un petit rond à la fois (les autres attendent leur moment, cachés) ;
    // au repos, les deux petits ronds choisissent ce que joue le grand rond (celui qui est choisi reste enfoncé)
    const side = (id, ic, lbl, aria = '') => `<button class="pu-side" id="${id}" type="button"${aria ? ` aria-label="${aria}"` : ''} hidden><span class="pu-ic">${ic}</span><span class="pu-lbl">${lbl}</span></button>`;
    const pick = (id, ic, lbl, on) => `<button class="pu-side pu-pick" id="${id}" type="button" aria-pressed="${on}" aria-describedby="pick-d"><span class="pu-ic">${ic}</span><span class="pu-lbl">${lbl}</span></button>`;
    app.innerHTML = `
    <main class="song" data-mode="${settings.mode}" data-level="${G.level}">
      <section class="stage grain" aria-label="Décor : ${esc(nb(song.title))}">
        ${D.markup(song, info())}
        <div class="stage-bar">
          <a class="back" href="#" aria-label="Les comptines">${ICON.back}<span>Les comptines</span></a>
          <button class="inst-pill" id="b-rg" type="button" aria-haspopup="dialog" aria-label="Réglages : ton prénom, le mode de jeu, le niveau, la vitesse et ton instrument" title="Réglages : ton prénom, le mode de jeu, le niveau, la vitesse et ton instrument">${ICON.note}<span class="ip-name" id="ip-name">${esc(instShort())}</span><span class="ip-slow" id="ip-slow"${G.slow ? '' : ' hidden'}>${ICON.turtle}</span>${ICON.chev}</button>
          <div class="stage-title" aria-hidden="true"><span>Comptine ${song.level} · ${LEVEL(song.level)}</span><b>${titleHtml(song.title)}</b></div>
          <a class="next-song" href="#${next.id}" aria-label="Comptine suivante : ${esc(nb(next.title))}"><span class="ns-ic">${ICON.next}</span><span class="ns-lock" hidden>${ICON.lock}</span></a>
        </div>
      </section>
      <section class="play">
        <header class="play-head">
          <p class="kicker">Comptine ${song.level} sur ${LIB.length} · ${LEVEL(song.level)}</p>
          <h1>${titleHtml(song.title)}</h1>
          <p class="instr" id="instr">${esc(instrLine(song))}</p>
        </header>
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
      <section class="pupitre" aria-label="À toi" data-band="repos">
        <div class="pu-top">
          ${DEFI ? '<p class="pu-first pu-defi" id="pu-defi"></p>' : `<div class="seg seg-level pu-first" role="radiogroup" aria-label="Niveau">
            <button type="button" role="radio" data-level="1" aria-checked="${!lv2}"><b class="lv">1</b><span>Les notes</span></button>
            <button type="button" role="radio" data-level="2" aria-checked="${lv2}"><b class="lv">2</b><span>Notes et rythme</span></button>
          </div>`}
          <p class="hint" id="hint" aria-live="polite" hidden></p>
        </div>
        <div class="pu-row">
          <div class="pu-slot">
            ${pick('b-phrase', ICON.phrase, `Phrase${NB}1`, false)}
            ${side('b-stop', ICON.stop, 'Arrêter')}
            ${side('b-level', lv2 ? ICON.note : ICON.metro, lv2 ? `Niveau${NB}1` : `Niveau${NB}2`, lv2 ? 'Niveau 1 : les notes' : 'Niveau 2 : notes et rythme')}
          </div>
          <div class="pu-mid">
            <button class="pu-go" id="b-go" type="button"><span class="ic">${ICON.metro}</span><b class="pu-go-t" id="go-t">À toi</b> <span class="pu-go-s" id="go-s">de jouer${NB}!</span></button>
            <div class="pu-ear" id="ear" hidden>${GAUGE}<span class="g-lo" aria-hidden="true">bas</span><span class="g-hi" aria-hidden="true">haut</span><div class="heard" id="heard"><span class="heard-n" id="heard-n">…</span><span class="heard-s" id="heard-s"></span></div></div>
          </div>
          <div class="pu-slot">
            ${pick('b-all', ICON.song, ALL_LBL, true)}
            ${side('b-restart', ICON.reset, 'Recommencer')}
            ${lv2 ? '' : side('b-to', Q_ICON, 'Jusqu’à la note', 'Écouter la phrase jusqu’à la note à trouver')}
            ${side('b-hear', ICON.play, 'Réécouter', 'Réécouter la note')}
            <a class="pu-side" id="a-next" href="#${next.id}" aria-label="Comptine suivante : ${esc(nb(next.title))}" hidden><span class="pu-ic">${ICON.next}</span><span class="pu-lbl">Suivante</span></a>
          </div>
        </div>
        <span id="pick-d" hidden>Ce que joue le grand rond, avant que tu joues</span>
        <div class="pu-msg" id="ear-msg" hidden></div>
      </section>
    </main>`;

    el = {
      main: app.querySelector('.song'),
      stage: app.querySelector('.stage'),
      bAll: app.querySelector('#b-all'),
      bPhrase: app.querySelector('#b-phrase'),
      bTo: app.querySelector('#b-to'),
      bGo: app.querySelector('#b-go'),
      goT: app.querySelector('#go-t'),
      goS: app.querySelector('#go-s'),
      bStop: app.querySelector('#b-stop'),
      bLevel: app.querySelector('#b-level'),
      bRestart: app.querySelector('#b-restart'),
      bHear: app.querySelector('#b-hear'),
      aNext: app.querySelector('#a-next'),
      bRg: app.querySelector('#b-rg'),
      instr: app.querySelector('#instr'),
      count: app.querySelector('#count'),
      card: app.querySelector('.card'),
      done: app.querySelector('#done'),
      pu: app.querySelector('.pupitre'),
      seg: app.querySelector('.pu-top .pu-first'), // le niveau ; en Défi, où en est le Défi de cette comptine
      hint: app.querySelector('#hint'),
      beads: [...app.querySelectorAll('.bead')].sort((a, b) => a.dataset.n - b.dataset.n),
      syls: [...app.querySelectorAll('.syl')].sort((a, b) => a.dataset.n - b.dataset.n),
      panels: [...app.querySelectorAll('.panel')],
      pills: [...app.querySelectorAll('.pill')],
      ear: app.querySelector('#ear'),
      earMsg: app.querySelector('#ear-msg'),
      heard: app.querySelector('#heard'),
      heardN: app.querySelector('#heard-n'),
      heardS: app.querySelector('#heard-s'),
      needle: app.querySelector('#needle'),
      ipName: app.querySelector('#ip-name'),
    };
    song.notes.forEach((_, n) => paintBead(n));
    song.phrases.forEach((_, p) => paintPill(p));
    paintCount();
    D.mount(el.stage, song, info());
    D.update(el.stage, info());
    bindSong();
    setCursor(null);
    applyMode();
    defiTop();
    nextLinkUI();
    idleHint();
    bandUI();
    // comptine ouverte directement (lien partagé), instrument jamais choisi : on le demande d'abord
    welcome(() => { if (G && view === 'song') { idleHint(); if (el.bGo) el.bGo.focus({ preventScroll: true }); } });
  }

  // en Défi, la ligne du haut du pupitre (à la place du niveau) : l'étape, le record ; puis réussie, ou retour au départ
  function defiTop() {
    if (!G || !G.defi || !el.seg) return;
    const k = LIB.indexOf(G.song) + 1, rec = defi.best ? `record ${defi.best}` : 'pas encore de record';
    el.seg.innerHTML = G.defiWon ? `${ICON.check}<span>Étape ${k} réussie · record ${defi.best}</span>`
      : G.defiFail ? `${ICON.defi}<span>Retour au départ · ${rec}</span>`
        : `${ICON.defi}<span>Défi · étape ${k} sur ${LIB.length} · ${rec}</span>`;
  }
  // Aventure : la flèche vers la comptine suivante porte un cadenas tant que celle-ci est fermée
  function nextLinkUI() {
    const a = app.querySelector('.next-song');
    if (!a || !G) return;
    const next = LIB[(LIB.indexOf(G.song) + 1) % LIB.length], shut = !isOpen(next);
    a.classList.toggle('is-locked', shut);
    a.querySelector('.ns-ic').hidden = shut;
    a.querySelector('.ns-lock').hidden = !shut;
    a.setAttribute('aria-label', `Comptine suivante${NB}: ${nb(next.title)}${shut ? ' (fermée : termine celle-ci pour l’ouvrir)' : ''}`);
  }

  /* ================= LE PUPITRE (en bas) =================
     Deux étages de taille fixe ; seul leur contenu change avec le moment de la partie :
       repos : en haut le niveau ; « Phrase n » · le grand rond (« À toi de jouer ! ») · « Toute la comptine » : les
               deux petits ronds choisissent ce que joue le grand rond, la phrase affichée ou toute la comptine
       jeu   : la consigne (écoute, décompte, « note n sur N », la réponse) ; Arrêter · le grand rond devient la note
               entendue, avec sa jauge · Recommencer (niveau 1, pendant une phrase : « Jusqu'à la note »)
       apres : en haut, ce que dit la page (le bilan, la phrase à corriger) ; en dessous, comme au repos
               (le grand rond : « Corriger la phrase n », « Jouer la phrase n », « Rejouer la comptine »…)
       cal   : le réglage de la voix ; Arrêter · la note entendue · Réécouter
       fin   : « Comptine terminée ! » ; l'autre niveau · « Rejouer » · Suivante */
  function bandState() {
    if (!G) return 'repos';
    if (G.done) return 'fin';
    if (G.cal) return 'cal';
    if (busy() || (el.main && el.main.classList.contains('is-taking'))) return 'jeu';
    return G.begun ? 'apres' : 'repos';
  }
  const SIDES = { repos: ['bPhrase', 'bAll'], jeu: ['bStop', 'bRestart'], apres: ['bPhrase', 'bAll'], cal: ['bStop', 'bHear'], fin: ['bLevel', 'aNext'] };
  // en Défi, toujours toute la comptine : ni « Phrase n » ni « Toute la comptine », ni l'autre niveau à la fin
  const SIDES_DEFI = { repos: [], jeu: ['bStop'], apres: [], cal: ['bStop', 'bHear'], fin: [] };
  const SIDE_KEYS = ['bPhrase', 'bStop', 'bLevel', 'bAll', 'bRestart', 'bTo', 'bHear', 'aNext'];
  function bandUI() {
    if (!G || !el.pu || !document.contains(el.pu)) return;
    const st = bandState();
    const shown = (G.defi ? SIDES_DEFI : SIDES)[st].slice();
    // en Défi, arrêter une prise après avoir joué, c'est abandonner : retour au départ
    if (el.bStop) el.bStop.querySelector('.pu-lbl').textContent = G.defi && st === 'jeu' ? 'Abandonner' : 'Arrêter';
    if (st === 'jeu' && el.bTo && G.live && !G.live.full) shown[1] = 'bTo';
    const had = el.pu.contains(document.activeElement) ? document.activeElement : null;
    el.pu.dataset.band = st;
    SIDE_KEYS.forEach((k) => { if (el[k]) el[k].hidden = !shown.includes(k); });
    const ear = st === 'jeu' || st === 'cal';
    el.bGo.hidden = ear;
    el.ear.hidden = !ear;
    // en haut : le niveau tant qu'aucun essai n'est allé au bout (sauf un message à lire, le temps de le lire), sinon ce que dit la page
    const seg = st === 'repos' && !(G.flashUntil > performance.now());
    el.seg.hidden = !seg;
    el.hint.hidden = seg;
    pickUI();
    goLabel(st);
    // le bouton qui avait le clavier vient de laisser sa place : le clavier passe au bouton principal du moment
    if (had && had.closest('[hidden]')) {
      const to = ear ? el.bStop : el.bGo;
      if (to && !to.hidden) to.focus({ preventScroll: true });
    }
  }
  // la phrase que jouerait le grand rond : celle qui est affichée, ou la suivante quand on vient d'en réussir une
  const goPhrase = () => (G.moveTo != null ? G.moveTo : G.view);
  /* ce que lance le grand rond : toute la comptine (« À toi de jouer ! », puis « Rejouer la comptine ») ; la phrase
     choisie (« Jouer », « Corriger » si elle est à corriger, « Rejouer » si elle est faite ou déjà essayée) */
  function goLabel(st = bandState()) {
    if (!G || !el.goT) return;
    let t = 'À toi', s = `de jouer${NB}!`;
    // en Défi : après une étape réussie, la suivante ; après une erreur, le départ (la comptine 1)
    if (G.defi && (st === 'fin' || G.defiFail)) {
      if (G.defiFail) [t, s] = G.song === LIB[0] ? ['Rejouer', 'la comptine'] : ['Repartir', 'du départ'];
      else [t, s] = defiSong() ? ['Continuer', `étape ${defi.pos + 1}`] : ['Bravo', `Défi terminé${NB}!`];
    } else if (st === 'fin' || (G.whole && G.fullRes)) { t = 'Rejouer'; s = 'la comptine'; } else if (!G.whole) {
      const q = goPhrase();
      t = G.queue.includes(q) && !isDone(q) ? 'Corriger' : isDone(q) || G.tries[q] ? 'Rejouer' : 'Jouer';
      s = `la phrase${NB}${q + 1}`;
    }
    el.goT.textContent = t;
    el.goS.textContent = s;
  }
  // un message à lire au repos (le niveau occupe la ligne du haut) : il prend sa place quelques secondes
  function flashTop(ms = 2800) {
    if (!G) return;
    G.flashUntil = performance.now() + ms;
    bandUI();
    later(() => { if (G) bandUI(); }, ms + 30);
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
    const complete = G.level === 2 ? G.passed.has(p) : f === ph.notes.length;
    pill.classList.toggle('is-done', complete);
    pill.classList.toggle('is-redo', G.queue.includes(p) && !complete);
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
    delete h.dataset.whole;
    h.className = 'hint' + (cls ? ' ' + cls : '');
    h.innerHTML = html;
    // une longue phrase tient sur deux lignes, en plus petit (la ligne du haut du pupitre a une hauteur fixe)
    h.classList.toggle('long', h.textContent.trim().length > 34);
    void h.offsetWidth;
    h.classList.add('pop');
  }

  function cursorHint() {
    if (!G.live || G.cursor == null) { idleHint(); return; }
    if (G.live.full) { wholeHint(); return; }
    const note = G.song.notes[G.cursor];
    const mic = settings.mode === 'mic';
    if (G.song.given.has(G.cursor) || G.revealed.has(G.cursor)) {
      const first = G.song.phrases[note.phrase].notes[0] === G.cursor && !G.revealed.has(G.cursor);
      const verb = singing() ? 'chante' : 'joue';
      setHint(`${first ? 'Note donnée : ' + verb : verb[0].toUpperCase() + verb.slice(1)} ${chip(note.letter, note.fr)}${mic && !singing() ? ' sur ton instrument' : ''}`, '');
    } else {
      setHint(singing() ? 'À toi : chante la note suivante' : mic ? 'À toi : joue la note suivante' : 'À toi : trouve la note suivante', '');
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
    pickUI();
    goLabel();
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
    toUI();
    expectNext();
    if (n == null) return;
    el.beads[n].classList.add('is-cursor');
    el.syls[n].classList.add('is-cur');
    showPhrase(G.song.notes[n].phrase, animate);
    if (hint) cursorHint();
  }

  // le pupitre suit l'essai (au niveau 1, « Jusqu'à la note » paraît pendant une phrase)
  function toUI() { bandUI(); }
  // les deux petits ronds du repos : « Phrase n » (la phrase que jouerait le grand rond) et « Toute la comptine » ;
  // celui qui est choisi est enfoncé
  function pickUI() {
    if (!G || !el.bPhrase) return;
    el.bPhrase.setAttribute('aria-pressed', String(!G.whole));
    el.bAll.setAttribute('aria-pressed', String(G.whole));
    el.bPhrase.querySelector('.pu-lbl').textContent = `Phrase${NB}${goPhrase() + 1}`;
  }

  function expectNext() {
    if (!G || G.cursor == null) { Ear.expect(null); return; }
    Ear.expect(mod12(G.song.notes[G.cursor].midi + inst().off));
  }

  /* ================= LES ESSAIS =================
     Le grand rond (« À toi de jouer ! ») : la page joue toute la comptine ou la phrase affichée,
     au choix (les petits ronds « Toute la comptine » et « Phrase n » ; au début, toute la
     comptine), puis le décompte, puis l'élève joue.
     - niveau 1 : les notes seules, à son rythme. Phrase par phrase, avec l'aide (flèches,
       note montrée) ; comptine entière, sans aide : une fausse note est comptée et on passe.
     - niveau 2 : notes et rythme (prise chronométrée, voir startTake).
     Un essai repart toujours de zéro sur ce qu'il couvre ; on peut rejouer autant qu'on veut
     (toute la comptine, une fois un essai allé au bout : c'est une nouvelle partie).
     Après la comptine entière : bilan, puis le grand rond passe aux phrases à revoir. Une
     phrase réussie, la suivante (ou la prochaine à revoir) démarre toute seule. */
  const NB = '\u00a0'; // espace insécable (« À toi de jouer ! » reste sur une ligne)
  const GO = `À toi de jouer${NB}!`;
  const whichPh = (qs) => (qs.length === 1 ? 'la phrase ' + (qs[0] + 1) : 'les phrases ' + qs.slice(0, -1).map((q) => q + 1).join(', ') + ' et ' + (qs[qs.length - 1] + 1));
  // la page prépare l'essai (écoute, décompte) ou l'élève joue une prise du niveau 2
  const prepping = () => !!(G && (G.take || G.cnt || (G.playing && G.playing.kind === 'go')));
  const busy = () => prepping() || !!(G && G.live);
  const isDone = (q) => (G.level === 2 ? G.passed.has(q) : G.song.phrases[q].notes.every((m) => G.found.has(m)));
  const stopSrc = (x) => { try { if (x) x.stop(); } catch (err) { /* déjà joué */ } };

  // le message quand rien ne se passe : ce que jouera le grand rond (après la comptine entière, la phrase à corriger)
  function idleHint() {
    if (!G || !el.hint || G.done || busy()) return;
    const q = G.view;
    // au repos, la ligne du haut montre le niveau : ce message ne se lit qu'une fois un essai allé au bout
    let html = G.defi ? (G.defiFail ? `Retour au départ${NB}! Ton record${NB}: ${defi.best || 'pas encore'}` : `Défi${NB}: toute la comptine, en rythme, sans erreur`) : G.level === 2 ? 'Toute la comptine, en rythme' : 'Toute la comptine, sans aide', cls = '', ready = false;
    if (!G.whole) {
      if (G.queue.includes(q) && !isDone(q)) { html = `À corriger${NB}: phrase ${q + 1}`; cls = 'up'; ready = true; }
      else if (isDone(q)) { html = `Phrase ${q + 1} ${G.level === 2 ? 'réussie' : 'retrouvée'}${NB}!`; cls = 'ok'; }
      else html = `Phrase ${q + 1}, ${G.level === 2 ? 'en rythme' : 'avec de l’aide'}`;
    }
    setHint(html, cls);
    if (el.bGo) el.bGo.classList.toggle('is-ready', ready);
    goLabel();
  }
  // une note jouée hors essai : on rappelle comment commencer (au repos, à la place du niveau, le temps de le lire)
  function nudge() {
    if (G.nudged || G.done) return;
    G.nudged = true;
    setHint(`Pour commencer, touche «${NB}${el.goT ? `${el.goT.textContent} ${el.goS.textContent}` : GO}${NB}»`, '');
    flashTop(3600);
  }

  function wholeHint() {
    const n = G.cursor, N = G.song.notes.length;
    const html = `Note ${n + 1} sur ${N}`;
    const h = el.hint;
    if (h && h.dataset.whole) { hintSeq++; h.className = 'hint'; h.innerHTML = html; return; }
    setHint(html, '');
    if (h) h.dataset.whole = '1';
  }

  // ce que lance le grand rond : toute la comptine, ou la phrase affichée (ou la suivante, si on vient d'en réussir une)
  function scope() {
    if (G.whole) { G.moveTo = null; return { full: true, p: 0 }; }
    if (G.moveTo != null) { const nx = G.moveTo; G.moveTo = null; showPhrase(nx); return { full: false, p: nx }; }
    return { full: false, p: G.view };
  }

  // niveau 1 : un nouvel essai cache de nouveau les notes qu'il couvre (la première de chaque phrase reste écrite)
  function resetNotes(ids) {
    ids.forEach((n) => { G.found.delete(n); G.revealed.delete(n); G.miss.delete(n); el.beads[n].classList.remove(...R_CLASSES); paintBead(n); });
    G.song.phrases.forEach((_, q) => paintPill(q));
    paintCount();
    D.update(el.stage, info());
  }

  function goAttempt(sc) {
    if (!G || G.done) return;
    // toute la comptine, une fois un essai allé au bout : une nouvelle partie (comme « Rejouer la comptine », à la fin)
    if ((sc ? sc.full : G.whole) && G.begun) { newRound(true); return; }
    if (G.cal) { G.cal = null; applyVoice(); }
    // la voix jamais réglée sur cet appareil : le premier essai commence par « Régler ma voix » (on peut l'arrêter)
    if (singing() && !hasMyVoice() && !G.calAsked) { G.calAsked = true; calStart(true); return; }
    cancelAttempt(true);
    stopPlayback(true); // une écoute en cours : on revient d'abord où l'on en était
    if (settings.mode === 'mic' && !Ear.active()) {
      G.keepMic = true;
      startMic().then(() => { if (G && Ear.active() && !busy()) goAttempt(sc); });
      return;
    }
    if (!Sound.ensure()) return;
    sc = sc || scope();
    G.attemptSc = sc;
    const song = G.song;
    const ids = sc.full ? song.notes.map((_, n) => n) : song.phrases[sc.p].notes;
    if (G.level === 1) resetNotes(ids);
    if (sc.full) { G.fullRes = null; song.phrases.forEach((_, q) => clearResult(q)); if (G.level === 1) G.miss.clear(); }
    else clearResult(sc.p);
    G.nudged = false;
    el.main.classList.add('is-taking');
    setGoUI(true);
    setHint(sc.full ? 'Écoute toute la comptine…' : `Écoute la phrase ${sc.p + 1}…`, '');
    playEvents(sc.full ? song.events : song.phrases[sc.p].events, 'go', (P) => {
      // écoute arrêtée avant la fin : pas d'essai
      if (!P.natural && G && !G.take && !G.cnt) { el.main.classList.remove('is-taking'); setGoUI(false); }
    }, { then: () => (G.level === 2 ? startTake(sc) : startCount(sc)) });
  }

  // niveau 1 : le décompte, puis l'élève joue
  function startCount(sc) {
    const p = sc.full ? 0 : sc.p;
    showPhrase(p, false);
    const ci = countIn(p);
    const c = Object.assign({}, ci, { sc, k: -1, raf: 0, srcs: ci.clicks.map((t, i) => Sound.clickAt(t, ci.downs[i])) });
    G.cnt = c;
    el.main.classList.add('is-taking');
    setGoUI(true);
    const tick = () => {
      if (!G || G.cnt !== c) return;
      const now = Sound.now() - Sound.outLatency();
      const k = Math.floor((now - c.clicks[0]) / c.beatSec + 0.001);
      if (k >= 0 && k < c.N && k !== c.k) { c.k = k; showCount(c, k); retrigger(el.card, 'beat'); }
      if (now >= c.T0 - 0.04) { G.cnt = null; beginLive(sc); return; }
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
  }

  function beginLive(sc) {
    G.live = sc;
    // comptine entière, sans aide : écoute et choix des phrases fermés le temps de l'essai
    el.main.classList.toggle('is-taking', !!sc.full);
    const first = sc.full ? 0 : G.song.phrases[sc.p].notes.find((m) => !G.found.has(m));
    setCursor(first, true, false);
    setHint('Joue !', 'go');
    laterHint(() => { if (G && G.live === sc) cursorHint(); }, 700);
  }

  function endLive() {
    if (!G || !G.live) return;
    G.live = null;
    el.main.classList.remove('is-taking');
    setCursor(null);
    setGoUI(false);
  }

  function cancelAttempt(silent) {
    if (!G) return;
    const had = busy();
    if (G.playing && G.playing.kind === 'go') stopPlayback(true);
    if (G.cnt) { cancelAnimationFrame(G.cnt.raf); G.cnt.srcs.forEach(stopSrc); G.cnt = null; }
    if (G.take) cancelTake(true);
    if (G.live) { G.live = null; setCursor(null); }
    if (el.main) el.main.classList.remove('is-taking');
    setGoUI(false);
    if (had && !silent) idleHint();
  }

  // après une phrase réussie : la prochaine à travailler (d'abord celles à revoir après la comptine entière, puis la suivante pas encore faite)
  function nextTarget(p) {
    const N = G.song.phrases.length;
    const order = Array.from({ length: N }, (_, k) => (p + 1 + k) % N).filter((q) => !isDone(q));
    const queued = order.filter((q) => G.queue.includes(q));
    return queued.length ? queued[0] : order.length ? order[0] : null;
  }
  // elle démarre toute seule (écoute, décompte), sauf si l'élève a fait autre chose entre-temps
  function chain(p) {
    const nx = nextTarget(p);
    if (nx == null) return;
    G.moveTo = nx;
    bandUI(); // le grand rond l'annonce déjà (« Jouer la phrase n »)
    const tok = G.acts;
    later(() => { if (G && G.moveTo === nx && G.acts === tok && !busy() && !G.done && !G.playing) goAttempt(); }, 1300);
  }

  /* ---------- comptine entière, niveau 1 : toutes les notes dans l'ordre, sans aide ---------- */
  function wholeNote(ok, fromEl) {
    const n = G.cursor, note = G.song.notes[n], bead = el.beads[n];
    if (ok) {
      G.found.add(n);
      if (fromEl) retrigger(fromEl, 'is-good');
      paintBead(n);
      bead.style.opacity = '0';
      flyTo(fromEl, bead, note, () => { bead.style.opacity = ''; retrigger(bead, 'pop'); });
    } else {
      G.errors++;
      G.miss.add(n);
      if (fromEl) retrigger(fromEl, 'is-wrong');
      bead.classList.add('r-wrong');
    }
    paintCount();
    paintPill(note.phrase);
    const st = info();
    D.update(el.stage, st);
    if (ok) D.react(el.stage, 'correct', st);
    if (n + 1 < G.song.notes.length) { setCursor(n + 1, true, true); return; }
    endLive();
    endWhole();
  }

  function endWhole() {
    const song = G.song, N = song.notes.length;
    const status = song.phrases.map((ph) => (ph.notes.some((m) => G.miss.has(m)) ? 'bad' : 'ok'));
    const bad = status.map((st, q) => (st === 'bad' ? q : -1)).filter((q) => q >= 0);
    const right = N - G.miss.size;
    const text = bad.length ? `À corriger : ${whichPh(bad)}` : 'Toute la comptine, sans une erreur !';
    G.fullRes = { pass: !bad.length, text, status, sum: bad.length ? `Toute la comptine d’un coup : ${right} notes justes sur ${N}.` : 'Toute la comptine d’un coup, sans une erreur !' };
    track('bilan', { c: song.id, niveau: 1, notes: true, reussi: !bad.length, parfait: !bad.length, justes: right, sur: N, phrases: status.map((st) => (st === 'ok' ? 2 : 0)) });
    if (!bad.length) { setHint(text, 'ok'); flashTop(1400); D.react(el.stage, 'complete', info()); later(() => { if (G && !G.done) finish(); }, 900); return; }
    toReview(bad, text);
  }

  // après la comptine entière : directement sur la première phrase à revoir ; le grand rond passe à la phrase et la propose
  function toReview(bad, text) {
    G.queue = bad;
    G.whole = false;
    G.begun = true;
    G.song.phrases.forEach((_, q) => paintPill(q));
    showPhrase(bad[0]);
    setHint(text, 'up');
    if (el.bGo) el.bGo.classList.add('is-ready');
    bandUI();
  }

  // nouvelle partie de la même comptine, toute la comptine d'abord (go : l'essai démarre tout de suite)
  function newRound(go) {
    const had = !!(el.pu && el.pu.contains(document.activeElement)); // le clavier était sur le pupitre : il y reste
    stopAll();
    renderSong(G.song);
    if (go) goAttempt();
    if (had) { const to = el.bStop.hidden ? el.bGo : el.bStop; if (!to.hidden) to.focus({ preventScroll: true }); }
  }

  /* ---------------- réponses (au micro) ---------------- */
  let heardSyl = null; // la dernière syllabe reconnue, montrée un instant sous la note entendue
  function heardNote(hit) {
    if (!G || settings.mode !== 'mic') return;
    // seulement un nom dont la reconnaissance est sûre (nettement plus proche que tous les autres)
    if (hit.syl) heardSyl = PitchKit.SYL.every((s) => s === hit.syl.best || PitchKit.sayMatch(hit.syl, s, hit.syl.user) === 'non') ? { s: hit.syl.best, pc: mod12(hit.r), t: performance.now() } : null;
    if (G.cal) { calHit(hit); return; }
    if (G.take) { recordNote({ t: (hit.t != null ? hit.t : Sound.now()) - Sound.outLatency() - 0.03, written: hit.r - inst().off, hit, syl: hit.syl }); return; }
    if (G.done) return;
    if (!G.live && !prepping() && !G.playing) { if (G.moveTo == null) nudge(); return; }
    if (G.level === 2 || !G.live || G.cnt) return;
    if (G.cursor == null) return;
    if (G.playing) {
      // l'élève peut jouer un peu avant la fin de la dernière note de la page
      if (Sound.now() < G.playing.noteEnd - Sound.EARLY - 0.05) return;
      stopPlayback(false);
    }
    const written = hit.r - inst().off;
    const target = G.song.notes[G.cursor];
    const pitchOk = rightPitch(hit, target.midi);
    const said = singing() ? nameSaid(hit.syl, target.midi) : null;
    if (G.live.full) {
      if (pitchOk) tuneTo(hit, target.midi);
      wholeNote(pitchOk && said !== 'non', el.heard);
      return;
    }
    if (pitchOk && said === 'non') {
      // la bonne hauteur, mais un autre nom
      tuneTo(hit, target.midi);
      retrigger(el.heard, 'is-wrong');
      bad(`Bonne hauteur${NB}! Mais j’entends «${NB}${SYL_FR[hit.syl.best]}${NB}»${NB}: chante «${NB}${SYL_FR[sylOf(target.midi)]}${NB}»`, null);
    } else if (pitchOk) {
      tuneTo(hit, target.midi);
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
    el.beads[n].classList.remove(...R_CLASSES); // manquée pendant la comptine entière, retrouvée maintenant
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
    if (st.done) { endLive(); later(() => finish(), 520); return; }
    const next = ph.notes.find((m) => m > n && !G.found.has(m));
    if (next != null) { setCursor(next, true, false); laterHint(() => { if (G && G.cursor === next) cursorHint(); }, 650); return; }
    // phrase retrouvée : fin de l'essai ; la suivante démarre toute seule
    G.begun = true;
    endLive();
    setHint(`Phrase ${p + 1} retrouvée !`, 'ok');
    chain(p);
  }

  function bad(text, up, rightTxt, leftTxt) {
    G.errors++;
    G.attempts++;
    // up : la flèche (plus aigu, plus grave) ; null : pas de flèche (la voix : bonne hauteur, mauvais nom)
    const html = up == null ? text : up ? `${text} ${ICON.right}${rightTxt ? `<small>${rightTxt}</small>` : ''}` : `${ICON.left} ${text}${leftTxt ? ` <small>${leftTxt}</small>` : ''}`;
    setHint(html, up == null ? 'down' : up ? 'up' : 'down');
    if (G.attempts >= 3 && G.cursor != null) {
      const target = G.song.notes[G.cursor];
      if (!G.revealed.has(G.cursor) && !G.song.given.has(G.cursor)) {
        G.revealed.add(G.cursor);
        G.helped++;
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
    // à la fin de l'écoute, on revient à la phrase où l'on en était (même quand cette écoute en remplace une autre)
    const home = G.playing ? G.playing.home : G.view;
    stopPlayback(true, true);
    if (!Sound.ensure()) { setHint('Le son n’est pas disponible dans ce navigateur.', ''); flashTop(4500); goBack(home); return; }
    let a = 0;
    while (a < evs.length && evs[a].rest) a++;
    evs = evs.slice(a);
    if (!evs.length) { goBack(home); return; }
    const spb = 60 / (G.song.bpm * (G.slow ? 0.68 : 1));
    const base = evs[0].t;
    const items = evs.filter((e) => !e.rest).map((e) => ({
      midi: e.midi, n: e.n, start: (e.t - base) * spb, dur: e.dur * spb,
      vel: 0.8 + 0.2 * e.accent + (Math.random() - 0.5) * 0.04,
    }));
    const lastEv = evs[evs.length - 1];
    const total = (lastEv.t + lastEv.dur - base) * spb;
    const h = Sound.sequence(voiceNow(), items, opts.at ? Math.max(0.05, opts.at - Sound.now()) : undefined);
    if (!h) { goBack(home); return; }
    const noteEnd = h.t0 + items.reduce((m, it) => Math.max(m, it.start + it.dur), 0);
    const P = { h, items, kind, t0: h.t0, end: h.t0 + total, noteEnd, cur: -1, raf: 0, onEnd, home, srcs: opts.srcs || [], ci: opts.ci || null, k: -1, then: opts.then || null, natural: false };
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
      if (now >= P.end + 0.05) {
        P.natural = true;
        stopPlayback(false, !!P.then); // l'écoute qui précède un essai passe la main au décompte
        if (P.then && G) P.then();
        return;
      }
      P.raf = requestAnimationFrame(tick);
    };
    P.raf = requestAnimationFrame(tick);
  }

  // handOver : une autre écoute prend la suite (c'est elle qui reviendra à la bonne phrase)
  function stopPlayback(fade, handOver) {
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
    if (P.onEnd) P.onEnd(P);
    if (!handOver) goBack(P.home);
  }

  /* Après une écoute (toute la comptine passe d'une phrase à l'autre), revenir où
     l'on en était : niveau 1, la phrase de la note cherchée ; niveau 2, la phrase
     travaillée avant d'écouter, ou la suivante si elle vient d'être réussie. */
  function goBack(home) {
    if (!G || prepping() || G.done) return;
    if (G.cursor != null) { showPhrase(G.song.notes[G.cursor].phrase, true); return; }
    if (G.moveTo != null) { moveOn(); return; }
    showPhrase(home, true);
  }

  function highlight(n, on) {
    el.beads[n].classList.toggle('is-on', on);
    el.syls[n].classList.toggle('is-on', on);
    D.note(el.stage, n, on);
  }

  // pendant son écoute, « Jusqu'à la note » devient « Arrêter »
  function sideBusy(b, on, ic, lbl, aria) {
    if (!b) return;
    b.classList.toggle('is-on', on);
    b.querySelector('.pu-ic').innerHTML = on ? ICON.stop : ic;
    b.querySelector('.pu-lbl').textContent = on ? 'Arrêter' : lbl;
    b.setAttribute('aria-label', on ? 'Arrêter l’écoute' : aria);
  }
  const Q_ICON = '<span class="q" aria-hidden="true">?</span>';
  function setPlayingUI(kind, on) {
    el.main.classList.toggle('is-playing', on);
    if (kind === 'to') sideBusy(el.bTo, on, Q_ICON, 'Jusqu’à la note', 'Écouter la phrase jusqu’à la note à trouver');
    bandUI();
  }

  const ALL_LBL = 'Toute la comptine';
  function playAll() { playEvents(G.song.events, 'all'); } // à la fin de la comptine, pour fêter
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
     compter au moins trois temps. On les compte d'un bout à l'autre (« 1 2 3 4 »,
     même en 2/4 ; « 1 2 3 » pour une levée sur le 2e temps en 2/4, ou sur le 3e temps
     et demi en 4/4) ; le premier temps de chaque mesure sonne plus fort (downs). */
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
    const labels = clicks.map((_, k) => k + 1);
    const downs = clicks.map((_, k) => (((k - full) % perBar) + perBar) % perBar === 0);
    return { N, clicks, labels, downs, beatSec, spb, T0: c0 + (full + pos) * beatSec };
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
    setHint(`<span class="cin" aria-label="Décompte : ${ci.labels[k]}">${ci.labels.map((l, i) => `<b class="${i < k ? 'past' : i === k ? 'on' : ''}">${l}</b>`).join('')}</span>`, 'count');
  }


  // pendant un essai, le grand rond devient l'oreille (la note entendue) ; « Arrêter » paraît à sa gauche
  function setGoUI(on) {
    if (!el.bGo) return;
    if (on) el.bGo.classList.remove('is-ready');
    bandUI();
  }

  /* Niveau 2, une prise (après l'écoute) : décompte, puis l'élève joue
     une phrase, ou toute la comptine (full), en rythme. */
  function startTake(sc) {
    if (!G || G.level !== 2) return;
    const song = G.song, full = !!sc.full;
    const p = full ? 0 : sc.p;
    showPhrase(p, false);
    const ci = countIn(p);
    const idx = full ? song.notes.map((_, n) => n) : song.phrases[p].notes;
    const t0 = song.notes[idx[0]].t;
    const exp = idx.map((n) => { const nt = song.notes[n]; return { n, t: (nt.t - t0) * ci.spb, midi: nt.midi, ph: nt.phrase }; });
    const starts = song.phrases.map((ph) => (song.notes[ph.notes[0]].t - t0) * ci.spb);
    const tk = Object.assign({}, ci, {
      p, full, exp, starts, got: [], phase: 'count', k: -1, raf: 0, mic: settings.mode === 'mic', sing: singing() && Ear.voiceOk(),
      Tend: ci.T0 + exp[exp.length - 1].t + Math.max(0.9, 1.6 * ci.beatSec),
      srcs: ci.clicks.map((t, i) => Sound.clickAt(t, ci.downs[i])),
    });
    G.take = tk;
    el.main.classList.add('is-taking');
    setGoUI(true);
    expectTake(tk);
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
    if (tk.pend) tk.pend--; // la voix : cette note était déjà comptée dans l'attente (heardPending)
    const t = n.t - tk.T0;
    if (t >= -0.6 * tk.beatSec) tk.got.push({ t, midi: n.midi, written: n.written, hit: n.hit, syl: n.syl }); // pas pendant le décompte
    expectTake(tk);
  }
  /* L'oreille attend la prochaine note de la prise. Quand on chante, une note n'arrive qu'avec sa syllabe, un peu après
     son début : la prochaine est attendue dès que la note est entendue (heardPending), et aussi les deux d'après (une
     note manquée ne retarde pas les suivantes). */
  function expectTake(tk) {
    if (!tk.mic) return;
    const k = Math.min(tk.got.length + (tk.pend || 0), tk.exp.length - 1), n = tk.sing ? 3 : 1, pcs = [];
    for (let i = k; i < Math.min(tk.exp.length, k + n); i++) pcs.push(mod12(tk.exp[i].midi + inst().off));
    Ear.expect(pcs);
  }
  function heardPending() {
    const tk = G && G.take;
    if (!tk || !tk.mic) return;
    tk.pend = (tk.pend || 0) + 1;
    expectTake(tk);
  }

  function cancelTake(silent) {
    const tk = G && G.take;
    if (!tk) return;
    cancelAnimationFrame(tk.raf);
    tk.srcs.forEach((x) => { try { if (x) x.stop(); } catch (e) { /* déjà joué */ } });
    G.take = null;
    // le Défi : une comptine commencée puis arrêtée (un abandon, si l'élève a joué) renvoie au départ
    if (G.defi && tk.full && tk.phase === 'play' && tk.got.length && !G.defiFail) { defiFail(); G.defiFail = true; G.begun = true; defiTop(); }
    if (el.main) el.main.classList.remove('is-taking');
    setGoUI(false);
    if (tk.mic) Ear.expect(null);
    if (!silent) idleHint();
  }

  // phrase réussie : on passe à la suivante (tout de suite si l'élève relance)
  function moveOn() {
    const nx = G.moveTo;
    G.moveTo = null;
    if (nx == null || busy() || G.done) return;
    showPhrase(nx);
    idleHint();
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
    // la voix : la bonne hauteur ET le bon nom (sauf si la reconnaissance hésite)
    const same = tk.mic ? (e, g) => rightPitch(g.hit, e.midi) && !(tk.sing && nameSaid(g.syl, e.midi) === 'non') : (e, g) => g.midi === e.midi;
    const r = Rhythm.evaluate({ exp: tk.exp, got: tk.got, beat: tk.beatSec, same, mic: tk.mic });
    if (tk.full) { endFullTake(tk, r); return; }
    G.begun = true;
    setGoUI(false);
    const ph = G.song.phrases[tk.p];
    let fresh = 0;
    r.notes.forEach((x) => { if (x.kind === 'right' && !G.found.has(tk.exp[x.i].n)) { G.found.add(tk.exp[x.i].n); fresh++; } });
    if (!r.pass && ++G.tries[tk.p] % 3 === 0) {
      // trois essais manqués : on montre une note de plus
      const hide = ph.notes.find((n) => !G.found.has(n) && !G.song.given.has(n) && !G.revealed.has(n));
      if (hide != null) { G.revealed.add(hide); G.helped++; }
    }
    ph.notes.forEach((n) => paintBead(n));
    G.results[tk.p] = phraseResult(tk, r, tk.p);
    showResult(tk.p);
    let v = Rhythm.verdict(r, (i) => `La ${i ? i + 1 + 'e' : '1re'} note`);
    if (tk.sing && !r.pass && r.wrong && !r.missed) {
      // les seules fausses notes sont à la bonne hauteur : c'est le nom qui n'allait pas
      const slips = r.notes.filter((x) => x.kind === 'wrong').map((x) => [tk.exp[x.i], tk.got[x.j]]).filter(([e2, g]) => rightPitch(g.hit, e2.midi));
      if (slips.length === r.wrong) {
        const [e2, g] = slips[0];
        v = { mood: 'down', text: slips.length === 1 ? `Bonne hauteur, mais j’entends «${NB}${SYL_FR[g.syl.best]}${NB}» au lieu de «${NB}${SYL_FR[sylOf(e2.midi)]}${NB}».` : `${slips.length} notes à la bonne hauteur, mais pas avec le bon nom.` };
      }
    }
    setHint(v.text, v.mood);
    if (r.pass) G.passed.add(tk.p); else G.fails++;
    paintPill(tk.p);
    paintCount();
    goLabel(); // manquée : « Rejouer la phrase n »
    const st = info();
    D.update(el.stage, st);
    if (r.pass) D.react(el.stage, 'phrase', st);
    else if (fresh) D.react(el.stage, 'correct', st);
    if (!r.pass) return;
    if (st.done) { later(() => { if (G && !busy() && !G.done) finish(); }, 1400); return; }
    chain(tk.p);
  }

  // toute la comptine jouée d'un coup (niveau 2) : bilan phrase par phrase, puis les phrases à revoir
  function endFullTake(tk, r) {
    const song = G.song;
    const status = song.phrases.map((_, q) => {
      const res = phraseResult(tk, r, q);
      G.results[q] = res;
      return res ? res.status : 'bad';
    });
    song.phrases.forEach((_, q) => showResult(q));
    setGoUI(false);
    if (!r.played) { setHint('Je n’ai rien entendu…', 'up'); flashTop(3600); return; }
    const bad = status.map((st, q) => (st === 'bad' ? q : -1)).filter((q) => q >= 0);
    let text;
    if (!bad.length) text = r.perfect ? 'Juste et en rythme : parfait !' : 'Toute la comptine en rythme !';
    else text = `À corriger : ${whichPh(bad)}`;
    G.fullRes = { pass: !bad.length, text, status, sum: !bad.length ? text : `Toute la comptine d’un coup : ${r.inPlace} notes sur ${r.total} bien en place.` };
    track('bilan', {
      c: song.id, niveau: G.level, reussi: !!r.pass, parfait: !!r.perfect, justes: r.right, enPlace: r.inPlace, sur: r.total,
      phrases: status.map((st) => (st === 'ok' ? 2 : st === 'near' ? 1 : 0)), derive: r.drift || '',
    });
    // les notes justes sont retrouvées ; les phrases sans faute grave comptent comme réussies
    r.notes.forEach((x) => { if (x.kind === 'right') G.found.add(tk.exp[x.i].n); });
    status.forEach((st, q) => { if (st === 'bad') { G.fails++; G.passed.delete(q); } else G.passed.add(q); });
    song.notes.forEach((_, n) => paintBead(n));
    song.phrases.forEach((_, q) => paintPill(q));
    paintCount();
    const st = info();
    D.update(el.stage, st);
    D.react(el.stage, bad.length ? 'phrase' : 'complete', st);
    // le Défi : sans erreur, l'étape est réussie (la course avance) ; sinon, retour au départ (pas de phrases à corriger)
    if (G.defi) {
      if (!bad.length) {
        const rec = defiWin();
        G.defiWon = true;
        defiTop();
        setHint(!defiSong() ? `Défi terminé${NB}!` : rec && defi.best > 1 ? `Nouveau record${NB}: ${defi.best}${NB}!` : `Étape réussie${NB}!`, 'ok');
        flashTop(2300);
        later(() => { if (G && !busy() && !G.done) finish(); }, 1800);
        return;
      }
      defiFail();
      G.defiFail = true;
      G.queue = bad; // les phrases fautives restent entourées
      G.begun = true;
      song.phrases.forEach((_, q) => paintPill(q));
      defiTop();
      const ph = whichPh(bad);
      setHint(`${ph[0].toUpperCase() + ph.slice(1)} ${bad.length > 1 ? 'ont' : 'a'} des erreurs${NB}: retour au départ${NB}!`, 'up');
      bandUI();
      return;
    }
    if (!bad.length) { setHint(text, 'ok'); flashTop(2300); later(() => { if (G && !busy() && !G.done) finish(); }, 1800); return; }
    toReview(bad, text);
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
    cancelAttempt(true);
    pauseMicDone();
    const lv2 = G.level === 2;
    // niveau 1 : fausses notes par note ; niveau 2 : essais manqués par phrase
    const r = lv2 ? G.fails / G.song.phrases.length : G.errors / G.song.notes.length;
    const stars = lv2 ? (r <= 0.25 ? 3 : r <= 1 ? 2 : 1) : (r <= 0.2 ? 3 : r <= 0.6 ? 2 : 1);
    const key = lv2 ? G.song.id + '@2' : G.song.id;
    G.lastStars = stars;
    // Aventure : terminer cette comptine ouvre la suivante
    const next = LIB[(LIB.indexOf(G.song) + 1) % LIB.length], wasShut = !isOpen(next);
    if (stars > (+records[key] || 0)) { records[key] = stars; save(REC_KEY, records); }
    G.unlocked = wasShut && isOpen(next) ? next : null;
    nextLinkUI();
    track('fin', {
      c: G.song.id, niveau: G.level, etoiles: stars, erreurs: lv2 ? G.fails : G.errors, sur: lv2 ? G.song.phrases.length : G.song.notes.length,
      montrees: G.helped, lent: !!G.usedSlow, duree: secsSince(G.t0), entiere: !!G.fullRes,
    });
    G.tracked = true;
    D.update(el.stage, info());
    D.react(el.stage, 'complete', info());
    showDone();
    setHint('Comptine terminée !', 'ok');
    confetti();
    later(() => Sound.flourish(voiceNow()), 250);
    later(() => { if (G && G.done && !G.playing) playAll(); }, 1500);
  }

  // la carte de fin dit le résultat ; la suite (l'autre niveau, rejouer, la comptine suivante) est dans le pupitre
  function showDone() {
    const stars = G.lastStars;
    const lv2 = G.level === 2;
    const e = lv2 ? G.fails : G.errors;
    const more = `Recommence-la pour ${stars < 3 ? 'gagner plus d’étoiles' : 'faire encore mieux'}.`;
    const msg = lv2
      ? (e === 0 ? 'Chaque phrase réussie du premier coup : quel sens du rythme !' : `Avec ${e} essai${e > 1 ? 's' : ''} de plus. ${more}`)
      : (e === 0 ? 'Sans une seule erreur. Quelle oreille !' : `Avec ${e} essai${e > 1 ? 's' : ''} de trop. ${more}`);
    const fr = G.fullRes;
    const full = fr
      ? `<div class="full-res${fr.pass ? ' is-ok' : ''}"><p>${esc(fr.sum || fr.text)}</p><ol class="full-ph" aria-label="Phrase par phrase">${fr.status.map((st, q) => `<li class="${st}" title="Phrase ${q + 1}">${q + 1}</li>`).join('')}</ol></div>`
      : `<p class="full-ask">Et maintenant, toute la comptine d’un coup${lv2 ? ', en rythme' : ', sans aide'} ?</p>`;
    // le Défi : l'étape réussie, le record battu, la prochaine étape ; et ce qu'il faut pour paraître au tableau d'honneur
    let title = lv2 ? 'Juste et en rythme&#160;!' : 'Toutes les notes sont revenues&#160;!', text = msg;
    if (G.defi) {
      const k = LIB.indexOf(G.song) + 1, nx = defiSong(), L = defi.last || {};
      title = nx ? `Étape ${k} réussie&#160;!` : 'Défi terminé&#160;!';
      text = !nx ? `Les ${LIB.length} comptines d’affilée, dans l’ordre et sans erreur. Quelle course${NB}!`
        : `${L.rec && defi.best > 1 ? `Nouveau record${NB}: ${defi.best} comptines d’affilée. ` : ''}Prochaine étape${NB}: «${NB}${esc(nb(nx.title))}${NB}».`;
      text += (settings.affiche && canBoard()) || !sendsHere() ? '' : publicName() ? ' Pour paraître au tableau d’honneur de l’accueil, coche la case dans les réglages.' : ` Pour paraître au tableau d’honneur de l’accueil, écris ton prénom (bouton «${NB}Changer${NB}» de l’accueil).`;
    }
    const unlocked = G.unlocked ? `<p class="done-unlock">${ICON.decouverte}<span>Nouvelle comptine ouverte${NB}: «${NB}${esc(nb(G.unlocked.title))}${NB}»</span></p>` : '';
    el.done.innerHTML = `
      <div class="done-head"><div class="done-stars" aria-label="${stars} étoile${stars > 1 ? 's' : ''} sur 3">${[1, 2, 3].map((k) => star(k <= stars, 38)).join('')}</div>
      <h2>${title}</h2></div>
      <p>${text}</p>
      ${unlocked}${full}`;
    el.card.hidden = true;
    el.done.hidden = false;
    el.main.classList.add('fin');
    bandUI();
    fitDone();
  }

  /* Carte de fin : si elle ne tient pas à l'écran (ou ne laisse plus assez de décor sur téléphone), son message
     se retire ; il reste les étoiles, le titre et le bilan de la comptine entière. */
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

  /* ---------------- diagnostic du micro (adresse avec ?diag) ----------------
     Un petit cadre en bas à droite : façon d'écouter, traitements du micro,
     analyses par seconde, retard, niveau. Pour comprendre ce qui se passe sur un appareil. */
  if (/[?&]diag\b/.test(location.search)) {
    const box = document.createElement('div');
    box.className = 'ear-diag';
    document.body.appendChild(box);
    const yn = (v) => (v == null ? '?' : v ? 'OUI' : 'non');
    setInterval(() => {
      const d = Ear.diag();
      if (!d.on) { box.textContent = 'micro éteint'; return; }
      const p = d.proc || {};
      const f = d.f ? `${d.f.toFixed(1)} Hz` : '–';
      box.innerHTML = `${d.mode === 'worklet' ? 'fil audio' : 'minuterie'} · ${Math.round(d.sr / 100) / 10} kHz · ${d.fps.toFixed(0)} analyses/s<br>`
        + `retard ${Math.round(d.lag * 1000)} ms (max ${Math.round(d.lagMax * 1000)}) · haut-parleur ${Math.round(d.out * 1000)} ms<br>`
        + `écho ${yn(p.ec)} · bruit ${yn(p.ns)} · gain auto ${yn(p.agc)}<br>`
        + `niveau ${d.db.toFixed(0)} dB (fond ${d.nf.toFixed(0)}) · ${f}`;
    }, 400);
  }

  /* ---------------- micro ----------------
     On joue toujours sur un vrai instrument (ou à la voix) : le micro s'allume tout seul en ouvrant une
     comptine (le navigateur demande l'autorisation la première fois). Il se coupe quand la comptine est
     finie, au retour à l'accueil et quand la page passe en arrière-plan, et se rallume quand on rejoue
     ou qu'on revient sur la page. */
  let micBusy = false;
  function pauseMicDone() {
    if (!Ear.active()) return;
    Ear.stop();
    showEar(false); // la comptine est finie : il se rallume tout seul quand on la rejoue
  }
  function applyMode() {
    applyVoice();
    if (Ear.active() || (!G.done && !micBlocked())) { startMic(); return; }
    if (micBlocked()) showEar(false, micMsgHtml('denied'), true); else showEar(false);
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
    return `<p>${text}</p>`;
  }

  /* Le micro ne marche pas (refusé, introuvable, coupé…) : une bulle au-dessus du pupitre le dit, avec de quoi le
     rallumer. blocked : il ne pourra pas marcher ici (pas de bouton) ; starting : il est en train de s'allumer. */
  function showEar(on, msgHtml, blocked, starting) {
    if (!el.earMsg) return;
    const msg = on ? '' : msgHtml || '';
    el.earMsg.hidden = !msg;
    el.earMsg.innerHTML = !msg ? '' : (msg.startsWith('<') ? msg : `<p>${msg}</p>`) + (blocked || starting ? '' : `<button class="btn-big" id="mic-on" type="button"><span class="ic">${ICON.mic}</span><span>Allumer le micro</span></button>`);
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
    paused: 'Micro en pause : il reprend tout seul quand tu reviens sur la page.',
  };

  async function startMic() {
    if (micBusy) return;
    micBusy = true;
    applyVoice();
    if (!Ear.active() && el.ear && document.contains(el.ear)) showEar(false, '', false, true);
    try {
      await Ear.start({ onNote: heardNote, onPending: heardPending, onFrame: heardFrame, onEnded: () => { if (el.ear) showEar(false, MIC_MSG.ended); } });
      if (G && G.done && !G.keepMic) { pauseMicDone(); return; }
      if (view === 'song' && el.ear && document.contains(el.ear)) {
        showEar(true); expectNext();
        if (G && G.live) cursorHint();
        if (singing() && !Ear.voiceOk()) { setHint('Ce navigateur ne me laisse pas reconnaître les noms chantés : je vérifie seulement la hauteur.', ''); flashTop(4500); }
      }
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
    // pendant que la page joue, l'oreille attend : la note entendue pâlit
    el.heard.classList.toggle('is-wait', !!fr.gated);
    if (fr.gated) return;
    if (fr.note == null) {
      el.heardN.textContent = '…';
      el.heardS.textContent = '';
      delete el.heard.dataset.l;
      el.needle.style.setProperty('--c', '0');
      el.needle.classList.add('off');
      return;
    }
    const written = fr.note - inst().off;
    const pc = mod12(written), L = PC_LETTER[pc];
    el.heardN.textContent = PC_FR[pc];
    if (L) el.heard.dataset.l = L; else delete el.heard.dataset.l;
    // la voix : sous la note entendue, le nom reconnu (seulement quand la reconnaissance est sûre)
    const sy = heardSyl && heardSyl.pc === mod12(fr.note) && performance.now() - heardSyl.t < 2500 ? heardSyl.s : null;
    el.heardS.textContent = sy ? `«${NB}${SYL_FR[sy]}${NB}»` : '';
    el.needle.classList.remove('off');
    el.needle.style.setProperty('--c', Math.max(-50, Math.min(50, fr.cents)).toFixed(1));
  }

  /* ---------------- événements ---------------- */
  // « À toi de jouer ! » / « Arrêter » ; comptine finie : on la rejoue de la même façon
  function goButton() {
    if (!G) return;
    G.acts++;
    if (G.defi && (G.done || G.defiFail)) { defiNext(); return; }
    if (G.done) { newRound(true); return; }
    if (busy()) cancelAttempt(); else goAttempt();
  }

  // les deux petits ronds du repos : ce que joue le grand rond, la phrase affichée ou toute la comptine
  function pickWhole(whole) {
    if (!G || busy() || G.done) return;
    G.acts++; // la phrase suivante ne démarre plus toute seule
    if (G.whole === whole) return;
    G.whole = whole;
    if (G.moveTo != null) moveOn(); else idleHint();
    bandUI();
  }

  // en Défi, après une étape : la suivante ; après une erreur : le départ ; le Défi terminé : l'accueil
  function defiNext() {
    const to = defiSong();
    if (!to) { location.hash = ''; return; }
    if (to === G.song) { newRound(true); return; }
    location.hash = '#' + to.id;
  }

  function bindSong() {
    el.bPhrase.addEventListener('click', () => pickWhole(false));
    el.bAll.addEventListener('click', () => pickWhole(true));
    if (el.bTo) el.bTo.addEventListener('click', toggle('to', playToMystery));
    el.bGo.addEventListener('click', goButton);
    // « Arrêter » : l'essai en cours, ou le réglage de la voix
    el.bStop.addEventListener('click', () => { G.acts++; if (G.cal) calStop(); else cancelAttempt(); });
    // « Recommencer » : le même essai depuis le début (l'écoute, puis le décompte)
    el.bRestart.addEventListener('click', () => { G.acts++; goAttempt(G.attemptSc); });
    el.bHear.addEventListener('click', () => { if (G.cal) calStep(); });
    el.bLevel.addEventListener('click', () => setLevel(G.level === 2 ? 1 : 2));
    el.bRg.addEventListener('click', () => reglages());
    app.querySelector('#b-reset').addEventListener('click', reset);
    el.pills.forEach((pill, p) => pill.addEventListener('click', () => {
      G.acts++;
      G.moveTo = null;
      if (prepping() || (G.live && G.live.full)) return;
      if (G.live && G.live.p !== p) cancelAttempt(true); // une autre phrase : l'essai en cours s'arrête
      stopPlayback(true);
      showPhrase(p);
      idleHint();
    }));
    el.panels.forEach((panel) => {
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('.bead');
        if (!b) return;
        const n = +b.dataset.n;
        // une note écrite sur la perle : on l'entend
        if (G.found.has(n) || G.song.given.has(n) || G.revealed.has(n)) { Sound.tap(voiceNow(), G.song.notes[n].midi, 0.5); retrigger(b, 'pop'); }
      });
    });
    el.seg.querySelectorAll('[role="radio"]').forEach((b) => b.addEventListener('click', () => {
      if (+b.dataset.level !== G.level) setLevel(+b.dataset.level);
    }));
    el.earMsg.addEventListener('click', (ev) => { if (ev.target.closest('#mic-on')) startMic(); });
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
    if (app.querySelector('.ec-modal, .onb')) return; // la première visite ou les réglages, par-dessus
    if (e.target.closest && e.target.closest('select, input')) return;
    if (e.code === 'Space' && !(e.target.closest && e.target.closest('button, a'))) {
      e.preventDefault();
      goButton();
    }
  });

  let fitRaf = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => { if (view === 'song' && G && el.done && document.contains(el.done)) fitDone(); });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G && prepping()) cancelAttempt();
    if (document.hidden && Ear.active()) {
      Ear.stop();
      if (el.ear && document.contains(el.ear)) showEar(false, `<p>${MIC_MSG.paused}</p>`);
    }
    // retour sur la page : le micro reprend
    if (!document.hidden && view === 'song' && G && !G.done && el.ear && document.contains(el.ear) && !micBlocked()) startMic();
  });

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
      if (song) { if (isOpen(song)) renderSong(song); else renderLocked(song); } else renderHome();
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
