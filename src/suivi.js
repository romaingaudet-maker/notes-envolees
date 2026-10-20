/* ------------------------------------------------------------------
   Les Notes Envolées — suivi des parties, pour le professeur

   Le jeu envoie au Worker du professeur (suivi/worker.js) le déroulé des
   parties : comptine, niveau, instrument choisi, xylophone ou micro,
   étoiles, erreurs, durée. Pas de compte : chaque navigateur reçoit un
   identifiant tiré au hasard, gardé sur l'appareil ; le Worker y ajoute
   l'adresse IP de la connexion. Le son du micro n'est jamais envoyé.
   Tant que SUIVI_URL est vide, rien ne part.
------------------------------------------------------------------- */
const Suivi = (() => {
  // adresse du Worker Cloudflare, sans « / » à la fin (vide : suivi coupé)
  // (la version de qualification passe window.NE_SUIVI_URL = '' : ses essais ne partent pas dans le suivi)
  const W = typeof window !== 'undefined' ? window : {};
  const SUIVI_URL = W.NE_SUIVI_URL != null ? W.NE_SUIVI_URL : 'https://notes-envolees-suivi.romain-gaudet.workers.dev';
  const NS = W.NE_NS || ''; // préfixe des clés du stockage local (qualification : 'qualif-')
  const ID_KEY = NS + 'notes-envolees-id';       // identifiant de ce navigateur
  const OFF_KEY = NS + 'notes-envolees-suivi-off'; // '1' : appareil du professeur, à ne pas suivre

  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } };

  let memo = null;
  function id() {
    const v = get(ID_KEY);
    if (v && /^[a-z0-9]{6,32}$/.test(v)) return v;
    if (!memo) {
      const abc = 'abcdefghijkmnpqrstuvwxyz23456789', a = new Uint8Array(12);
      crypto.getRandomValues(a);
      memo = Array.from(a, (x) => abc[x % abc.length]).join('');
    }
    put(ID_KEY, memo);
    return memo;
  }

  // temps passé page visible (ms) : la durée d'une partie ne compte pas l'onglet caché
  let shown = 0, since = document.hidden ? null : performance.now();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (since != null) { shown += performance.now() - since; since = null; } }
    else if (since == null) since = performance.now();
  });
  const clock = () => shown + (since != null ? performance.now() - since : 0);

  const excluded = () => get(OFF_KEY) === '1';
  const active = () => !!SUIVI_URL && !excluded();

  function send(type, data) {
    if (!active()) return;
    const body = JSON.stringify(Object.assign({ e: id(), y: type, v: 1 }, data));
    const url = SUIVI_URL + '/e';
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return; } catch (e) { /* on essaie autrement */ }
    try { fetch(url, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => {}); } catch (e) { /* tant pis */ }
  }

  function device() {
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const small = Math.min(screen.width || 0, screen.height || 0) < 600;
    return coarse ? (small ? 'telephone' : 'tablette') : 'ordinateur';
  }

  return {
    url: SUIVI_URL,
    configured: !!SUIVI_URL,
    active, send, clock, device,
    id: () => get(ID_KEY),
    excluded,
    exclude: (on) => put(OFF_KEY, on ? '1' : null),
  };
})();
