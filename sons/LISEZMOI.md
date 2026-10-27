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
| `guitar.js` | Guitare classique (cordes en nylon), cinq cordes à vide (mi, la, ré, sol, si) | MS Basic, la banque de sons de MuseScore, d'après Fluid R3 de Frank Wen | MIT (voir plus bas) |
| `eguitar.js` | Guitare électrique (la verte, son clair) | Black and Green Guitars, Karoryfer Samples | CC0 1.0 |

Les enregistrements ont été transformés pour la page (découpés, mis en boucle, égalisés, compressés). Sources :

- VSCO 2 CE : https://github.com/sgossner/VSCO-2-CE
- VCSL : https://github.com/sgossner/VCSL
- Weresax : https://github.com/sfzinstruments/karoryfer.weresax
- Sonatina Symphonic Orchestra : https://github.com/peastman/sso
- Black and Green Guitars : https://github.com/sfzinstruments/karoryfer.black-and-green-guitars
- MS Basic (MuseScore) : https://github.com/musescore/MuseScore, fichier `share/sound/MS Basic.sf3` (échantillons en Ogg Vorbis, lus par `outils/fabriquer-sons.py`)
- Licence CC Sampling Plus 1.0 : https://creativecommons.org/licenses/sampling+/1.0/
- Licence CC0 1.0 : https://creativecommons.org/publicdomain/zero/1.0/

## Licence de la guitare classique (`guitar.js`)

Les notes de la guitare classique viennent de MS Basic, la banque de sons de MuseScore, elle-même tirée de Fluid R3 :

- Fluid (R3) SoundFont : Copyright (c) 2000-2002, 2008 Frank Wen
- FluidR3Mono : Copyright (c) 2014-2017 Michael Cowgill
- MuseScore_General / MS Basic : Copyright (c) 2018-2020 S. Christian Collins

Elles sont publiées sous la licence MIT :

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
