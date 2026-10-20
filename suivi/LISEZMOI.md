# Suivi des élèves

Ce dossier contient le petit serveur (un *Worker* Cloudflare, `worker.js`) qui reçoit les résultats des parties et les garde pour la page de suivi du professeur : **https://romaingaudet-maker.github.io/notes-envolees/suivi.html** (elle n'est liée nulle part dans le jeu et demande une clé).

## Ce qui est enregistré

- Pour chaque comptine ouverte : comptine, niveau, instrument choisi, jeu au xylophone de l'écran ou au micro.
- Quand elle est terminée : étoiles, erreurs (niveau 1) ou essais ratés (niveau 2), notes montrées par la page, « lentement » utilisé, durée.
- Quand elle est quittée avant la fin : où l'élève en était, erreurs et durée.
- « Toute la comptine en rythme » : réussie ou non, notes justes et notes en place.
- À l'ouverture du jeu : type d'écran (téléphone, tablette, ordinateur) et étoiles déjà gagnées sur l'appareil.
- Le Worker ajoute à chaque envoi l'heure et l'**adresse IP** de la connexion.

Pas de compte : chaque navigateur reçoit un identifiant tiré au hasard, gardé sur l'appareil avec les étoiles. Le son du micro n'est **jamais** envoyé. Les résultats de plus de 13 mois s'effacent tout seuls, et la page de suivi peut effacer un élève. Le pied de page du jeu le dit en une phrase : une adresse IP compte comme donnée personnelle, même sans nom.

## Installation (une fois, une dizaine de minutes, gratuit)

1. **Compte** : créer un compte gratuit sur [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).
2. **Base de données** : page **D1 SQL database** (menu *Storage & databases*) → **Create database**. Nom : `notes-envolees-suivi`. Sous **Data location**, choisir **Specify jurisdiction** → **European Union**, puis **Create**.
3. **Worker** : page **Workers & Pages** → **Create application** → **Start with Hello World!** → **Get started**. Nom : `notes-envolees-suivi`, puis **Deploy**.
4. **Code** : sur la page du Worker, icône **Edit code** (`</>`). Remplacer tout le contenu de `worker.js` par celui de [worker.js](worker.js) (sur GitHub : bouton *Copy raw file*). Puis **Deploy** en haut à droite (s'il n'y a qu'un bouton **Save** : Save, puis onglet **Deployments** → **Deploy version**).
5. **Relier la base** : page du Worker → onglet **Bindings** → **Add binding** → **D1 database** → **Add binding**. *Variable name* : `DB` ; base : `notes-envolees-suivi` → **Add binding**.
6. **Clé de la page de suivi** : page du Worker → **Settings** → **Variables and Secrets** → **Add**. Type **Secret**, *Variable name* `CLE_PROF`, *Value* : un mot de passe d'au moins 8 caractères (12 ou plus, c'est mieux) → **Deploy**.
7. **Vérifier** : ouvrir l'adresse du Worker (du genre `https://notes-envolees-suivi.ton-nom.workers.dev`, affichée sur sa page). Elle doit afficher :
   ```
   Base de données : reliée ✓
   Clé de la page de suivi : enregistrée ✓
   ```
8. **Brancher le jeu** : écrire cette adresse dans `src/suivi.js` (`const SUIVI_URL = 'https://…workers.dev';`, sans « / » à la fin), lancer `node build.mjs` et publier `index.html` et `suivi.html`. Tant que `SUIVI_URL` est vide, le jeu n'envoie rien et le pied de page ne parle pas du suivi.

## La page de suivi

- **En haut** : élèves actifs cette semaine, comptines terminées, temps de jeu, part des parties jouées au micro.
- **Élèves** : une fiche courte par élève (un navigateur), la plus récente en premier : instrument, au micro ou au xylophone de l'écran, dernière activité, chemin des 20 comptines à chaque niveau (une case par comptine, plus foncée avec plus d'étoiles), ce qui coince (comptine quittée plusieurs fois sans être terminée, micro qui n'a pas marché), adresse IP et code. **Détail** ouvre ses épreuves : étoiles, erreurs, durée, abandons, « toute la comptine en rythme ».
- **Par instrument** (niveau 1 ou 2) : élèves, part jouée au micro, comptines terminées, difficulté (facile, moyen, difficile : erreurs par note au niveau 1, essais ratés par phrase au niveau 2, avec les mêmes seuils que les étoiles), abandons ; puis la difficulté de chaque comptine selon l'instrument (toucher ou survoler une case pour les chiffres).
- **Tes appareils ne sont pas comptés** : ouvrir la page de suivi sur un appareil (téléphone, ordinateur) le reconnaît comme le tien. Le jeu n'y envoie plus rien, et ses parties passées sont masquées partout (sans être effacées). Pour un autre navigateur où tu as joué, ouvre sa fiche : **C'est moi : ne plus afficher**. **Réafficher**, en bas de la page, annule.

## Bon à savoir

- Un élève = un navigateur. S'il joue sur la tablette puis sur le téléphone, il apparaît deux fois, en général avec la même adresse IP chez lui. À l'inverse, plusieurs élèves d'une même famille, d'une même école ou d'un même réseau mobile peuvent partager une adresse : la page l'indique (« même réseau que… »).
- En IPv6 (la plupart des box en France), l'adresse d'un appareil change souvent ; la page en montre surtout le début, qui correspond au réseau du foyer et reste stable.
- Offre gratuite de Cloudflare : 100 000 écritures par jour dans D1, 5 Go de stockage ; une séance d'élève fait quelques dizaines d'écritures.
- Pour modifier le Worker plus tard : recoller `worker.js` dans l'éditeur, puis Deploy. Pour autoriser un autre site à envoyer des résultats : constante `ORIGINES` en haut de `worker.js`.
- Tests : `node --no-warnings tests/suivi.test.mjs`.
