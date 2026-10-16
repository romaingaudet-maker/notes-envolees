# Sons des instruments

Quand l'élève choisit son instrument, la page joue les phrases avec de vraies notes enregistrées de cet instrument. Chaque fichier `.js` de ce dossier contient quelques notes (une tous les 2 à 5 demi-tons), mises bout à bout dans un MP3 mono. La page joue chaque note à partir de l'enregistrement le plus proche, un peu accéléré ou ralenti.

Les sons sont préparés par `outils/fabriquer-sons.py` :

- découpe à l'attaque ;
- hauteur mesurée au centième de demi-ton ;
- boucle fondue pour les sons tenus ;
- volume égalisé ;
- compression en MP3 à 80 kbit/s.

Le fichier est chargé seulement quand on choisit l'instrument. S'il manque (page ouverte seule, sans ce dossier), la page reprend les timbres synthétisés.

| Fichier | Instrument enregistré | Source | Licence |
|---|---|---|---|
| `piano.js` | Piano à queue Steinway B (micro proche) | Versilian Community Sample Library (VCSL), Versilian Studios | CC0 1.0 |
| `xylo.js` | Xylophone (baguettes moyennes) | VS Chamber Orchestra 2: Community Edition (VSCO 2 CE), Versilian Studios : Sam Gossner, Simon Dalzell, Elan Hickler | CC0 1.0 |
| `flute.js` | Flûte, avec vibrato | VSCO 2 CE | CC0 1.0 |
| `clarinet.js` | Clarinette en si♭ | VSCO 2 CE | CC0 1.0 |
| `trumpet.js` | Trompette | VSCO 2 CE | CC0 1.0 |
| `violin.js` | Violon solo, avec vibrato | VSCO 2 CE | CC0 1.0 |
| `sax.js` | Saxophone alto | Weresax, Karoryfer Samples | CC0 1.0 |
| `horn.js` | Cor | Sonatina Symphonic Orchestra (SSO), de Mattias Westlund, développement poursuivi par Peter Eastman | CC Sampling Plus 1.0 |
| `trombone.js` | Trombone ténor | Sonatina Symphonic Orchestra | CC Sampling Plus 1.0 |
| `viola.js` | Alto solo | Sonatina Symphonic Orchestra | CC Sampling Plus 1.0 |
| `cello.js` | Violoncelle solo | Sonatina Symphonic Orchestra | CC Sampling Plus 1.0 |

Les enregistrements ont été transformés pour la page (découpés, mis en boucle, égalisés, compressés). Sources :

- VSCO 2 CE : https://github.com/sgossner/VSCO-2-CE
- VCSL : https://github.com/sgossner/VCSL
- Weresax : https://github.com/sfzinstruments/karoryfer.weresax
- Sonatina Symphonic Orchestra : https://github.com/peastman/sso
- Licence CC Sampling Plus 1.0 : https://creativecommons.org/licenses/sampling+/1.0/
- Licence CC0 1.0 : https://creativecommons.org/publicdomain/zero/1.0/
