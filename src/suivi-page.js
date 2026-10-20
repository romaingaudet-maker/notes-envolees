/* ------------------------------------------------------------------
   Les Notes Envolées — page de suivi des élèves (pour le professeur)

   Lit les résultats rangés par le Worker (suivi/worker.js) et montre :
   - pour chaque élève (un navigateur, avec son adresse IP) : instrument,
     progression sur le parcours des comptines, étoiles et erreurs sur
     chaque épreuve, activité récente ;
   - une synthèse par instrument, et la difficulté de chaque comptine
     selon l'instrument.
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
    none: 'Sans instrument', piano: 'Piano', flute: 'Flûte', clarinette: 'Clarinette', saxalto: 'Saxophone alto',
    trompette: 'Trompette', trombone: 'Trombone', cor: 'Cor', violon: 'Violon', alto: 'Alto', violoncelle: 'Violoncelle', xylophone: 'Xylophone',
  };
  const INST_SHORT = { none: 'Sans', clarinette: 'Clar.', saxalto: 'Sax.', trompette: 'Tromp.', trombone: 'Tromb.', violoncelle: 'Vlc.', xylophone: 'Xylo.' };
  const INST_ORDER = Object.keys(INST);
  const instName = (k) => INST[k] || nb(k || '?');
  const ECRAN = { telephone: 'téléphone', tablette: 'tablette', ordinateur: 'ordinateur' };
  const MIC_CODE = { denied: 'refusé', nomic: 'aucun micro', busy: 'micro déjà utilisé', unsupported: 'navigateur incompatible', noaudio: 'son indisponible', other: 'erreur' };
  const songTitle = (id) => (BY_ID[id] ? nb(BY_ID[id].title) : nb(id));
  const KEY_STORE = (window.NE_NS || '') + 'notes-envolees-prof-cle';
  const DAY = 864e5;

  /* ---------------- formats ---------------- */
  const NF2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const NF1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const NF0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const pct = (x) => `${NF0.format(Math.round(x * 100))} %`;
  const plural = (n, one, many) => `${NF0.format(n)} ${n > 1 ? many : one}`;
  function dur(s) {
    s = Math.round(num(s));
    if (s < 60) return `${s} s`;
    if (s < 3600) return `${Math.round(s / 60)} min`;
    const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  }
  const DF_TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const DF_DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const DF_YEAR = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  function when(t) {
    const d = new Date(t), now = new Date(NOW);
    const mins = (now - d) / 60000;
    if (mins < 1) return 'à l’instant';
    if (mins < 60) return `il y a ${Math.round(mins)} min`;
    if (d.toDateString() === now.toDateString()) return `aujourd’hui à ${DF_TIME.format(d)}`;
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return `hier à ${DF_TIME.format(d)}`;
    if (d.getFullYear() !== now.getFullYear()) return DF_YEAR.format(d);
    return `${DF_DAY.format(d)} à ${DF_TIME.format(d)}`;
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
  // le réseau : l'adresse IPv4 entière, ou les 4 premiers groupes en IPv6 (le réseau du foyer)
  const net = (ip) => (ip && ip.includes(':') ? v6groups(ip).slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, '')).join(':') + '::/64' : ip || '');
  const ipShort = (ip) => (!ip ? 'adresse inconnue' : ip.includes(':') ? v6groups(ip).slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, '')).join(':') + ':…' : ip);

  /* ---------------- état ---------------- */
  let KEY = '';
  let EVENTS = [];
  let NOW = Date.now();
  let loadedAt = 0;
  const F = { periode: 'tout', inst: '', micro: false, niveau: 1, tri: 'recent' };
  const openCards = new Set();
  let ALL = []; // élèves affichés (pour repérer ceux qui partagent un réseau)
  const defaultFilters = () => F.periode === 'tout' && !F.inst && !F.micro;

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
    let depuis = EVENTS.length ? EVENTS[EVENTS.length - 1].n : 0;
    for (let guard = 0; guard < 400; guard++) {
      let r;
      try {
        r = await fetch(`${Suivi.url}/donnees?depuis=${depuis}`, { headers: { Authorization: 'Bearer ' + KEY }, cache: 'no-store' });
      } catch (e) {
        throw Object.assign(new Error('Le Worker ne répond pas. Vérifie son adresse dans src/suivi.js, ou ta connexion.'), { code: 'reseau' });
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
        EVENTS.push({ n, t, eleve, ip: ip || '', type, d: d && typeof d === 'object' && !Array.isArray(d) ? d : {} });
      }
      if (!j.suite || !(j.evenements || []).length) break;
      depuis = j.evenements[j.evenements.length - 1][0];
    }
    loadedAt = Date.now();
  }

  /* ---------------- calculs ---------------- */
  function filtered() {
    const since = F.periode === '7' ? NOW - 7 * DAY : F.periode === '30' ? NOW - 30 * DAY : 0;
    return EVENTS.filter((e) => e.t >= since && (!F.inst || (e.d.inst || 'none') === F.inst) && (!F.micro || e.d.mode === 'mic'));
  }

  const epKey = (id, lv) => id + '@' + lv;
  function students(evs) {
    const map = new Map();
    for (const e of evs) {
      let s = map.get(e.eleve);
      if (!s) {
        s = { id: e.eleve, ips: new Map(), first: e.t, last: e.t, insts: new Map(), lastInst: '', mic: 0, xylo: 0, ecran: '', snap: null, ep: new Map(), temps: 0, evs: [], micErr: new Set() };
        map.set(e.eleve, s);
      }
      s.first = Math.min(s.first, e.t);
      s.last = Math.max(s.last, e.t);
      s.evs.push(e);
      if (e.ip) {
        const r = s.ips.get(e.ip) || { first: e.t, last: e.t, n: 0 };
        r.n++; r.first = Math.min(r.first, e.t); r.last = Math.max(r.last, e.t);
        s.ips.set(e.ip, r);
      }
      const d = e.d;
      if (d.inst) s.lastInst = d.inst;
      if (e.type === 'visite') {
        if (ECRAN[d.ecran]) s.ecran = d.ecran;
        if (d.etoiles && typeof d.etoiles === 'object') s.snap = d.etoiles;
        continue;
      }
      if (e.type === 'micro') { s.micErr.add(MIC_CODE[d.code] || 'erreur'); continue; }
      if (e.type === 'debut') {
        s.insts.set(d.inst || 'none', (s.insts.get(d.inst || 'none') || 0) + 1);
        if (d.mode === 'mic') s.mic++; else s.xylo++;
      }
      if (!BY_ID[d.c]) continue;
      const k = epKey(d.c, d.niveau === 2 ? 2 : 1);
      let ep = s.ep.get(k);
      if (!ep) { ep = { debuts: 0, fins: [], sorties: [], bilans: [] }; s.ep.set(k, ep); }
      if (e.type === 'debut') ep.debuts++;
      else if (e.type === 'fin') { ep.fins.push(d); s.temps += num(d.duree); }
      else if (e.type === 'sortie') { ep.sorties.push(d); s.temps += num(d.duree); }
      else if (e.type === 'bilan') ep.bilans.push(d);
    }
    return [...map.values()];
  }
  // meilleur nombre d'étoiles : parties suivies, plus (sans filtre) ce que l'appareil de l'élève avait déjà enregistré
  function best(s, id, lv) {
    const ep = s.ep.get(epKey(id, lv));
    let b = ep ? Math.max(0, ...ep.fins.map((d) => starsOf(d.etoiles))) : 0;
    if (defaultFilters() && s.snap) b = Math.max(b, starsOf(s.snap[lv === 2 ? id + '@2' : id]));
    return b;
  }
  const progress = (s, lv) => LIB.filter((song) => best(s, song.id, lv) > 0).length;
  function mainInst(s) {
    let k = '', n = -1;
    s.insts.forEach((c, i) => { if (c > n || (c === n && i !== 'none')) { k = i; n = c; } });
    return k || s.lastInst || 'none';
  }
  const lastIp = (s) => [...s.ips.entries()].sort((a, b) => b[1].last - a[1].last).map(([ip]) => ip)[0] || '';

  function byInstrument(evs) {
    const map = new Map();
    for (const e of evs) {
      if (e.type !== 'debut' && e.type !== 'fin' && e.type !== 'sortie') continue;
      const d = e.d, k = d.inst || 'none';
      let r = map.get(k);
      if (!r) { r = { inst: k, eleves: new Set(), debuts: 0, mic: 0, fins: [0, 0, 0], err: [0, 0, 0], sur: [0, 0, 0], sorties: 0 }; map.set(k, r); }
      r.eleves.add(e.eleve);
      if (e.type === 'debut') { r.debuts++; if (d.mode === 'mic') r.mic++; }
      else if (e.type === 'fin') { const lv = d.niveau === 2 ? 2 : 1; r.fins[lv]++; r.err[lv] += num(d.erreurs); r.sur[lv] += num(d.sur); }
      else r.sorties++;
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
      if (!c) { c = { fins: 0, err: 0, sur: 0, sorties: 0, fait: 0, surS: 0, eleves: new Set(), duree: 0, etoiles: 0 }; m.set(k, c); }
      c.eleves.add(e.eleve);
      if (e.type === 'fin') { c.fins++; c.err += num(d.erreurs); c.sur += num(d.sur); c.duree += num(d.duree); c.etoiles += starsOf(d.etoiles); }
      else { c.sorties++; c.fait += num(d.fait); c.surS += num(d.sur); }
    }
    return m;
  }

  /* ---------------- dessin ---------------- */
  const RAMP = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
  const RAMP_DARK = [...RAMP].reverse();
  const darkMode = () => window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  // niveau 1 : erreurs par note (3 étoiles jusqu'à 0,2 ; 2 étoiles jusqu'à 0,6) ; niveau 2 : essais ratés par phrase (0,25 ; 1)
  const SCALE = { 1: { max: 1.2, cuts: [0.2, 0.6], unit: 'erreur par note', units: 'erreurs par note' }, 2: { max: 2, cuts: [0.25, 1], unit: 'essai raté par phrase', units: 'essais ratés par phrase' } };
  function heatColor(v, lv) {
    const ramp = darkMode() ? RAMP_DARK : RAMP;
    const i = Math.round(Math.min(1, v / SCALE[lv].max) * (ramp.length - 1));
    const dark = darkMode() ? i <= 5 : i >= 7;
    return { bg: ramp[i], ink: dark ? '#ffffff' : '#0b1a33' };
  }
  const DASH = '<span class="mute">—</span>';
  const starIcons = (n) => `<span class="stars" aria-label="${n} étoile${n > 1 ? 's' : ''} sur 3">${[1, 2, 3].map((k) => `<b class="${k <= n ? 'on' : ''}">★</b>`).join('')}</span>`;

  function render() {
    if (!Suivi.url) { renderSetup(); return; }
    if (!KEY) { renderLogin(); return; }
    const evs = filtered();
    const st = students(evs);
    ALL = st;
    const inst = byInstrument(evs);
    const fins = evs.filter((e) => e.type === 'fin');
    const sorties = evs.filter((e) => e.type === 'sortie').length;
    const debuts = evs.filter((e) => e.type === 'debut');
    const temps = st.reduce((a, s) => a + s.temps, 0);
    const actifs = st.filter((s) => s.last >= NOW - 7 * DAY).length;
    const micShare = debuts.length ? debuts.filter((e) => e.d.mode === 'mic').length / debuts.length : 0;
    const instKeys = [...new Set(EVENTS.map((e) => e.d.inst).filter(Boolean))].sort((a, b) => INST_ORDER.indexOf(a) - INST_ORDER.indexOf(b));
    const sel = (opts, cur) => opts.map(([v, t]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(t)}</option>`).join('');
    const seg = (name, opts, cur) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" role="radio" data-f="${name}" data-v="${esc(v)}" aria-checked="${String(v) === String(cur)}">${esc(t)}</button>`).join('')}</div>`;

    app.innerHTML = `
    ${header()}
    <main class="wrap">
      <div class="filters" aria-label="Filtres">
        <label class="fld"><span>Période</span><select data-f="periode">${sel([['tout', 'Depuis le début'], ['30', '30 derniers jours'], ['7', '7 derniers jours']], F.periode)}</select></label>
        <label class="fld"><span>Instrument</span><select data-f="inst">${sel([['', 'Tous les instruments'], ...instKeys.map((k) => [k, instName(k)])], F.inst)}</select></label>
        <label class="fld chk"><input type="checkbox" data-f="micro"${F.micro ? ' checked' : ''}><span>Au micro seulement</span></label>
      </div>
      ${EVENTS.length ? '' : `<div class="empty"><p><b>Aucune partie pour l’instant.</b> Dès qu’un élève ouvrira le jeu, il apparaîtra ici.</p></div>`}
      <section class="tiles" aria-label="En bref">
        ${tile('Élèves', NF0.format(st.length), `${plural(actifs, 'actif', 'actifs')} ces 7 derniers jours`)}
        ${tile('Comptines terminées', NF0.format(fins.length), `niveau 1 : ${NF0.format(fins.filter((e) => e.d.niveau !== 2).length)} · niveau 2 : ${NF0.format(fins.filter((e) => e.d.niveau === 2).length)}`)}
        ${tile('Temps de jeu', dur(temps), st.length ? `${dur(temps / st.length)} par élève en moyenne` : '—')}
        ${tile('Joué au micro', debuts.length ? pct(micShare) : '—', 'des comptines commencées')}
        ${tile('Abandons', fins.length + sorties ? pct(sorties / (fins.length + sorties)) : '—', 'comptines quittées avant la fin')}
      </section>

      <section class="card" id="instruments">
        <div class="card-head">
          <h2>Par instrument</h2>
          <p>L’instrument choisi au moment de jouer. « Au micro » : l’élève jouait sur son instrument ; sinon, sur le xylophone de l’écran.</p>
        </div>
        ${inst.length ? instTable(inst) : '<p class="mute pad">Pas encore de partie avec ces filtres.</p>'}
      </section>

      <section class="card" id="difficulte">
        <div class="card-head row">
          <div class="ch-text">
            <h2>Difficulté des comptines selon l’instrument</h2>
            <p>${F.niveau === 2 ? 'Niveau 2 : essais ratés par phrase' : 'Niveau 1 : erreurs par note'}, sur les comptines terminées. ${darkMode() ? 'Plus la case est claire' : 'Plus la case est foncée'}, plus c’est difficile ; le chemin va de la plus facile (1) à la plus difficile (20).</p>
          </div>
          ${seg('niveau', [[1, 'Niveau 1'], [2, 'Niveau 2']], F.niveau)}
        </div>
        ${heatmap(evs, inst)}
      </section>

      <section class="card" id="eleves">
        <div class="card-head row">
          <div class="ch-text">
            <h2>Élèves</h2>
            <p>Un élève = un navigateur (sans compte), avec l’adresse IP de sa connexion. ${defaultFilters() ? 'Les étoiles comptent aussi celles déjà gagnées sur son appareil avant le suivi.' : 'Avec ces filtres, seules les parties correspondantes comptent.'}</p>
          </div>
          <label class="fld"><span>Trier</span><select data-f="tri">${sel([['recent', 'Dernière activité'], ['progres', 'Progression'], ['ip', 'Adresse IP']], F.tri)}</select></label>
        </div>
        <div class="legend-row" aria-hidden="true"><span class="lg"><span class="m s0"><b></b><b></b><b></b></span>pas encore jouée</span><span class="lg"><span class="m s0 tried"><b></b><b></b><b></b></span>commencée</span><span class="lg"><span class="m s2"><b></b><b></b><b></b></span>terminée, de 1 à 3 étoiles</span></div>
        <div class="list">${sortStudents(st).map(card).join('') || '<p class="mute pad">Aucun élève avec ces filtres.</p>'}</div>
      </section>

      <footer class="foot">
        <label class="chk"><input type="checkbox" id="exclude"${Suivi.excluded() ? ' checked' : ''}><span>Ne pas suivre mes propres parties sur cet appareil</span></label>
        <p>À cocher sur chaque appareil (ordinateur, téléphone…) où tu testes le jeu : ton suivi n’ira pas se mêler à celui des élèves. ${Suivi.id() ? `Cet appareil est l’élève <code>#${esc(Suivi.id().slice(0, 4))}</code>.` : ''}</p>
        <p>Les résultats de plus de 13 mois s’effacent tout seuls. Le son du micro n’est jamais envoyé.</p>
      </footer>
    </main>`;
  }

  function header() {
    const ago = loadedAt ? `mis à jour ${when(loadedAt)}` : '';
    return `<header class="top">
      <div class="top-in">
        <div class="brand"><span class="mark">Les Notes Envolées</span><h1>Suivi des élèves</h1></div>
        <div class="top-act">
          <span class="upd" id="upd">${esc(ago)} · ${plural(EVENTS.length, 'événement', 'événements')}</span>
          <button type="button" class="btn" data-act="reload">Actualiser</button>
          <button type="button" class="btn ghost" data-act="logout">Se déconnecter</button>
        </div>
      </div>
    </header>`;
  }

  const tile = (label, value, sub) => `<div class="tile"><p class="t-l">${esc(label)}</p><p class="t-v">${esc(value)}</p><p class="t-s">${esc(sub)}</p></div>`;

  function instTable(rows) {
    const ratio = (r, lv) => (r.sur[lv] ? NF2.format(r.err[lv] / r.sur[lv]) : '—');
    const body = rows.map((r) => {
      const done = r.fins[1] + r.fins[2], ab = done + r.sorties ? r.sorties / (done + r.sorties) : null;
      const mic = r.debuts ? r.mic / r.debuts : null;
      return `<tr>
        <th scope="row">${esc(instName(r.inst))}</th>
        <td>${NF0.format(r.eleves.size)}</td>
        <td>${mic == null ? '—' : `<span class="meter" style="--v:${mic.toFixed(3)}"><i></i></span>${pct(mic)}`}</td>
        <td>${NF0.format(r.fins[1])} <span class="mute">/</span> ${NF0.format(r.fins[2])}</td>
        <td>${ratio(r, 1)}</td>
        <td>${ratio(r, 2)}</td>
        <td>${ab == null ? '—' : pct(ab)}</td>
      </tr>`;
    }).join('');
    return `<div class="scroll"><table class="tbl">
      <thead><tr><th scope="col">Instrument</th><th scope="col">Élèves</th><th scope="col">Au micro</th><th scope="col">Terminées<br><small>niv. 1 / niv. 2</small></th><th scope="col">Erreurs par note<br><small>niv. 1</small></th><th scope="col">Essais ratés par phrase<br><small>niv. 2</small></th><th scope="col">Abandons</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function heatmap(evs, instRows) {
    const lv = F.niveau;
    const cells = heatCells(evs, lv);
    const cols = instRows.map((r) => r.inst).filter((k) => LIB.some((s) => cells.has(s.id + '|' + k)));
    if (!cols.length) return `<p class="mute pad">Aucune comptine ${lv === 2 ? 'du niveau 2 ' : ''}terminée ou commencée avec ces filtres.</p>`;
    const sc = SCALE[lv];
    const head = `<div class="h-corner">Comptine</div>${cols.map((k) => `<div class="h-col" title="${esc(instName(k))}"><span class="l">${esc(instName(k))}</span><span class="s">${esc(INST_SHORT[k] || instName(k))}</span></div>`).join('')}`;
    const rows = LIB.map((song) => {
      const label = `<div class="h-row" title="${esc(nb(song.title))}"><b>${song.level}</b> ${esc(nb(song.title))}</div>`;
      const tds = cols.map((k) => {
        const c = cells.get(song.id + '|' + k);
        if (!c) return '<div class="hc none"></div>';
        const t = `${nb(song.title)} · ${instName(k)} · niveau ${lv}`;
        if (!c.fins) {
          const lines = [`${plural(c.sorties, 'abandon', 'abandons')}, jamais terminée`, c.surS ? `en moyenne ${NF0.format(c.fait / c.sorties)} sur ${NF0.format(c.surS / c.sorties)} ${lv === 2 ? 'phrases' : 'notes'} au moment d’arrêter` : '', plural(c.eleves.size, 'élève', 'élèves')];
          return `<div class="hc ab" tabindex="0" data-tip="${esc(JSON.stringify({ t, v: 'Abandonnée', l: lines.filter(Boolean) }))}"><span>ab.</span></div>`;
        }
        const v = c.err / Math.max(1, c.sur);
        const { bg, ink } = heatColor(v, lv);
        const lines = [
          `${plural(c.fins, 'fois terminée', 'fois terminée')} par ${plural(c.eleves.size, 'élève', 'élèves')}`,
          `${NF1.format(c.etoiles / c.fins)} étoile${c.etoiles / c.fins >= 2 ? 's' : ''} en moyenne · ${dur(c.duree / c.fins)} par partie`,
          c.sorties ? plural(c.sorties, 'abandon', 'abandons') : '',
        ];
        return `<div class="hc" tabindex="0" style="--bg:${bg};--ink:${ink}" data-tip="${esc(JSON.stringify({ t, v: `${NF2.format(v)} ${v >= 2 ? sc.units : sc.unit}`, l: lines.filter(Boolean) }))}"><span>${NF2.format(v)}</span>${c.sorties ? '<i class="abm" aria-hidden="true"></i>' : ''}</div>`;
      }).join('');
      return label + tds;
    }).join('');
    const ramp = darkMode() ? RAMP_DARK : RAMP;
    const stop = (x) => `${((x / sc.max) * 100).toFixed(1)}%`;
    const legend = `<div class="scale" aria-hidden="true">
        <div class="scale-bar" style="background:linear-gradient(90deg,${ramp.join(',')})"></div>
        <div class="scale-ticks"><span style="left:0">0</span><span style="left:${stop(sc.cuts[0])}">${NF2.format(sc.cuts[0])}</span><span style="left:${stop(sc.cuts[1])}">${NF2.format(sc.cuts[1])}</span><span style="left:100%">${NF2.format(sc.max)}+</span></div>
        <div class="scale-zones"><span style="left:0;width:${stop(sc.cuts[0])}">3 étoiles</span><span style="left:${stop(sc.cuts[0])};width:calc(${stop(sc.cuts[1])} - ${stop(sc.cuts[0])})">2 étoiles</span><span style="left:${stop(sc.cuts[1])};right:0">1 étoile</span></div>
      </div>
      <p class="mute small"><span class="hc ab mini" aria-hidden="true"><span>ab.</span></span> commencée mais jamais terminée · <span class="abm-key" aria-hidden="true"></span> au moins un abandon. Touche ou survole une case pour le détail.</p>`;
    return `<div class="scroll"><div class="heat" style="--cols:${cols.length}" role="grid" aria-label="Difficulté par comptine et par instrument">${head}${rows}</div></div>${legend}`;
  }

  function sortStudents(st) {
    const by = {
      recent: (a, b) => b.last - a.last,
      progres: (a, b) => progress(b, 1) + progress(b, 2) - progress(a, 1) - progress(a, 2) || b.last - a.last,
      ip: (a, b) => net(lastIp(a)).localeCompare(net(lastIp(b))) || b.last - a.last,
    };
    return st.sort(by[F.tri] || by.recent);
  }

  function strip(s, lv) {
    return LIB.map((song) => {
      const b = best(s, song.id, lv);
      const ep = s.ep.get(epKey(song.id, lv));
      const tried = !b && ep && (ep.debuts || ep.sorties.length);
      const t = `${song.level} · ${nb(song.title)} — niveau ${lv}`;
      const v = b ? `${b} étoile${b > 1 ? 's' : ''}` : tried ? 'commencée' : 'pas encore jouée';
      const l = ep && ep.fins.length ? [`terminée ${plural(ep.fins.length, 'fois', 'fois')}`] : [];
      return `<span class="m s${b}${tried ? ' tried' : ''}" data-tip="${esc(JSON.stringify({ t, v, l }))}"><b></b><b></b><b></b></span>`;
    }).join('');
  }

  function card(s) {
    const ip = lastIp(s);
    const nets = new Set([...s.ips.keys()].map(net));
    const shared = ip ? ALL.filter((o) => o.id !== s.id && [...o.ips.keys()].some((x) => net(x) === net(ip))).length : 0;
    const main = mainInst(s);
    const others = [...s.insts.keys()].filter((k) => k !== main).map(instName);
    const plays = s.mic + s.xylo;
    const how = !plays ? '' : s.mic === plays ? 'au micro' : !s.mic ? 'au xylophone de l’écran' : `au micro ${pct(s.mic / plays)} du temps`;
    const me = Suivi.id() === s.id;
    const p1 = progress(s, 1), p2 = progress(s, 2);
    const open = openCards.has(s.id);
    return `<article class="eleve" data-id="${esc(s.id)}">
      <header class="e-head">
        <p class="e-ip"><span class="ip" title="${esc(ip)}">${esc(ipShort(ip))}</span>${nets.size > 1 ? `<span class="chip" title="${esc([...s.ips.keys()].join('\n'))}">+${nets.size - 1} autre${nets.size > 2 ? 's' : ''}</span>` : ''}<span class="code">#${esc(s.id.slice(0, 4))}</span>${me ? '<span class="chip me">cet appareil</span>' : ''}${shared ? `<span class="chip" title="Même adresse (ou même réseau) que ${shared} autre${shared > 1 ? 's' : ''} élève${shared > 1 ? 's' : ''} : même famille, même école ou réseau mobile partagé">même réseau que ${shared} autre${shared > 1 ? 's' : ''}</span>` : ''}</p>
        <p class="e-inst"><b>${esc(instName(main))}</b>${how ? ` · ${esc(how)}` : ''}${others.length ? ` <span class="mute">(aussi : ${esc(others.join(', '))})</span>` : ''}${s.ecran ? ` · ${esc(ECRAN[s.ecran])}` : ''}</p>
        <p class="e-meta">Dernière activité ${esc(when(s.last))} · ${esc(dur(s.temps))} de jeu${s.first < s.last - DAY ? ` depuis ${esc(day(s.first))}` : ''}${s.micErr.size ? ` · <span class="warn">micro : ${esc([...s.micErr].join(', '))}</span>` : ''}</p>
      </header>
      <div class="e-path">
        <p class="p-l">Niveau 1</p><div class="p-strip">${strip(s, 1)}</div><p class="p-n"><b>${p1}</b>/${LIB.length}</p>
        <p class="p-l">Niveau 2</p><div class="p-strip">${strip(s, 2)}</div><p class="p-n"><b>${p2}</b>/${LIB.length}</p>
      </div>
      <details${open ? ' open' : ''}>
        <summary>Détail des épreuves</summary>
        ${detail(s)}
      </details>
    </article>`;
  }

  function levelCell(s, id, lv) {
    const ep = s.ep.get(epKey(id, lv));
    const b = best(s, id, lv);
    if (!ep || (!ep.fins.length && !ep.sorties.length)) {
      if (b) return `${starIcons(b)}<small>avant le suivi</small>`;
      return ep && ep.debuts ? '<span class="mute">ouverte</span>' : DASH;
    }
    const fins = ep.fins;
    const out = [];
    if (fins.length) {
      const sur = fins.reduce((a, d) => a + num(d.sur), 0), err = fins.reduce((a, d) => a + num(d.erreurs), 0);
      const lastF = fins[fins.length - 1];
      out.push(`${starIcons(b)} <span class="x">${plural(fins.length, 'fois', 'fois')}</span>`);
      const ratio = sur ? err / sur : 0;
      const helps = [lastF.montrees ? `${plural(num(lastF.montrees), 'note montrée', 'notes montrées')}` : '', lastF.lent ? 'au ralenti' : ''].filter(Boolean);
      out.push(`<small>${NF2.format(ratio)} ${lv === 2 ? (ratio >= 2 ? 'essais ratés/phrase' : 'essai raté/phrase') : (ratio >= 2 ? 'erreurs/note' : 'erreur/note')} · ${dur(fins.reduce((a, d) => a + num(d.duree), 0) / fins.length)}${helps.length ? ` · dernière fois ${helps.join(', ')}` : ''}</small>`);
    } else if (b) out.push(`${starIcons(b)}<small>avant le suivi</small>`);
    if (ep.sorties.length) {
      const last = ep.sorties[ep.sorties.length - 1];
      out.push(`<small class="ab-t">${plural(ep.sorties.length, 'abandon', 'abandons')}${num(last.sur) ? ` (la dernière fois à ${NF0.format(num(last.fait))}/${NF0.format(num(last.sur))} ${lv === 2 ? 'phrases' : 'notes'})` : ''}</small>`);
    }
    return out.join('');
  }

  function fullCell(s, id) {
    const bl = [...((s.ep.get(epKey(id, 1)) || {}).bilans || []), ...((s.ep.get(epKey(id, 2)) || {}).bilans || [])];
    if (!bl.length) return DASH;
    const perfect = bl.some((d) => d.parfait), ok = bl.some((d) => d.reussi);
    const bestTry = bl.reduce((a, d) => (num(d.enPlace) > num(a.enPlace) ? d : a), bl[0]);
    const head = perfect ? '<b class="ok">✓ parfaite</b>' : ok ? '<b class="ok">✓ réussie</b>' : `<b class="no">✗ pas encore</b>`;
    return `${head} <span class="x">${plural(bl.length, 'essai', 'essais')}</span><small>au mieux ${NF0.format(num(bestTry.enPlace))}/${NF0.format(num(bestTry.sur))} notes en place</small>`;
  }

  function describe(e) {
    const d = e.d, song = BY_ID[d.c], lv = d.niveau === 2 ? 2 : 1;
    const where = song ? `« ${esc(nb(song.title))} », niveau ${lv}` : '';
    const how = `${esc(instName(d.inst || 'none'))}${d.mode === 'mic' ? ', au micro' : d.mode === 'xylo' ? ', au xylophone' : ''}`;
    switch (e.type) {
      case 'visite': return `Ouvre le jeu <span class="mute">(${esc(ECRAN[d.ecran] || 'appareil ?')} · ${how})</span>`;
      case 'debut': return `Commence ${where} <span class="mute">(${how})</span>`;
      case 'fin': return `Termine ${where} : ${starIcons(starsOf(d.etoiles))} <span class="mute">${plural(num(d.erreurs), lv === 2 ? 'essai raté' : 'erreur', lv === 2 ? 'essais ratés' : 'erreurs')} sur ${plural(num(d.sur), lv === 2 ? 'phrase' : 'note', lv === 2 ? 'phrases' : 'notes')}, ${dur(d.duree)} (${how})</span>`;
      case 'sortie': return `Quitte ${where} à ${NF0.format(num(d.fait))}/${NF0.format(num(d.sur))} ${lv === 2 ? 'phrases' : 'notes'} <span class="mute">${plural(num(d.erreurs), lv === 2 ? 'essai raté' : 'erreur', lv === 2 ? 'essais ratés' : 'erreurs')}, ${dur(d.duree)} (${how})</span>`;
      case 'bilan': return `Toute la comptine ${where} : ${d.reussi ? (d.parfait ? 'parfaite' : 'réussie') : 'pas encore'} <span class="mute">${NF0.format(num(d.enPlace))}/${NF0.format(num(d.sur))} notes en place${d.derive ? `, a ${d.derive === 'faster' ? 'accéléré' : 'ralenti'}` : ''}</span>`;
      case 'micro': return `Le micro n’a pas démarré <span class="mute">(${esc(MIC_CODE[d.code] || 'erreur')})</span>`;
      default: return esc(e.type);
    }
  }

  function detail(s) {
    const td = (label, html) => `<td data-l="${label}"${html === DASH ? ' class="nil"' : ''}>${html}</td>`;
    const rows = LIB.filter((song) => s.ep.has(epKey(song.id, 1)) || s.ep.has(epKey(song.id, 2)) || best(s, song.id, 1) || best(s, song.id, 2))
      .map((song) => `<tr><th scope="row"><b>${song.level}</b> ${esc(nb(song.title))}</th>${td('Niveau 1 · les notes', levelCell(s, song.id, 1))}${td('Niveau 2 · notes et rythme', levelCell(s, song.id, 2))}${td('Toute la comptine en rythme', fullCell(s, song.id))}</tr>`).join('');
    const ips = [...s.ips.entries()].sort((a, b) => b[1].last - a[1].last)
      .map(([ip, r]) => `<li><code>${esc(ip)}</code> <span class="mute">${plural(r.n, 'fois', 'fois')}, ${r.first === r.last || day(r.first) === day(r.last) ? esc(day(r.last)) : `du ${esc(day(r.first))} au ${esc(day(r.last))}`}</span></li>`).join('');
    const recent = s.evs.slice(-14).reverse().map((e) => `<li><time>${esc(when(e.t))}</time><span>${describe(e)}</span></li>`).join('');
    return `<div class="d-wrap">
      ${rows ? `<div class="scroll"><table class="tbl ep"><thead><tr><th scope="col">Comptine</th><th scope="col">Niveau 1 · les notes</th><th scope="col">Niveau 2 · notes et rythme</th><th scope="col">Toute la comptine en rythme</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="mute">Aucune comptine commencée.</p>'}
      <div class="d-cols">
        <div><h3>Adresses IP</h3><ul class="ips">${ips || '<li class="mute">aucune</li>'}</ul></div>
        <div><h3>Activité récente</h3><ol class="feed">${recent}</ol></div>
      </div>
      <p class="d-del"><button type="button" class="btn danger" data-act="delete" data-id="${esc(s.id)}">Effacer le suivi de cet élève</button></p>
    </div>`;
  }

  function renderSetup() {
    app.innerHTML = `${'<header class="top"><div class="top-in"><div class="brand"><span class="mark">Les Notes Envolées</span><h1>Suivi des élèves</h1></div></div></header>'}
    <main class="wrap narrow"><section class="card pad">
      <h2>Le suivi n’est pas encore branché</h2>
      <p>Il manque l’adresse du Worker Cloudflare dans <code>src/suivi.js</code> (constante <code>SUIVI_URL</code>). La marche à suivre est dans <code>suivi/LISEZMOI.md</code>.</p>
    </section></main>`;
  }

  function renderLogin(msg) {
    app.innerHTML = `<header class="top"><div class="top-in"><div class="brand"><span class="mark">Les Notes Envolées</span><h1>Suivi des élèves</h1></div></div></header>
    <main class="wrap narrow"><form class="card pad login" id="login">
      <h2>Clé de la page de suivi</h2>
      <p>C’est le secret <code>CLE_PROF</code> enregistré dans le Worker.</p>
      <label class="fld block"><span>Clé</span><input type="password" name="cle" autocomplete="current-password" required minlength="8" autofocus></label>
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
    if (full) EVENTS = [];
    renderBusy('Chargement…');
    try {
      await fetchEvents();
      document.body.classList.remove('busy');
      render();
    } catch (e) {
      document.body.classList.remove('busy');
      if (e.code === 'cle') { KEY = ''; storeKey('', false); renderLogin('Clé incorrecte.'); return; }
      if (EVENTS.length && document.getElementById('upd')) { document.getElementById('upd').textContent = e.message; return; }
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
  app.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.id === 'exclude') { Suivi.exclude(t.checked); return; }
    const f = t.dataset && t.dataset.f;
    if (!f) return;
    F[f] = t.type === 'checkbox' ? t.checked : t.value;
    render();
  });
  app.addEventListener('click', async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.f === 'niveau') { F.niveau = +b.dataset.v === 2 ? 2 : 1; render(); return; }
    const act = b.dataset.act;
    if (act === 'reload') load(false);
    else if (act === 'logout') { KEY = ''; EVENTS = []; storeKey('', false); render(); }
    else if (act === 'delete') {
      const id = b.dataset.id;
      if (!confirm('Effacer définitivement tout le suivi de cet élève ?')) return;
      b.disabled = true;
      try {
        const r = await fetch(`${Suivi.url}/eleve?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + KEY } });
        if (!r.ok) throw new Error();
        EVENTS = EVENTS.filter((e) => e.eleve !== id);
        openCards.delete(id);
        render();
      } catch (e) { b.disabled = false; alert('L’effacement n’a pas abouti. Réessaie.'); }
    }
  });
  app.addEventListener('toggle', (ev) => {
    const card = ev.target.closest && ev.target.closest('.eleve');
    if (!card) return;
    if (ev.target.open) openCards.add(card.dataset.id); else openCards.delete(card.dataset.id);
  }, true);

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
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (KEY && EVENTS) render(); });

  /* ---------------- départ ---------------- */
  KEY = readKey();
  if (Suivi.url && KEY) load(true); else render();
})();
