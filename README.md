# Les Notes Envolées

Un jeu d'oreille pour les enfants : vingt comptines traditionnelles, toutes en do majeur, dont les notes se sont envolées. La première note de chaque phrase est donnée, mais il faut la jouer ; les suivantes se retrouvent à l'oreille, sur le xylophone de l'écran ou sur son propre instrument, que la page écoute au micro.

**Jouer : https://romaingaudet-maker.github.io/notes-envolees/**

## Ce que fait la page

- Une page par comptine, avec un décor animé qui suit la progression et tient sur un seul écran (ordinateur, tablette, téléphone).
- On peut écouter toute la comptine, une seule phrase, ou « jusqu'à la note » à trouver, éventuellement au ralenti.
- Avec le micro, l'enfant choisit son instrument : en do, en si♭ (clarinette, trompette, cornet, saxophones soprano et ténor), en mi♭ (saxophones alto et baryton) ou en fa (cor). Les noms de notes affichés sont ceux de sa partition, la page joue dans le ton réel de l'instrument, et la note est reconnue quelle que soit l'octave.
- Le son du micro est analysé dans le navigateur ; rien n'est enregistré ni envoyé. Le micro demande une page en https (comme ici) ou un fichier ouvert dans Chrome, Edge ou Firefox ; il ne fonctionne pas dans l'aperçu de claude.ai.
- Chaque visite d'une comptine repart de zéro ; seul le meilleur nombre d'étoiles reste sur l'appareil.

## Modifier

Tout le code est dans `src/` ; `index.html` est fabriqué à partir de ces fichiers.

- `src/songs.js` : les mélodies (paroles découpées en syllabes, puis notes `HAUTEUR/durée`, par exemple `E4/q` pour une noire mi).
- `node build.mjs` : reconstruit `index.html`.
- `node validate.mjs` : vérifie que chaque phrase a autant de syllabes que de notes et que les mesures tombent juste.
- `node tests/ear.test.mjs` : teste la reconnaissance des notes sur des sons de synthèse (flûte, clarinette, trompette, violon, glockenspiel…).

## Sources des mélodies

- J.-B. Weckerlin, *Chansons et rondes enfantines* (1870), sur Wikisource : Sur le pont d'Avignon, Il était une bergère.
- [gvellut/metallophone](https://github.com/gvellut/metallophone) (partitions Wikisource et Piano GNU de J.-M. Thiémonge) : Frère Jacques, Au clair de la lune, Promenons-nous dans les bois, Il court le furet, Le bon roi Dagobert, À la claire fontaine, À la pêche aux moules, Dansons la capucine.
- [Comptines.TV](https://github.com/Comptines/partitions) (partitions LilyPond de J. Chauveau) : Une poule sur un mur, Petit escargot, J'ai ramassé des champignons.
- [KalimbaTabs](https://www.kalimbatabs.net/kalimba-tabs-tutorials/) : Dans la forêt lointaine, Pomme de reinette, Savez-vous planter les choux, recoupées avec [veillette/chansons](https://github.com/veillette/chansons), qui donne aussi Dodo, l'enfant do et Ainsi font, font, font.
- Une souris verte : [fiche d'éducation musicale de l'académie de Versailles](https://ac-versailles.fr/media/25987/download), recoupée avec une tablature de guitare et veillette/chansons.

Comptines traditionnelles du domaine public.
