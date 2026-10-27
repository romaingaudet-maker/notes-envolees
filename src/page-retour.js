/* ------------------------------------------------------------------
   Les Notes Envolées — « Retour au jeu », en haut des pages de texte (comment-jouer.html, mentions-legales.html) :
   ramène à la version d'où l'on vient (papier ou laine). Venu du jeu, on y revient par l'historique, à l'endroit
   où l'on était ; venu de l'autre page de texte (« Comment jouer », puis « Mentions légales »), on retourne à la
   version gardée pour cet onglet. Sinon, le lien par défaut : la première version.
------------------------------------------------------------------- */
(() => {
  const back = document.getElementById('back');
  if (!back) return;
  const KEY = (window.NE_NS || '') + 'notes-envolees-retour';
  const TEXT = /\/(?:comment-jouer|mentions-legales|suivi)\.html$/;
  let ref = null;
  try { ref = document.referrer ? new URL(document.referrer) : null; } catch (e) { ref = null; }
  const fromGame = !!ref && ref.origin === location.origin && ref.pathname !== location.pathname && !TEXT.test(ref.pathname);
  let game = '';
  if (fromGame) {
    game = ref.origin + ref.pathname + ref.search;
    try { sessionStorage.setItem(KEY, game); } catch (e) { /* stockage indisponible */ }
  } else {
    try { game = sessionStorage.getItem(KEY) || ''; } catch (e) { game = ''; }
  }
  if (!game) return;
  back.href = game;
  if (fromGame) back.addEventListener('click', (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } });
})();
