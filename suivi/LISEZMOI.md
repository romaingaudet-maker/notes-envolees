# Suivi des élèves

Ce dossier contient le petit serveur (un *Worker* Cloudflare, `worker.js`) qui reçoit les résultats des parties et les garde pour la page de suivi du professeur : **https://romaingaudet-maker.github.io/notes-envolees/suivi.html** (elle n'est liée nulle part dans le jeu et demande une clé ; sur l'accueil, le code secret du professeur l'ouvre : voir `KONAMI` dans `src/app.js`).

## Ce qui est enregistré

- Pour chaque comptine ouverte : comptine, niveau, instrument choisi, jeu au xylophone de l'écran ou au micro.
- Avec chaque envoi : le **prénom** que l'élève a écrit sur l'accueil, s'il en a écrit un (c'est facultatif), et son **mode de jeu** (Aventure, Découverte, Défi).
- En Défi, à chaque étape réussie ou ratée : le record (comptines réussies d'affilée, dans l'ordre), le départ où il a été fait, l'étape en cours, le nombre de départs, et l'accord de l'élève pour le **tableau d'honneur** de l'accueil, avec le nom montré (le prénom ; d'un deuxième mot, seulement l'initiale).
- Quand elle est terminée : étoiles, erreurs (niveau 1) ou essais ratés (niveau 2), notes montrées par la page, « lentement » utilisé, durée.
- Quand elle est quittée avant la fin : où l'élève en était, erreurs et durée.
- « Toute la comptine en rythme » : réussie ou non, notes justes et notes en place.
- À l'ouverture du jeu : type d'écran (téléphone, tablette, ordinateur) et étoiles déjà gagnées sur l'appareil.
- Le Worker ajoute à chaque envoi l'heure et l'**adresse IP** de la connexion.

Pas de compte : chaque navigateur reçoit un identifiant tiré au hasard, gardé sur l'appareil avec les étoiles. Le son du micro n'est **jamais** envoyé. Les résultats de plus de 13 mois s'effacent tout seuls, et la page de suivi peut effacer un élève. Le pied de page du jeu le dit en une phrase : le prénom et l'adresse IP comptent comme données personnelles (les mentions légales détaillent tout).

## Mise à jour pour le Défi (une fois, deux minutes)

Le tableau d'honneur du Défi (les meilleurs records : comptines d'affilée, puis le moins de départs) a besoin du nouveau `worker.js` : sur la page du Worker, **Edit code**, remplacer tout le contenu par celui de [worker.js](worker.js), puis **Deploy**. La table des scores se crée toute seule. Tant que ce n'est pas fait, le jeu marche comme avant, mais les scores du Défi ne sont pas gardés et le tableau d'honneur ne s'affiche pas sur l'accueil.

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

- **En haut** : élèves actifs cette semaine (avec leurs prénoms), comptines terminées, temps de jeu, part des parties jouées au micro.
- **Élèves** : une fiche courte par élève (un navigateur), la plus récente en premier : prénom s'il l'a donné, instrument, au micro ou au xylophone de l'écran, dernière activité, chemin des 20 comptines à chaque niveau (une case par comptine, plus foncée avec plus d'étoiles), ce qui coince (comptine quittée plusieurs fois sans être terminée, micro qui n'a pas marché), adresse IP et code ; son mode de jeu et, en Défi, son record, son étape en cours et ses départs (« au tableau d'honneur »). **Détail** ouvre ses épreuves : étoiles, erreurs, durée, abandons, « toute la comptine en rythme » ; et les autres prénoms donnés sur cet appareil, s'il en a changé. En Défi : **Retirer du tableau d'honneur** (un nom déplacé, par exemple), puis **Remettre au tableau d'honneur** ; un nouveau score ne le remet pas tout seul.
- **Par instrument** (niveau 1 ou 2) : élèves (leurs prénoms sous le nom de l'instrument), part jouée au micro, comptines terminées, difficulté (facile, moyen, difficile : erreurs par note au niveau 1, essais ratés par phrase au niveau 2, avec les mêmes seuils que les étoiles), abandons ; puis la difficulté de chaque comptine selon l'instrument (toucher ou survoler une case pour les chiffres, et le résultat de chaque élève : étoiles, erreurs, abandons, le plus en difficulté d'abord).
- **Les prénoms** : un élève qui a écrit son prénom sur l'accueil est nommé partout, sur sa fiche comme dans les statistiques ; les autres sont comptés « sans prénom » (dans le résultat d'une comptine : « Élève #k3x9 », le code de sa fiche). Le même prénom sur deux appareils n'est écrit qu'une fois, avec le nombre d'appareils (« Léa (2 appareils) ») ; dans le résultat d'une comptine, le code de la fiche les distingue.
- **Tes appareils ne sont pas comptés** : ouvrir la page de suivi sur un appareil (téléphone, ordinateur) le reconnaît comme le tien. Le jeu n'y envoie plus rien, et ses parties passées sont masquées partout (sans être effacées). Pour un autre navigateur où tu as joué, ouvre sa fiche : **C'est moi : ne plus afficher**. **Réafficher**, en bas de la page, annule.

## Bon à savoir

- Un élève = un navigateur. S'il joue sur la tablette puis sur le téléphone, il apparaît deux fois, en général avec la même adresse IP chez lui (et le même prénom, s'il l'a écrit sur les deux). À l'inverse, plusieurs élèves d'une même famille, d'une même école ou d'un même réseau mobile peuvent partager une adresse : la page l'indique (« même réseau que… »).
- En IPv6 (la plupart des box en France), l'adresse d'un appareil change souvent ; la page en montre surtout le début, qui correspond au réseau du foyer et reste stable.
- Offre gratuite de Cloudflare : 100 000 écritures par jour dans D1, 5 Go de stockage ; une séance d'élève fait quelques dizaines d'écritures.
- Pour modifier le Worker plus tard : recoller `worker.js` dans l'éditeur, puis Deploy. Pour autoriser un autre site à envoyer des résultats : constante `ORIGINES` en haut de `worker.js`.
- Tests : `node --no-warnings tests/suivi.test.mjs`.
