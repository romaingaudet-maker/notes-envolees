/* ------------------------------------------------------------------
   Les Notes Envolées — page de suivi des élèves (pour le professeur)

   Lit les résultats rangés par le Worker (suivi/worker.js) et montre,
   d'un coup d'œil :
   - chaque élève (un navigateur) : instrument, au micro ou non, dernière
     activité, progression sur le chemin des comptines (étoiles), ce qui
     coince ; le détail de chaque épreuve en le touchant ;
   - chaque instrument : élèves, part jouée au micro, difficulté, abandons ;
   - les comptines difficiles selon l'instrument, avec le résultat de chaque élève.
   Partout, un élève qui a donné son prénom sur l'accueil (c'est facultatif)
   est nommé : élèves actifs de la semaine, élèves de chaque instrument,
   résultats de chaque comptine.

   Les appareils du professeur : ouvrir cette page (avec la clé) sur un
   appareil le reconnaît comme le sien. Le jeu n'y envoie plus rien, et ses
   parties passées sont masquées partout : la page envoie au Worker une
   marque { prof: 1 } au nom de cet appareil (un envoi « visite » ordinaire,
   le Worker n'a rien à changer), et toute page de suivi masque ensuite les
   parties des appareils marqués. Rien n'est effacé ; « Réafficher » remet
   la marque à 0.
   La clé de la page reste sur cet appareil ; tout se calcule ici.
------------------------------------------------------------------- */
(() => {
  'use strict';

  const app = document.getElementById('app');
  const tip = document.getElementById('tip');
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nb = (t) => String(t).replace(/_/g, ' ');
  const num = (x) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : 0);
  const starsOf = (x) => Math.max(0, Math.min(3, Math.round(num(x))));
  const LIB = SONGS.map(buildSong).sort((a, b) => a.level - b.level);
  const BY_ID = Object.fromEntries(LIB.map((s) => [s.id, s]));
  const INST = {
    none: 'Autre instrument en do', voix: 'Voix', piano: 'Piano', flute: 'Flûte', clarinette: 'Clarinette', saxalto: 'Saxophone alto',
    trompette: 'Trompette', trombone: 'Trombone', cor: 'Cor', violon: 'Violon', alto: 'Alto', violoncelle: 'Violoncelle', xylophone: 'Xylophone',
  };
  const INST_SHORT = { none: 'Sans', clarinette: 'Clar.', saxalto: 'Sax.', trompette: 'Tromp.', trombone: 'Tromb.', violoncelle: 'Vlc.', xylophone: 'Xylo.' };
  const INST_ORDER = Object.keys(INST);
  const instName = (k) => INST[k] || nb(k || '?');
  const JEU_NAME = { aventure: 'Aventure', decouverte: 'Découverte', defi: 'Défi' };
  const MIC_CODE = { denied: 'refusé', nomic: 'aucun micro', busy: 'déjà utilisé', unsupported: 'navigateur incompatible', noaudio: 'son indisponible', other: 'erreur' };
  const songTitle = (id) => (BY_ID[id] ? nb(BY_ID[id].title) : nb(id));
  const KEY_STORE = (window.NE_NS || '') + 'notes-envolees-prof-cle';
  const DAY = 864e5;
  const ID_RE = /^[a-z0-9]{6,32}$/;

  // le Worker lu par la page : celui du jeu, ou celui de la production (la qualification lit les vrais résultats)
  const API = window.NE_SUIVI_LECTURE || Suivi.url;
  // cet appareil, tel que le connaît le jeu en production (seul à envoyer des résultats : clés sans préfixe)
  const MY_ID = 'notes-envolees-id', MY_OFF = 'notes-envolees-suivi-off';
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  };
  const myId = () => { const v = store.get(MY_ID); return v && ID_RE.test(v) ? v : ''; };

  /* ---------------- formats ---------------- */
  const NF2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const NF1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const NF0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const pct = (x) => `${NF0.format(Math.round(x * 100))} %`;
  const plural = (n, one, many) => `${NF0.format(n)} ${n > 1 ? many : one}`;
  function dur(s) {
    s = Math.round(num(s));
    if (s < 60) return `${s} s`;
    if (s < 3600) return `${Math.round(s / 60)} min`;
    const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  }
  const DF_TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const DF_DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const DF_YEAR = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  function ago(t) {
    const mins = (NOW - t) / 60000;
    if (mins < 1) return 'à l’instant';
    if (mins < 60) return `il y a ${Math.round(mins)} min`;
    const d = new Date(t), now = new Date(NOW);
    const days = Math.round((midnight(now) - midnight(d)) / DAY);
    if (days === 0) return `aujourd’hui à ${DF_TIME.format(d)}`;
    if (days === 1) return `hier à ${DF_TIME.format(d)}`;
    if (days < 7) return `il y a ${days} jours`;
    if (days < 56) return `il y a ${Math.round(days / 7)} sem.`;
    return (d.getFullYear() !== now.getFullYear() ? DF_YEAR : DF_DAY).format(d);
  }
  const day = (t) => (new Date(t).getFullYear() !== new Date(NOW).getFullYear() ? DF_YEAR : DF_DAY).format(new Date(t));

  /* ---------------- adresses IP ---------------- */
  function v6groups(ip) {
    const [head, tail] = ip.split('::');
    const h = head ? head.split(':') : [];
    if (tail === undefined) return h;
    const t = tail ? tail.split(':') : [];
    return [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  }
  const v6head = (ip) => v6groups(ip).slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, '')).join(':');
  // le réseau : l'adresse IPv4 entière, ou les 4 premiers groupes en IPv6 (le réseau du foyer, stable)
  const net = (ip) => (ip && ip.includes(':') ? v6head(ip) + '::/64' : ip || '');
  const ipShort = (ip) => (!ip ? 'adresse inconnue' : ip.includes(':') ? v6head(ip) + ':…' : ip);

  /* ---------------- état ---------------- */
  let KEY = '';
  let RAW = [];      // tout ce que rend le Worker
  let EVENTS = [];   // sans les marques ni les parties des appareils du professeur
  let MINE = new Map(); // appareils du professeur : id → dernière marque
  let MY_NETS = new Set(); // réseaux récents du professeur (pour signaler « même connexion que toi »)
  let NOW = Date.now();
  let loadedAt = 0;
  let LEVEL = 1; // niveau montré pour les instruments et les comptines
  let WHO = new Map(); // élèves montrés : identifiant → fiche (pour les nommer dans les statistiques)
  let DEFI = new Map(); // scores du Défi rangés par le Worker : identifiant → { publier, masque… } (vide : Worker d'avant le Défi)
  const open = new Set();

  function readKey() {
    try { return localStorage.getItem(KEY_STORE) || sessionStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; }
  }
  function storeKey(k, keep) {
    try {
      localStorage.removeItem(KEY_STORE); sessionStorage.removeItem(KEY_STORE);
      if (k) (keep ? localStorage : sessionStorage).setItem(KEY_STORE, k);
    } catch (e) { /* stockage indisponible : la clé restera le temps de la page */ }
  }

  async function fetchEvents() {
    let depuis = RAW.length ? RAW[RAW.length - 1].n : 0;
    for (let guard = 0; guard < 400; guard++) {
      let r;
      try {
        r = await fetch(`${API}/donnees?depuis=${depuis}`, { headers: { Authorization: 'Bearer ' + KEY }, cache: 'no-store' });
      } catch (e) {
        throw Object.assign(new Error('Le suivi ne répond pas. Vérifie ta connexion, puis actualise.'), { code: 'reseau' });
      }
      if (r.status === 401) throw Object.assign(new Error('Clé incorrecte.'), { code: 'cle' });
      if (!r.ok) {
        let m = '';
        try { m = (await r.json()).message || ''; } catch (e) { /* pas de détail */ }
        throw Object.assign(new Error(m || `Le Worker a répondu ${r.status}.`), { code: 'http' });
      }
      const j = await r.json();
      NOW = j.maintenant || Date.now();
      for (const row of j.evenements || []) {
        const [n, t, eleve, ip, type, d] = row;
        RAW.push({ n, t, eleve, ip: ip || '', type, d: d && typeof d === 'object' && !Array.isArray(d) ? d : {} });
      }
      if (!j.suite || !(j.evenements || []).length) break;
      depuis = j.evenements[j.evenements.length - 1][0];
    }
    loadedAt = Date.now();
    await fetchDefi();
    prepare();
  }
  // les scores du Défi (et qui est retiré du tableau d'honneur) : le Worker d'avant le Défi n'en a pas
  async function fetchDefi() {
    try {
      const r = await fetch(`${API}/defi`, { headers: { Authorization: 'Bearer ' + KEY }, cache: 'no-store' });
      const j = r.ok ? await r.json() : null;
      DEFI = new Map(j && Array.isArray(j.eleves) ? j.eleves.map((x) => [x.eleve, x]) : []);
    } catch (e) { DEFI = new Map(); }
  }
  // retirer un élève du tableau d'honneur de l'accueil, ou l'y remettre
  async function defiMask(id, on) {
    const r = await fetch(`${API}/defi/masque`, { method: 'POST', headers: { Authorization: 'Bearer ' + KEY }, body: JSON.stringify({ id, masque: on ? 1 : 0 }) });
    if (!r.ok) throw new Error('masque');
    await fetchDefi();
  }

  const isMark = (e) => e.type === 'visite' && e.d.prof != null;
  // sépare les parties des élèves de celles des appareils du professeur
  function prepare() {
    const marks = new Map();
    for (const e of RAW) if (isMark(e)) marks.set(e.eleve, e); // dans l'ordre d'arrivée : la dernière marque compte
    MINE = new Map([...marks].filter(([, e]) => e.d.prof));
    MY_NETS = new Set(RAW.filter((e) => MINE.has(e.eleve) && e.ip && e.t > NOW - 30 * DAY).map((e) => net(e.ip)));
    EVENTS = RAW.filter((e) => !isMark(e) && !MINE.has(e.eleve));
  }

  // marque (ou démarque) un appareil comme celui du professeur
  async function mark(id, on) {
    const r = await fetch(`${API}/e`, { method: 'POST', body: JSON.stringify({ e: id, y: 'visite', v: 1, prof: on ? 1 : 0 }) });
    if (!r.ok) throw new Error('marque');
    await fetchEvents();
  }

  // cet appareil est celui du professeur : le jeu n'y envoie plus rien, ses parties passées sont masquées
  async function claimThisDevice() {
    store.set(MY_OFF, '1');
    const id = myId();
    if (id && !MINE.has(id)) { try { await mark(id, true); } catch (e) { /* on réessaiera à la prochaine ouverture */ } }
  }

  /* ---------------- calculs ---------------- */
  const epKey = (id, lv) => id + '@' + lv;
  function students(evs) {
    const map = new Map();
    for (const e of evs) {
      let s = map.get(e.eleve);
      if (!s) {
        s = { id: e.eleve, ip: '', first: e.t, last: e.t, insts: new Map(), lastInst: '', prenom: '', prenomT: -Infinity, prenoms: new Map(), mic: 0, xylo: 0, snap: null, ep: new Map(), temps: 0, micErr: '', micErrT: 0, micOkT: 0, jeu: '', defi: null };
        map.set(e.eleve, s);
      }
      s.first = Math.min(s.first, e.t);
      if (e.t >= s.last) { s.last = e.t; if (e.ip) s.ip = e.ip; }
      if (!s.ip && e.ip) s.ip = e.ip;
      const d = e.d;
      if (d.inst) s.lastInst = d.inst;
      if (JEU_NAME[d.jeu]) s.jeu = d.jeu; // le mode de jeu le plus récent
      // prénom donné par l'élève sur l'accueil (facultatif) : le plus récent compte, les autres restent dans le détail
      const pn = typeof d.prenom === 'string' ? d.prenom.replace(/\s+/g, ' ').trim().slice(0, 30) : '';
      if (pn) {
        s.prenoms.set(pn, Math.max(s.prenoms.get(pn) || 0, e.t));
        if (e.t >= s.prenomT) { s.prenom = pn; s.prenomT = e.t; }
      }
      if (e.type === 'visite') { if (d.etoiles && typeof d.etoiles === 'object') s.snap = d.etoiles; continue; }
      if (e.type === 'micro') { s.micErr = MIC_CODE[d.code] || 'erreur'; s.micErrT = e.t; continue; }
      if (e.type === 'defi') { s.defi = { n: num(d.comptines), e: num(d.essais), pub: !!d.publier }; continue; }
      if (e.type === 'debut') {
        s.insts.set(d.inst || 'none', (s.insts.get(d.inst || 'none') || 0) + 1);
        if (d.mode === 'mic') { s.mic++; s.micOkT = e.t; } else s.xylo++;
      }
      if (!BY_ID[d.c]) continue;
      const k = epKey(d.c, d.niveau === 2 ? 2 : 1);
      let ep = s.ep.get(k);
      if (!ep) { ep = { debuts: 0, fins: [], sorties: [], bilans: [] }; s.ep.set(k, ep); }
      if (e.type === 'debut') ep.debuts++;
      else if (e.type === 'fin') { ep.fins.push(d); s.temps += num(d.duree); }
      else if (e.type === 'sortie') { ep.sorties.push({ d, t: e.t }); s.temps += num(d.duree); }
      else if (e.type === 'bilan') ep.bilans.push(d);
    }
    return [...map.values()].sort((a, b) => b.last - a.last);
  }
  // meilleur nombre d'étoiles : parties suivies, plus ce que l'appareil avait déjà enregistré avant le suivi
  function best(s, id, lv) {
    const ep = s.ep.get(epKey(id, lv));
    let b = ep ? Math.max(0, ...ep.fins.map((d) => starsOf(d.etoiles))) : 0;
    if (s.snap) b = Math.max(b, starsOf(s.snap[lv === 2 ? id + '@2' : id]));
    return b;
  }
  const progress = (s, lv) => LIB.filter((song) => best(s, song.id, lv) > 0).length;
  const touched = (s, lv) => LIB.some((song) => s.ep.has(epKey(song.id, lv)) || best(s, song.id, lv));
  function mainInst(s) {
    let k = '', n = -1;
    s.insts.forEach((c, i) => { if (c > n || (c === n && i !== 'none')) { k = i; n = c; } });
    return k || s.lastInst || 'none';
  }
  // ce qui mérite l'attention du professeur
  function alerts(s) {
    const out = [];
    if (s.micErr && s.micErrT > s.micOkT) out.push(`Le micro n’a pas marché (${s.micErr})`);
    let stuck = null; // comptine quittée au moins deux fois, jamais terminée
    s.ep.forEach((ep, k) => {
      if (ep.fins.length || ep.sorties.length < 2) return;
      const [id, lv] = k.split('@');
      if (best(s, id, +lv)) return;
      const t = ep.sorties[ep.sorties.length - 1].t;
      if (!stuck || t > stuck.t) stuck = { id, lv: +lv, n: ep.sorties.length, t };
    });
    if (stuck) out.push(`Bloque sur « ${songTitle(stuck.id)} »${stuck.lv === 2 ? ' (niveau 2)' : ''} : ${plural(stuck.n, 'abandon', 'abandons')}`);
    return out;
  }

  /* Les prénoms dans les statistiques : un élève qui a donné son prénom est nommé ; le même prénom sur
     plusieurs appareils n'est écrit qu'une fois, avec le nombre d'appareils ; les autres sont comptés. */
  const codeOf = (id) => '#' + id.slice(0, 4);
  const prenomOf = (id) => (WHO.get(id) || {}).prenom || '';
  // « Léa (2 appareils), Tom + 1 sans prénom » ; '' quand aucun de ces élèves n'a donné son prénom
  function namesLine(ids, max = 5) {
    const counts = new Map();
    let anon = 0;
    ids.forEach((id) => { const p = prenomOf(id); if (p) counts.set(p, (counts.get(p) || 0) + 1); else anon++; });
    if (!counts.size) return '';
    const names = [...counts].map(([p, k]) => (k > 1 ? `${p} (${k} appareils)` : p));
    const hidden = names.length - Math.min(max, names.length);
    let out = names.slice(0, max).join(', ');
    if (hidden) out += ` et ${hidden} autre${hidden > 1 ? 's' : ''}`;
    if (anon) out += ` + ${anon} sans prénom`;
    return out;
  }
  // un élève dans le résultat d'une comptine : son prénom (avec son code si un autre appareil porte le même), sinon son code
  function whoIn(id, ids) {
    const p = prenomOf(id);
    if (!p) return `Élève ${codeOf(id)}`;
    return ids.some((o) => o !== id && prenomOf(o) === p) ? `${p} (${codeOf(id)})` : p;
  }

  // difficulté : niveau 1, erreurs par note (3 étoiles jusqu'à 0,2 ; 2 jusqu'à 0,6) ; niveau 2, essais ratés par phrase (0,25 ; 1)
  const CUTS = { 1: [0.2, 0.6], 2: [0.25, 1] };
  const UNIT = { 1: ['erreur par note', 'erreurs par note'], 2: ['essai raté par phrase', 'essais ratés par phrase'] };
  const unit = (v, lv) => UNIT[lv][v >= 2 ? 1 : 0];
  const grade = (v, lv) => (v <= CUTS[lv][0] ? 1 : v <= CUTS[lv][1] ? 2 : 3);
  const GRADE = ['', 'facile', 'moyen', 'difficile'];

  function byInstrument(evs, lv) {
    const map = new Map();
    for (const e of evs) {
      if (e.type !== 'debut' && e.type !== 'fin' && e.type !== 'sortie') continue;
      const d = e.d, k = d.inst || 'none';
      let r = map.get(k);
      if (!r) { r = { inst: k, eleves: new Set(), debuts: 0, mic: 0, fins: 0, err: 0, sur: 0, sorties: 0 }; map.set(k, r); }
      r.eleves.add(e.eleve);
      if (e.type === 'debut') { r.debuts++; if (d.mode === 'mic') r.mic++; continue; }
      if ((d.niveau === 2 ? 2 : 1) !== lv) continue;
      if (e.type === 'fin') { r.fins++; r.err += num(d.erreurs); r.sur += num(d.sur); } else r.sorties++;
    }
    return [...map.values()].sort((a, b) => b.eleves.size - a.eleves.size || INST_ORDER.indexOf(a.inst) - INST_ORDER.indexOf(b.inst));
  }

  function heatCells(evs, lv) {
    const m = new Map();
    for (const e of evs) {
      if (e.type !== 'fin' && e.type !== 'sortie') continue;
      const d = e.d;
      if ((d.niveau === 2 ? 2 : 1) !== lv || !BY_ID[d.c]) continue;
      const k = d.c + '|' + (d.inst || 'none');
      let c = m.get(k);
      if (!c) { c = { fins: 0, err: 0, sur: 0, sorties: 0, eleves: new Set(), duree: 0, etoiles: 0, per: new Map() }; m.set(k, c); }
      c.eleves.add(e.eleve);
      // le résultat de chaque élève sur cette comptine, avec cet instrument
      let p = c.per.get(e.eleve);
      if (!p) { p = { fins: 0, err: 0, sur: 0, sorties: 0, best: 0 }; c.per.set(e.eleve, p); }
      if (e.type === 'fin') {
        c.fins++; c.err += num(d.erreurs); c.sur += num(d.sur); c.duree += num(d.duree); c.etoiles += starsOf(d.etoiles);
        p.fins++; p.err += num(d.erreurs); p.sur += num(d.sur); p.best = Math.max(p.best, starsOf(d.etoiles));
      } else { c.sorties++; p.sorties++; }
    }
    return m;
  }
  // une ligne par élève, le plus en difficulté d'abord (jamais terminée, puis le plus d'erreurs) : « Léa : 2 ★, 0,35 erreur par note »
  function perStudent(c, lv, max = 6) {
    const ids = [...c.per.keys()];
    const rate = (p) => (p.fins ? (p.sur ? p.err / p.sur : 0) : Infinity);
    const rows = [...c.per].sort((a, b) => rate(b[1]) - rate(a[1]) || b[1].sorties - a[1].sorties).map(([id, p]) => {
      const bits = [];
      if (p.fins) { bits.push(`${p.best} ★`); if (p.sur) bits.push(`${NF2.format(p.err / p.sur)} ${unit(p.err / p.sur, lv)}`); }
      if (p.sorties) bits.push(plural(p.sorties, 'abandon', 'abandons'));
      return `${whoIn(id, ids)} : ${bits.join(', ')}`;
    });
    if (rows.length > max) rows.splice(max - 1, rows.length, `et ${rows.length - max + 1} autres élèves`);
    return rows;
  }

  /* ---------------- dessin ---------------- */
  const DASH = '<span class="mute">—</span>';
  const starIcons = (n) => `<span class="stars" aria-label="${n} étoile${n > 1 ? 's' : ''} sur 3">${[1, 2, 3].map((k) => `<b class="${k <= n ? 'on' : ''}">★</b>`).join('')}</span>`;
  const tipAttr = (o) => ` data-tip="${esc(JSON.stringify(o))}"`;

  function render() {
    if (!API) { renderSetup(); return; }
    if (!KEY) { renderLogin(); return; }
    const st = students(EVENTS);
    WHO = new Map(st.map((s) => [s.id, s]));
    const cols = byInstrument(EVENTS, LEVEL);
    app.innerHTML = `
    ${header()}
    <main class="wrap">
      ${st.length ? `
      ${kpis(st)}
      <section class="card" id="eleves" aria-labelledby="h-eleves">
        <div class="card-head"><h2 id="h-eleves">Élèves <span class="count">${NF0.format(st.length)}</span></h2>${legend()}</div>
        <div class="list">${st.map(card).join('')}</div>
      </section>
      <section class="card" id="instruments" aria-labelledby="h-inst">
        <div class="card-head row"><h2 id="h-inst">Par instrument</h2>${levelSwitch()}</div>
        ${instTable(cols)}
        <h3 class="sub">Difficulté de chaque comptine</h3>
        ${heatmap(cols)}
      </section>` : `
      <section class="card pad empty"><p><b>Aucun élève pour l’instant.</b></p><p>Dès qu’un élève ouvrira le jeu, il apparaîtra ici.</p></section>`}
      ${footer()}
    </main>`;
  }

  function header() {
    return `<header class="top">
      <div class="top-in">
        <div class="brand"><span class="mark">Les Notes Envolées</span><h1>Suivi des élèves</h1></div>
        <div class="top-act">
          <span class="upd" id="upd">${loadedAt ? `À jour à ${esc(DF_TIME.format(new Date(loadedAt)))}` : ''}</span>
          <button type="button" class="btn" data-act="reload">Actualiser</button>
        </div>
      </div>
    </header>`;
  }

  function kpis(st) {
    const week = st.filter((s) => s.last >= NOW - 7 * DAY);
    const actifs = week.length;
    const fins = EVENTS.filter((e) => e.type === 'fin').length;
    const debuts = EVENTS.filter((e) => e.type === 'debut');
    const mic = debuts.length ? debuts.filter((e) => e.d.mode === 'mic').length / debuts.length : null;
    const temps = st.reduce((a, s) => a + s.temps, 0);
    const k = (v, l, who = '') => `<div class="kpi"><p class="k-v">${esc(v)}</p><p class="k-l">${esc(l)}</p>${who ? `<p class="k-who">${esc(who)}</p>` : ''}</div>`;
    return `<section class="kpis" aria-label="En bref">
      ${k(NF0.format(actifs), actifs > 1 ? 'élèves actifs cette semaine' : 'élève actif cette semaine', namesLine(week.map((s) => s.id)))}
      ${k(NF0.format(fins), fins > 1 ? 'comptines terminées' : 'comptine terminée')}
      ${k(dur(temps), 'de jeu en tout')}
      ${k(mic == null ? '—' : pct(mic), 'des parties au micro')}
    </section>`;
  }

  const legend = () => `<p class="legend" aria-hidden="true"><span><i class="c s3"></i>3 ★</span><span><i class="c s2"></i>2 ★</span><span><i class="c s1"></i>1 ★</span><span><i class="c t"></i>commencée</span><span><i class="c"></i>pas encore jouée</span></p>`;

  function strip(s, lv) {
    return LIB.map((song) => {
      const b = best(s, song.id, lv);
      const ep = s.ep.get(epKey(song.id, lv));
      const tried = !b && ep;
      const lines = [];
      if (ep && ep.fins.length) {
        const sur = ep.fins.reduce((a, d) => a + num(d.sur), 0), err = ep.fins.reduce((a, d) => a + num(d.erreurs), 0);
        lines.push(`terminée ${plural(ep.fins.length, 'fois', 'fois')}`);
        if (sur) lines.push(`${NF2.format(err / sur)} ${unit(err / sur, lv)}`);
      } else if (b) lines.push('terminée avant le suivi');
      if (ep && ep.sorties.length) lines.push(plural(ep.sorties.length, 'abandon', 'abandons'));
      const v = b ? `${b} étoile${b > 1 ? 's' : ''}` : tried ? 'commencée' : 'pas encore jouée';
      return `<i class="c${b ? ' s' + b : tried ? ' t' : ''}"${tipAttr({ v, t: `${song.level} · ${nb(song.title)} · niveau ${lv}`, l: lines })}></i>`;
    }).join('');
  }

  // le Défi d'un élève : comptines réussies, essais, et sa place au tableau d'honneur de l'accueil
  function defiLine(s) {
    const row = DEFI.get(s.id), d = s.defi || (row ? { n: row.comptines, e: row.essais, pub: !!row.publier } : null);
    if (!d) return '';
    const state = row && row.masque ? '<span class="chip warn">retiré du tableau d’honneur</span>' : d.pub ? '<span class="chip">au tableau d’honneur</span>' : '';
    return `<p class="e-defi"><span class="e-defi-l">Défi</span><span><b>${NF0.format(d.n)}</b>/${LIB.length} comptines réussies · ${plural(d.e, 'essai', 'essais')}</span>${state}</p>`;
  }
  function defiBtn(s) {
    const row = DEFI.get(s.id);
    if (!row || (!row.publier && !row.masque)) return '';
    return row.masque
      ? `<button type="button" class="btn ghost" data-act="defi-masque" data-v="0" data-id="${esc(s.id)}">Remettre au tableau d’honneur</button>`
      : `<button type="button" class="btn ghost" data-act="defi-masque" data-v="1" data-id="${esc(s.id)}">Retirer du tableau d’honneur</button>`;
  }

  function card(s) {
    const main = mainInst(s);
    const plays = s.mic + s.xylo;
    const how = !plays ? '' : s.mic === plays ? 'au micro' : !s.mic ? 'xylophone de l’écran' : `${pct(s.mic / plays)} au micro`;
    const lv2 = touched(s, 2);
    const path = (lv) => `<div class="path"><span class="p-l">Niv. ${lv}</span><span class="strip" role="img" aria-label="Niveau ${lv} : ${progress(s, lv)} comptines sur ${LIB.length}">${strip(s, lv)}</span><span class="p-n"><b>${progress(s, lv)}</b>/${LIB.length}</span></div>`;
    const warn = alerts(s);
    const meNet = s.ip && MY_NETS.has(net(s.ip));
    const isOpen = open.has(s.id);
    const idle = s.last < NOW - 14 * DAY;
    return `<article class="eleve${isOpen ? ' is-open' : ''}" data-id="${esc(s.id)}">
      <div class="e-top">
        <p class="e-inst">${s.prenom ? `<b class="e-name">${esc(s.prenom)}</b><span class="e-dot" aria-hidden="true">·</span>` : ''}<b>${esc(instName(main))}</b>${how || s.jeu ? `<span class="e-how">${esc([how, JEU_NAME[s.jeu]].filter(Boolean).join(' · '))}</span>` : ''}</p>
        <p class="e-when${idle ? ' idle' : ''}">${esc(ago(s.last))}</p>
      </div>
      ${path(1)}${lv2 ? path(2) : ''}
      ${defiLine(s)}
      ${warn.map((w) => `<p class="e-warn">${esc(w)}</p>`).join('')}
      <div class="e-foot">
        <p class="e-id"><span class="ip" title="${esc(s.ip)}">${esc(ipShort(s.ip))}</span><span class="code">#${esc(s.id.slice(0, 4))}</span>${meNet ? '<span class="chip">même connexion que toi</span>' : ''}</p>
        <button type="button" class="more" data-act="toggle" aria-expanded="${isOpen}">${isOpen ? 'Fermer' : 'Détail'}</button>
      </div>
      ${isOpen ? detail(s) : ''}
    </article>`;
  }

  function levelCell(s, id, lv) {
    const ep = s.ep.get(epKey(id, lv));
    const b = best(s, id, lv);
    const out = [];
    if (ep && ep.fins.length) {
      const sur = ep.fins.reduce((a, d) => a + num(d.sur), 0), err = ep.fins.reduce((a, d) => a + num(d.erreurs), 0);
      const r = sur ? err / sur : 0;
      out.push(`${starIcons(b)}${ep.fins.length > 1 ? ` <span class="x">${ep.fins.length} fois</span>` : ''}`);
      out.push(`<small>${NF2.format(r)} ${unit(r, lv)} · ${dur(ep.fins.reduce((a, d) => a + num(d.duree), 0) / ep.fins.length)}</small>`);
    } else if (b) out.push(`${starIcons(b)}<small>avant le suivi</small>`);
    // toute la comptine d'un coup : les notes seules, sans aide (niveau 1, « notes ») ou en rythme (niveau 2)
    const plain = ep ? ep.bilans.filter((d) => d.notes) : [], rhythm = ep ? ep.bilans.filter((d) => !d.notes) : [];
    if (plain.some((d) => d.reussi)) out.push('<small class="ok">✓ toute la comptine d’un coup, sans erreur</small>');
    if (rhythm.some((d) => d.reussi)) out.push(`<small class="ok">✓ toute la comptine en rythme${rhythm.some((d) => d.parfait) ? ', parfaite' : ''}</small>`);
    if (ep && ep.sorties.length) {
      const last = ep.sorties[ep.sorties.length - 1].d;
      out.push(`<small class="warn">${plural(ep.sorties.length, 'abandon', 'abandons')}${!ep.fins.length && num(last.sur) ? ` (arrêté à ${NF0.format(num(last.fait))}/${NF0.format(num(last.sur))} ${lv === 2 ? 'phrases' : 'notes'})` : ''}</small>`);
    }
    if (!out.length) return ep && ep.debuts ? '<span class="mute">ouverte</span>' : DASH;
    return out.join('');
  }

  function detail(s) {
    const lv2 = touched(s, 2);
    const td = (label, html) => `<td data-l="${label}"${html === DASH ? ' class="nil"' : ''}><div>${html}</div></td>`;
    const rows = LIB.filter((song) => s.ep.has(epKey(song.id, 1)) || s.ep.has(epKey(song.id, 2)) || best(s, song.id, 1) || best(s, song.id, 2))
      .map((song) => `<tr><th scope="row"><b>${song.level}</b> ${esc(nb(song.title))}</th>${td('Niveau 1', levelCell(s, song.id, 1))}${lv2 ? td('Niveau 2', levelCell(s, song.id, 2)) : ''}</tr>`).join('');
    const others = [...s.insts.keys()].filter((k) => k !== mainInst(s)).map(instName);
    const names = [...s.prenoms.entries()].filter(([n]) => n !== s.prenom).sort((a, b) => b[1] - a[1]).map(([n]) => n);
    const me = myId() === s.id;
    return `<div class="detail">
      <p class="d-meta">${esc(dur(s.temps))} de jeu${s.first < s.last - DAY ? ` depuis le ${esc(day(s.first))}` : ''}${others.length ? ` · a aussi joué : ${esc(others.join(', '))}` : ''}${names.length ? ` · ${names.length > 1 ? 'autres prénoms donnés' : 'autre prénom donné'} : ${esc(names.join(', '))}` : ''}</p>
      ${rows ? `<table class="tbl ep"><thead><tr><th scope="col">Comptine</th><th scope="col">Niveau 1 · les notes</th>${lv2 ? '<th scope="col">Niveau 2 · notes et rythme</th>' : ''}</tr></thead><tbody>${rows}</tbody></table>` : '<p class="mute">Aucune comptine commencée.</p>'}
      <p class="d-act">
        ${me ? '' : `<button type="button" class="btn ghost" data-act="mine" data-id="${esc(s.id)}">C’est moi : ne plus afficher</button>`}
        ${defiBtn(s)}
        <button type="button" class="btn danger" data-act="delete" data-id="${esc(s.id)}">Effacer ses données</button>
      </p>
    </div>`;
  }

  const levelSwitch = () => `<div class="seg" role="radiogroup" aria-label="Niveau">${[1, 2].map((v) => `<button type="button" role="radio" data-act="level" data-v="${v}" aria-checked="${v === LEVEL}">Niveau ${v}</button>`).join('')}</div>`;

  function swatch(v, lv) {
    const g = grade(v, lv);
    return `<span class="grade g${g}"><i></i>${GRADE[g]}</span><small>${NF2.format(v)}</small>`;
  }

  function instTable(rows) {
    if (!rows.length) return '<p class="mute pad">Pas encore de partie.</p>';
    const lv = LEVEL;
    const body = rows.map((r) => {
      const mic = r.debuts ? r.mic / r.debuts : null;
      const ab = r.fins + r.sorties ? r.sorties / (r.fins + r.sorties) : null;
      const who = namesLine([...r.eleves]);
      return `<tr>
        <th scope="row">${esc(instName(r.inst))}${who ? `<small class="who">${esc(who)}</small>` : ''}</th>
        <td data-l="Élèves">${NF0.format(r.eleves.size)}</td>
        <td data-l="Au micro">${mic == null ? DASH : pct(mic)}</td>
        <td data-l="Terminées">${NF0.format(r.fins)}</td>
        <td data-l="Difficulté">${r.sur ? swatch(r.err / r.sur, lv) : DASH}</td>
        <td data-l="Abandons">${ab == null ? DASH : pct(ab)}</td>
      </tr>`;
    }).join('');
    return `<table class="tbl inst">
      <thead><tr><th scope="col">Instrument</th><th scope="col">Élèves</th><th scope="col">Au micro</th><th scope="col">Terminées</th><th scope="col">Difficulté</th><th scope="col">Abandons</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  }

  function heatmap(instRows) {
    const lv = LEVEL;
    const cells = heatCells(EVENTS, lv);
    const cols = instRows.map((r) => r.inst).filter((k) => LIB.some((s) => cells.has(s.id + '|' + k)));
    const songs = LIB.filter((song) => cols.some((k) => cells.has(song.id + '|' + k)));
    if (!cols.length) return `<p class="mute pad">Aucune comptine ${lv === 2 ? 'du niveau 2 ' : ''}terminée ou abandonnée pour l’instant.</p>`;
    const head = `<div class="h-corner"></div>${cols.map((k) => `<div class="h-col" title="${esc(instName(k))}"><span class="l">${esc(instName(k))}</span><span class="s">${esc(INST_SHORT[k] || instName(k))}</span></div>`).join('')}`;
    const rows = songs.map((song) => {
      const label = `<div class="h-row" title="${esc(nb(song.title))}"><b>${song.level}</b> ${esc(nb(song.title))}</div>`;
      return label + cols.map((k) => {
        const c = cells.get(song.id + '|' + k);
        if (!c) return '<div class="hc none"></div>';
        const t = `${song.level} · ${nb(song.title)} · ${instName(k)} · niveau ${lv}`;
        // la bulle donne aussi le résultat de chaque élève, nommé par son prénom s'il l'a donné
        const p = perStudent(c, lv), said = (x) => `${t} : ${x}${p.length ? `. ${p.join(' ; ')}` : ''}`;
        if (!c.fins) {
          return `<div class="hc ab" tabindex="0" aria-label="${esc(said('jamais terminée'))}"${tipAttr({ t, v: 'Jamais terminée', l: [`${plural(c.sorties, 'abandon', 'abandons')} · ${plural(c.eleves.size, 'élève', 'élèves')}`], p })}></div>`;
        }
        const v = c.err / Math.max(1, c.sur), g = grade(v, lv);
        const lines = [
          `terminée ${plural(c.fins, 'fois', 'fois')} · ${plural(c.eleves.size, 'élève', 'élèves')}`,
          `${NF1.format(c.etoiles / c.fins)} étoile${c.etoiles / c.fins >= 2 ? 's' : ''} en moyenne · ${dur(c.duree / c.fins)} par partie`,
          c.sorties ? plural(c.sorties, 'abandon', 'abandons') : '',
        ].filter(Boolean);
        return `<div class="hc g${g}" tabindex="0" aria-label="${esc(said(GRADE[g]))}"${tipAttr({ t, v: `${GRADE[g][0].toUpperCase() + GRADE[g].slice(1)} · ${NF2.format(v)} ${unit(v, lv)}`, l: lines, p })}></div>`;
      }).join('');
    }).join('');
    const missing = LIB.length - songs.length;
    return `<div class="scroll"><div class="heat" style="--cols:${cols.length}" role="grid" aria-label="Difficulté par comptine et par instrument">${head}${rows}</div></div>
      <p class="legend heat-key" aria-hidden="true"><span><i class="hk g1"></i>facile</span><span><i class="hk g2"></i>moyen</span><span><i class="hk g3"></i>difficile</span><span><i class="hk ab"></i>jamais terminée</span>${missing ? `<span class="mute">${plural(missing, 'comptine pas encore jouée', 'comptines pas encore jouées')} à ce niveau</span>` : ''}</p>`;
  }

  function footer() {
    const me = myId();
    const mine = [...MINE.keys()];
    return `<footer class="foot">
      <p>${mine.length
        ? `Tes appareils ne sont pas comptés : ${mine.map((id) => `<span class="code">#${esc(id.slice(0, 4))}</span>${id === me ? ' (celui-ci)' : ''} <button type="button" class="link" data-act="unmine" data-id="${esc(id)}">réafficher</button>`).join(' · ')}.`
        : 'Cet appareil n’envoie rien au suivi : c’est le tien.'}</p>
      <p><button type="button" class="link" data-act="logout">Se déconnecter</button></p>
    </footer>`;
  }

  function renderSetup() {
    app.innerHTML = `<header class="top"><div class="top-in"><div class="brand"><span class="mark">Les Notes Envolées</span><h1>Suivi des élèves</h1></div></div></header>
    <main class="wrap narrow"><section class="card pad">
      <h2>Le suivi n’est pas encore branché</h2>
      <p>Il manque l’adresse du Worker Cloudflare dans <code>src/suivi.js</code>. La marche à suivre est dans <code>suivi/LISEZMOI.md</code>.</p>
    </section></main>`;
  }

  function renderLogin(msg) {
    app.innerHTML = `<header class="top"><div class="top-in"><div class="brand"><span class="mark">Les Notes Envolées</span><h1>Suivi des élèves</h1></div></div></header>
    <main class="wrap narrow"><form class="card pad login" id="login">
      <label class="fld block"><span>Clé du suivi</span><input type="password" name="cle" autocomplete="current-password" required minlength="8" autofocus></label>
      <label class="chk"><input type="checkbox" name="garder" checked><span>Rester connecté sur cet appareil</span></label>
      ${msg ? `<p class="err" role="alert">${esc(msg)}</p>` : ''}
      <p><button class="btn" type="submit">Ouvrir le suivi</button></p>
    </form></main>`;
  }

  function renderBusy(text) {
    const upd = document.getElementById('upd');
    if (upd) { upd.textContent = text; document.body.classList.add('busy'); return; }
    app.innerHTML = `<main class="wrap narrow"><p class="mute pad">${esc(text)}</p></main>`;
  }

  async function load(full) {
    if (full) RAW = [];
    renderBusy('Chargement…');
    try {
      await fetchEvents();
      await claimThisDevice();
      document.body.classList.remove('busy');
      render();
    } catch (e) {
      document.body.classList.remove('busy');
      if (e.code === 'cle') { KEY = ''; storeKey('', false); renderLogin('Clé incorrecte.'); return; }
      if (RAW.length && document.getElementById('upd')) { document.getElementById('upd').textContent = e.message; return; }
      renderLogin(e.message);
    }
  }

  /* ---------------- interactions ---------------- */
  app.addEventListener('submit', (ev) => {
    if (ev.target.id !== 'login') return;
    ev.preventDefault();
    const fd = new FormData(ev.target);
    KEY = String(fd.get('cle') || '').trim();
    storeKey(KEY, !!fd.get('garder'));
    load(true);
  });
  app.addEventListener('click', async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'reload') load(false);
    else if (act === 'level') { LEVEL = +b.dataset.v === 2 ? 2 : 1; render(); }
    else if (act === 'defi-masque') {
      b.disabled = true;
      try { await defiMask(id, b.dataset.v === '1'); render(); } catch (e) { b.disabled = false; alert('Ça n’a pas marché. Vérifie ta connexion et réessaie.'); }
    }
    else if (act === 'toggle') {
      const el = b.closest('.eleve');
      const cid = el.dataset.id;
      if (open.has(cid)) open.delete(cid); else open.add(cid);
      hideTip();
      el.outerHTML = cardHtml(cid);
      const again = app.querySelector(`.eleve[data-id="${CSS.escape(cid)}"] .more`);
      if (again) again.focus({ preventScroll: true });
    } else if (act === 'logout') { KEY = ''; RAW = []; EVENTS = []; storeKey('', false); render(); }
    else if (act === 'mine' || act === 'unmine') {
      if (act === 'mine' && !confirm('Ces parties sont les tiennes ? Elles ne seront plus affichées ni comptées (sans être effacées).')) return;
      b.disabled = true;
      try { await mark(id, act === 'mine'); open.delete(id); render(); } catch (e) { b.disabled = false; alert('Ça n’a pas marché. Vérifie ta connexion et réessaie.'); }
    } else if (act === 'delete') {
      const who = (students(EVENTS.filter((e) => e.eleve === id))[0] || {}).prenom || '';
      const de = !who ? 'de cet élève' : /^[aeiouyhàâäéèêëîïôöùûü]/i.test(who) ? `d’${who}` : `de ${who}`;
      if (!confirm(`Effacer définitivement toutes les données ${de} ?`)) return;
      b.disabled = true;
      try {
        const r = await fetch(`${API}/eleve?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + KEY } });
        if (!r.ok) throw new Error();
        RAW = RAW.filter((e) => e.eleve !== id);
        prepare();
        open.delete(id);
        render();
      } catch (e) { b.disabled = false; alert('L’effacement n’a pas abouti. Réessaie.'); }
    }
  });
  // une seule fiche redessinée quand on l'ouvre ou la ferme
  function cardHtml(id) {
    const s = students(EVENTS.filter((e) => e.eleve === id))[0];
    return s ? card(s) : '';
  }

  // bulle d'information : survol, focus clavier ou toucher
  let tipFor = null;
  function showTip(el) {
    let data;
    try { data = JSON.parse(el.dataset.tip); } catch (e) { return; }
    tip.innerHTML = '';
    const v = document.createElement('p'); v.className = 'tip-v'; v.textContent = data.v;
    const t = document.createElement('p'); t.className = 'tip-t'; t.textContent = data.t;
    tip.append(v, t);
    (data.l || []).forEach((line) => { const p = document.createElement('p'); p.className = 'tip-l'; p.textContent = line; tip.append(p); });
    // le résultat de chaque élève, sous un filet
    (data.p || []).forEach((line) => { const p = document.createElement('p'); p.className = 'tip-p'; p.textContent = line; tip.append(p); });
    tip.hidden = false;
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x = r.left + r.width / 2 - w / 2, y = r.top - h - 8;
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    if (y < 8) y = r.bottom + 8;
    tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    tipFor = el;
  }
  function hideTip() { tip.hidden = true; tipFor = null; }
  app.addEventListener('pointerover', (ev) => { const el = ev.target.closest('[data-tip]'); if (el && ev.pointerType === 'mouse') showTip(el); });
  app.addEventListener('pointerout', (ev) => {
    if (ev.pointerType !== 'mouse') return; // au doigt, la bulle reste jusqu'au toucher suivant
    const el = ev.target.closest('[data-tip]');
    if (el && el === tipFor && !el.contains(ev.relatedTarget)) hideTip();
  });
  app.addEventListener('focusin', (ev) => { const el = ev.target.closest('[data-tip]'); if (el) showTip(el); });
  app.addEventListener('focusout', (ev) => { if (ev.target === tipFor) hideTip(); });
  app.addEventListener('pointerup', (ev) => {
    if (ev.pointerType === 'mouse') return;
    const el = ev.target.closest('[data-tip]');
    if (el) showTip(el); else hideTip();
  });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------------- départ ---------------- */
  KEY = readKey();
  if (API && KEY) load(true); else render();
})();
