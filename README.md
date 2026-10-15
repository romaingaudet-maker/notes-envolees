# Les Notes Envolées

Un jeu d'oreille pour les enfants : vingt comptines traditionnelles, toutes en do majeur, dont les notes se sont envolées. La première note de chaque phrase est donnée, mais il faut la jouer ; les suivantes se retrouvent à l'oreille, sur le xylophone de l'écran ou sur son propre instrument, que la page écoute au micro.

**Jouer : https://romaingaudet-maker.github.io/notes-envolees/**

## Ce que fait la page

- Une page par comptine, avec un décor animé qui suit la progression et tient sur un seul écran (ordinateur, tablette, téléphone).
- On peut écouter toute la comptine, une seule phrase, ou « jusqu'à la note » à trouver, éventuellement au ralenti.
- **Niveau 1, les notes** : chaque note se retrouve à l'oreille, à son rythme ; une flèche dit s'il faut aller plus aigu ou plus grave. Une phrase trouvée, on passe tout seul à la suivante.
- **Niveau 2, notes et rythme** : le bouton rond ▶ fait entendre la phrase précédée de son décompte, calé sur la mesure (« 1 2 3 4 », ou « 1 2 1 », « 1 2 3 »… pour une phrase en levée). Avec « À toi ! », l'enfant joue toute la phrase d'un coup après le décompte ; la page vérifie ensuite chaque note et la place de chaque attaque dans le temps (en place, un peu tôt ou tard, nettement en avance ou en retard, tempo qui accélère ou ralentit). Le décalage d'ensemble (latence du haut-parleur ou du micro) est retiré avant de juger, et le juge pardonne davantage sur les phrases longues. Une phrase réussie, on passe aussitôt à la suivante.
- **Toute la comptine d'un coup** : quand toutes les phrases sont trouvées (niveau 1) ou réussies (niveau 2), la page propose de jouer toute la comptine en rythme, après le décompte, et donne un bilan phrase par phrase.
- **Ton instrument** : piano, flûte, clarinette en si♭, saxophone alto, trompette en si♭, trombone, cor en fa, violon, alto, violoncelle ou xylophone. Les noms de notes affichés sont ceux de la partition de l'enfant ; la page joue les notes à leur hauteur réelle (un ton plus bas pour les instruments en si♭, une sixte majeure plus bas pour le saxophone alto, une quinte juste plus bas pour le cor, une octave plus bas pour le trombone et le violoncelle), avec un son proche de l'instrument choisi pour aider à reconnaître les notes. Sans instrument choisi, chaque comptine garde son propre timbre. Au micro, la note est reconnue quelle que soit l'octave.
- Le micro se coupe quand la comptine est finie et se rallume tout seul quand l'enfant rejoue ou passe à la comptine suivante. Après une écoute, il accepte une note jouée un peu avant la fin de la dernière note de la page ; sur les notes que la page fait encore résonner, seule une vraie attaque de l'instrument compte.
- Le son du micro est analysé dans le navigateur ; rien n'est enregistré ni envoyé. Le micro demande une page en https (comme ici) ou un fichier ouvert dans Chrome, Edge ou Firefox ; il ne fonctionne pas dans l'aperçu de claude.ai (la page propose alors la version en ligne).
- Chaque visite d'une comptine repart de zéro ; seul le meilleur nombre d'étoiles (par niveau) reste sur l'appareil.

## Modifier

Tout le code est dans `src/` ; `index.html` est fabriqué à partir de ces fichiers.

- `src/songs.js` : les mélodies (paroles découpées en syllabes, puis notes `HAUTEUR/durée`, par exemple `E4/q` pour une noire mi).
- `node build.mjs` : reconstruit `index.html`.
- `node validate.mjs` : vérifie que chaque phrase a autant de syllabes que de notes et que les mesures tombent juste.
- `node tests/ear.test.mjs` : teste la reconnaissance des notes sur des sons de synthèse (flûte, clarinette, trompette, violon, glockenspiel…), y compris juste après une note jouée par la page.
- `node tests/rythme.test.mjs` : teste le juge du rythme du niveau 2 (latence, note en retard, fausse note, accélération, rythme pointé, phrases longues, comptine entière…).

## Sources des mélodies

- J.-B. Weckerlin, *Chansons et rondes enfantines* (1870), sur Wikisource : Sur le pont d'Avignon, Il était une bergère.
- [gvellut/metallophone](https://github.com/gvellut/metallophone) (partitions Wikisource et Piano GNU de J.-M. Thiémonge) : Frère Jacques, Au clair de la lune, Promenons-nous dans les bois, Il court le furet, Le bon roi Dagobert, À la claire fontaine, À la pêche aux moules, Dansons la capucine.
- [Comptines.TV](https://github.com/Comptines/partitions) (partitions LilyPond de J. Chauveau) : Une poule sur un mur, Petit escargot, J'ai ramassé des champignons.
- [KalimbaTabs](https://www.kalimbatabs.net/kalimba-tabs-tutorials/) : Dans la forêt lointaine, Pomme de reinette, Savez-vous planter les choux, recoupées avec [veillette/chansons](https://github.com/veillette/chansons), qui donne aussi Dodo, l'enfant do et Ainsi font, font, font.
- Une souris verte : [fiche d'éducation musicale de l'académie de Versailles](https://ac-versailles.fr/media/25987/download), recoupée avec une tablature de guitare et veillette/chansons.

Comptines traditionnelles du domaine public.
