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

- **En bref** : élèves, comptines terminées, temps de jeu, part des parties jouées au micro, abandons.
- **Par instrument** : élèves, part jouée au micro, comptines terminées, erreurs par note (niveau 1), essais ratés par phrase (niveau 2), abandons.
- **Difficulté des comptines selon l'instrument** : pour chaque comptine du chemin (de 1, la plus facile, à 20) et chaque instrument, les erreurs par note sur les parties terminées ; les comptines commencées mais jamais terminées et les abandons sont signalés.
- **Élèves** : un élève par navigateur, avec son adresse IP, son instrument (et s'il joue au micro ou au xylophone de l'écran), sa progression sur le chemin aux deux niveaux, puis le détail de chaque épreuve (étoiles, nombre de fois, erreurs, durée, abandons, « toute la comptine »), ses adresses IP et son activité récente.
- Filtres : période, instrument, parties au micro seulement.
- Sur chaque appareil où tu testes toi-même le jeu, ouvre la page de suivi et coche **Ne pas suivre mes propres parties sur cet appareil**.

## Bon à savoir

- Un élève = un navigateur. S'il joue sur la tablette puis sur le téléphone, il apparaît deux fois, en général avec la même adresse IP chez lui. À l'inverse, plusieurs élèves d'une même famille, d'une même école ou d'un même réseau mobile peuvent partager une adresse : la page l'indique (« même réseau que… »).
- En IPv6 (la plupart des box en France), l'adresse d'un appareil change souvent ; la page en montre surtout le début, qui correspond au réseau du foyer et reste stable.
- Offre gratuite de Cloudflare : 100 000 écritures par jour dans D1, 5 Go de stockage ; une séance d'élève fait quelques dizaines d'écritures.
- Pour modifier le Worker plus tard : recoller `worker.js` dans l'éditeur, puis Deploy. Pour autoriser un autre site à envoyer des résultats : constante `ORIGINES` en haut de `worker.js`.
- Tests : `node --no-warnings tests/suivi.test.mjs`.
