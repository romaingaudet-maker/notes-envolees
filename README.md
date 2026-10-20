# Les Notes Envolées

Un jeu d'oreille pour les enfants : vingt comptines traditionnelles, toutes en do majeur, dont les notes se sont envolées. La première note de chaque phrase est donnée, mais il faut la jouer ; les suivantes se retrouvent à l'oreille, sur le xylophone de l'écran ou sur son propre instrument, que la page écoute au micro.

**Jouer : https://romaingaudet-maker.github.io/notes-envolees/**

**Seconde version, en laine : https://romaingaudet-maker.github.io/notes-envolees/laine/** : le même jeu, mais chaque décor est une petite animation 3D en volume, image par image (12 images par seconde, comme un film d'animation tourné en stop-motion) : personnages au crochet, décors tricotés et pièces de feutrine cousues, éclairage de studio, profondeur de champ de maquette et particules (peluches dans la lumière, feuilles, pluie, confettis de feutrine). L'accueil est un petit théâtre : le titre en guirlande de lettres de feutrine, puis un fil rouge qui relie les vingt comptines, chacune dans un tambour à broder qui montre son décor.

## Ce que fait la page

- Une page par comptine, avec un décor animé qui suit la progression et tient sur un seul écran (ordinateur, tablette, téléphone).
- On peut tout écouter, une seule phrase, ou « jusqu'à la note » à trouver, éventuellement au ralenti.
- **Niveau 1, les notes** : chaque note se retrouve à l'oreille, à son rythme ; une flèche dit s'il faut aller plus aigu ou plus grave. Une phrase trouvée, on passe tout seul à la suivante.
- **Niveau 2, notes et rythme** : le bouton rond ▶ fait entendre la phrase précédée de son décompte, calé sur la mesure (« 1 2 3 4 », ou « 1 2 1 », « 1 2 3 »… pour une phrase en levée). Avec « À toi ! », l'enfant joue toute la phrase d'un coup après le décompte ; la page vérifie ensuite chaque note et la place de chaque attaque dans le temps (en place, un peu tôt ou tard, nettement en avance ou en retard, tempo qui accélère ou ralentit). Le décalage d'ensemble (latence du haut-parleur ou du micro) est retiré avant de juger, et le juge pardonne davantage sur les phrases longues. Une phrase réussie, la suivante démarre toute seule, décompte compris : pas besoin de toucher « À toi ! » à nouveau.
- **Phrase par phrase ou toute la comptine** : un choix sur la carte de chaque comptine (gardé pour les suivantes). « Phrase par phrase », c'est l'entraînement avec l'aide décrite ci-dessus. « Toute la comptine » se joue d'un coup : au niveau 1, toutes les notes dans l'ordre, sans aide (une fausse note est comptée et on passe à la suivante) ; au niveau 2, après le décompte, toute la comptine en rythme. À la fin, un bilan par phrase ; les phrases à revoir (cerclées de rouge) s'enchaînent ensuite, avec l'aide habituelle. La carte de fin propose de rejouer toute la comptine ou de recommencer phrase par phrase.
- **Ton instrument** : piano, flûte, clarinette en si♭, saxophone alto, trompette en si♭, trombone, cor en fa, violon, alto, violoncelle ou xylophone. Les noms de notes affichés sont ceux de la partition de l'enfant. La page joue les phrases avec de vraies notes enregistrées de l'instrument choisi (voir [sons/LISEZMOI.md](sons/LISEZMOI.md)), à leur hauteur réelle : un ton plus bas pour les instruments en si♭, une sixte majeure plus bas pour le saxophone alto, une quinte juste plus bas pour le cor, une octave plus bas pour le trombone et le violoncelle. La flûte et le xylophone jouent une octave plus haut, dans leur registre (le xylophone sonne d'ailleurs une octave au-dessus de ce qui est écrit). Sans instrument choisi, chaque comptine garde son propre timbre. Au micro, la note est reconnue quelle que soit l'octave.
- Le micro se coupe quand la comptine est finie et se rallume tout seul quand l'enfant rejoue ou passe à la comptine suivante. Après une écoute, il accepte une note jouée un peu avant la fin de la dernière note de la page ; sur les notes que la page fait encore résonner, seule une vraie attaque de l'instrument compte.
- Le son du micro est analysé dans le navigateur ; il n'est jamais enregistré ni envoyé. Le micro demande une page en https (comme ici) ou un fichier ouvert dans Chrome, Edge ou Firefox ; il ne fonctionne pas dans l'aperçu de claude.ai (la page propose alors la version en ligne).
- Chaque visite d'une comptine repart de zéro ; le meilleur nombre d'étoiles (par niveau) reste sur l'appareil.
- **Suivi des élèves** (pour le professeur) : une fois le Worker Cloudflare installé, le déroulé des parties (comptine, niveau, instrument, xylophone ou micro, étoiles, erreurs, durée) est envoyé sans nom, avec l'adresse IP de la connexion, et consulté sur la page [suivi.html](https://romaingaudet-maker.github.io/notes-envolees/suivi.html), protégée par une clé. Installation et détails : [suivi/LISEZMOI.md](suivi/LISEZMOI.md).
- **Mentions légales et confidentialité** : [mentions-legales.html](https://romaingaudet-maker.github.io/notes-envolees/mentions-legales.html), liée en bas de l'accueil des deux versions (éditeur, hébergeur, micro, suivi, droits des familles, crédits). Les familles peuvent y couper le suivi sur leur appareil et y lire le code que montre la page de suivi.

## Modifier

Tout le code est dans `src/` ; `index.html` est fabriqué à partir de ces fichiers.

- `src/songs.js` : les mélodies (paroles découpées en syllabes, puis notes `HAUTEUR/durée`, par exemple `E4/q` pour une noire mi).
- `node build.mjs` : reconstruit `index.html` (première version), `suivi.html` (la page de suivi des élèves), `mentions-legales.html` (à partir de `src/mentions.html` et `src/mentions.js`) et `laine/index.html` (version en laine).
- `icone-180.png`, `icone-192.png`, `icone-512.png` et les `manifest.webmanifest` : l'icône et le nom affichés quand on installe le jeu sur l'écran d'accueil d'un téléphone (la version en laine a son propre manifeste, dans `laine/`).
- `src/suivi.js` : l'envoi des résultats (adresse du Worker dans `SUIVI_URL`) ; `src/suivi-page.js` et `src/_suivi.css` : la page de suivi ; `suivi/worker.js` : le Worker Cloudflare qui range les résultats. Les deux versions du jeu envoient les mêmes résultats.
- `laine/` : la version en laine. `laine/src/` contient le moteur (textures de tricot, de crochet et de feutrine fabriquées à l'ouverture, duvet de la laine, marionnettes, éléments de décor, particules, développement de l'image) et l'accueil ; `laine/scenes/` un fichier par décor de comptine ; `laine/vendor/three.min.js` la bibliothèque 3D three.js (r170, licence MIT). Sans WebGL 2, la page reprend les décors en papier découpé.
- `node outils/glyphes-titre.mjs DOSSIER/node_modules` : refait les contours des lettres du titre en feutrine (il faut `opentype.js` et `@fontsource/gluten`).
- `sons/` : les sons enregistrés des instruments, chargés à la demande. `index.html` ouvert seul, sans ce dossier, marche aussi : les phrases sont alors jouées avec des timbres synthétisés.
- `python3 outils/fabriquer-sons.py DOSSIER` : refait les sons à partir des bibliothèques d'origine (clonées dans `DOSSIER`, voir l'en-tête du script ; il faut numpy et ffmpeg).
- `node validate.mjs` : vérifie que chaque phrase a autant de syllabes que de notes et que les mesures tombent juste.
- `node tests/ear.test.mjs` : teste la reconnaissance des notes sur des sons de synthèse (flûte, clarinette, trompette, violon, glockenspiel…), y compris juste après une note jouée par la page.
- `node tests/sons.test.mjs` : vérifie les sons enregistrés (fichiers lisibles, boucles cohérentes, chaque note jouée à moins de 4 demi-tons d'un enregistrement).
- `node tests/rythme.test.mjs` : teste le juge du rythme du niveau 2 (latence, note en retard, fausse note, accélération, rythme pointé, phrases longues, comptine entière…).
- `node --no-warnings tests/suivi.test.mjs` : teste le Worker du suivi (sites autorisés, clé, nettoyage des données, effacement d'un élève) et l'envoi côté jeu.

## Production et qualification

Deux versions du site sont publiées sur GitHub Pages, par les GitHub Actions du dépôt (`.github/workflows/`) :

| | Branche | Adresse |
|---|---|---|
| **Production** (les élèves) | `main` | https://romaingaudet-maker.github.io/notes-envolees/ |
| **Qualification** (les essais) | `qualif` | https://romaingaudet-maker.github.io/notes-envolees/qualif/ |

- Les essais se font sur la branche `qualif`. À chaque envoi, `Verification` lance les tests ; s'ils passent, `Publication` met la qualification à jour (en une à deux minutes). La production n'est pas touchée.
- La qualification est construite par `node build.mjs --qualif` (dans `_qualif/`, non suivi par git) : un bandeau rouge « Qualification » avec la version testée, **aucun envoi au suivi des élèves**, des réglages et des étoiles gardés à part de la production, pas d'indexation par les moteurs de recherche. La page de suivi de la qualification lit, elle, les vrais résultats (le Worker de production), pour juger une nouvelle présentation sur de vraies données.
- Pour passer en production ce qui est validé : fusionner `qualif` dans `main` (`git checkout main && git merge qualif && git push`).
- Réglage à faire une fois sur GitHub : *Settings → Pages → Build and deployment → Source : GitHub Actions*.

## Sources des mélodies

- J.-B. Weckerlin, *Chansons et rondes enfantines* (1870), sur Wikisource : Sur le pont d'Avignon, Il était une bergère.
- [gvellut/metallophone](https://github.com/gvellut/metallophone) (partitions Wikisource et Piano GNU de J.-M. Thiémonge) : Frère Jacques, Au clair de la lune, Promenons-nous dans les bois, Il court le furet, Le bon roi Dagobert, À la claire fontaine, À la pêche aux moules, Dansons la capucine.
- [Comptines.TV](https://github.com/Comptines/partitions) (partitions LilyPond de J. Chauveau) : Une poule sur un mur, Petit escargot, J'ai ramassé des champignons.
- [KalimbaTabs](https://www.kalimbatabs.net/kalimba-tabs-tutorials/) : Dans la forêt lointaine, Pomme de reinette, Savez-vous planter les choux, recoupées avec [veillette/chansons](https://github.com/veillette/chansons), qui donne aussi Dodo, l'enfant do et Ainsi font, font, font.
- Une souris verte : [fiche d'éducation musicale de l'académie de Versailles](https://ac-versailles.fr/media/25987/download), recoupée avec une tablature de guitare et veillette/chansons.

Comptines traditionnelles du domaine public. Sons d'instruments : VSCO 2 Community Edition, VCSL et Weresax (CC0), Sonatina Symphonic Orchestra (CC Sampling Plus 1.0) ; détails dans [sons/LISEZMOI.md](sons/LISEZMOI.md). Version en laine : three.js (licence MIT), lettres du titre d'après la police Gluten (SIL Open Font License).
