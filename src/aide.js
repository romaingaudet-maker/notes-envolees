/* ------------------------------------------------------------------
   Les Notes Envolées — page « Comment jouer » (comment-jouer.html), liée en bas de l'accueil des deux versions.
   (« Retour au jeu », en haut : src/page-retour.js)
   Le suivi des parties n'est décrit que là où il est en service (pas en qualification). Cette page n'envoie rien.
------------------------------------------------------------------- */
(() => {
  const li = document.getElementById('suivi');
  if (li && typeof Suivi !== 'undefined' && Suivi.configured) li.hidden = false;
})();
