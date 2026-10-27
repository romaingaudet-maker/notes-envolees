/* ------------------------------------------------------------------
   Les Notes Envolées — page des mentions légales (mentions-legales.html)
   - « Retour au jeu » ramène à la version d'où l'on vient (papier ou laine) ;
   - la case coupe ou rétablit le suivi sur cet appareil (Suivi.exclude) ;
   - le code de l'appareil est celui que montre la page de suivi du professeur ;
   - le réglage de la voix, s'il y en a un, peut être effacé.
   Cette page n'envoie rien, sauf une chose : couper le suivi quand l'élève paraît au tableau d'honneur
   du Défi l'en retire d'abord (un dernier envoi, « publier : 0 »).
------------------------------------------------------------------- */
(() => {
  const $ = (id) => document.getElementById(id);

  const back = $('back');
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.origin === location.origin && ref.pathname !== location.pathname) {
      back.href = ref.origin + ref.pathname + ref.search;
      back.addEventListener('click', (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } });
    }
  } catch (e) { /* lien par défaut : la première version */ }

  const box = $('no-track'), state = $('track-state'), code = $('device-code');
  function paint(wanted) {
    const off = Suivi.excluded();
    box.checked = off;
    state.textContent = wanted != null && wanted !== off
      ? 'Ce navigateur refuse de garder ce choix (navigation privée ?) : le suivi ne peut pas être coupé ici.'
      : off ? 'Suivi coupé : plus rien ne part de cet appareil vers le professeur. Décochez la case pour le rétablir.'
        : 'Suivi actif sur cet appareil. Le choix est gardé dans ce navigateur.';
    const id = Suivi.id();
    code.textContent = id ? 'Code de cet appareil : ' : 'Ce navigateur n’a encore rien envoyé : il n’a pas de code.';
    if (id) code.append(Object.assign(document.createElement('span'), { className: 'code', textContent: '#' + id.slice(0, 4) }));
    code.hidden = false;
  }
  // couper le suivi retire aussi l'élève du tableau d'honneur du Défi : un dernier envoi, puis plus rien
  const NS = window.NE_NS || '', SK = NS + 'notes-envolees-reglages', DK = NS + 'notes-envolees-defi';
  function leaveBoard() {
    try {
      const st = JSON.parse(localStorage.getItem(SK) || 'null');
      if (!st || !st.affiche) return;
      // la course du Défi (src/app.js) : record, départ du record, étape en cours, nombre de départs
      const d = JSON.parse(localStorage.getItem(DK) || 'null') || {};
      const v2 = d.v === 2, num = (x, m) => Math.max(m, Math.floor(+x) || 0);
      const best = v2 ? num(d.best, 0) : 0, departs = v2 ? num(d.departs, 1) : 1;
      const w = String(st.prenom || '').split(' ').filter(Boolean);
      const nom = w.length > 1 ? `${w[0]} ${w[1][0].toUpperCase()}.` : w[0] || '';
      Suivi.send('defi', { inst: st.inst, jeu: st.jeu || '', comptines: best, essais: v2 ? num(d.bestDeparts, 0) || departs : 1, etape: v2 ? num(d.pos, 0) : 0, departs, publier: 0, nom });
      st.affiche = false;
      localStorage.setItem(SK, JSON.stringify(st));
    } catch (err) { /* rien à retirer */ }
  }
  box.addEventListener('change', () => { if (box.checked) leaveBoard(); Suivi.exclude(box.checked); paint(box.checked); });
  paint();

  // le réglage de la voix (« Régler ma voix »), gardé dans ce navigateur : on peut l'effacer
  const VK = (window.NE_NS || '') + 'notes-envolees-voix';
  const has = () => { try { return !!localStorage.getItem(VK); } catch (e) { return false; } };
  const wipe = $('voice-wipe'), vstate = $('voice-state');
  if (wipe && has()) {
    wipe.hidden = false;
    $('voice-forget').addEventListener('click', () => {
      try { localStorage.removeItem(VK); } catch (e) { /* stockage indisponible */ }
      $('voice-forget').hidden = true;
      vstate.textContent = has() ? 'Ce navigateur n’a pas pu l’effacer.' : 'Réglage de la voix effacé.';
    });
  }
})();
