/* ------------------------------------------------------------------
   Les Notes Envolées — les comptines (toutes transposées en do majeur)

   Paroles : « | » sépare deux syllabes d'un même mot, l'espace sépare
   les mots, « _ » est une espace insécable (syllabes chantées sur une
   seule note : « y_é », « n'y_est », ponctuation française « Ah_! »).
   Notes : hauteur/durée — w ronde, h blanche, q noire, e croche,
   s double croche, « . » pointée ; « r » = silence.

   Sources des mélodies :
   - Weckerlin, Chansons et rondes enfantines (1870), Wikisource :
     Sur le pont d'Avignon, Il était une bergère.
   - Partitions Wikisource (CC BY-SA) et Piano GNU de J.-M. Thiémonge
     (CC BY), reprises par gvellut/metallophone : Frère Jacques, Au clair
     de la lune, Promenons-nous dans les bois, Il court le furet, Le bon
     roi Dagobert, À la claire fontaine, À la pêche aux moules, Dansons
     la capucine.
   - Comptines.TV (partitions LilyPond de J. Chauveau) : Une poule sur
     un mur, Petit escargot, J'ai ramassé des champignons.
   - Tablatures de KalimbaTabs.net : Dans la forêt lointaine, Pomme de
     reinette, Savez-vous planter les choux (recoupée avec le dépôt
     veillette/chansons, qui donne aussi Dodo, l'enfant do et Ainsi font).
   - Une souris verte : fiche pédagogique de l'académie de Versailles,
     recoupée avec une tablature de guitare et veillette/chansons.
------------------------------------------------------------------- */
const SONGS = [
  {
    id: 'une-poule-sur-un-mur',
    title: 'Une poule sur un mur',
    theme: 'poule', voice: 'kalimba', instrument: 'au kalimba',
    level: 1, meter: [2, 4], bpm: 96, pickup: 0,
    phrases: [
      ['U|ne pou|le sur un mur', 'G4/e G4/e E4/e C4/e G4/e G4/e E4/q'],
      ['qui pi|co|re du pain dur.', 'G4/e G4/e E4/e C4/e G4/e G4/e E4/q'],
      ['Pi|co|ti, pi|co|ta,', 'C4/e C4/e C4/q C4/e C4/e D4/q'],
      ['lève la queue et puis s’en va.', 'C4/e C4/e D4/e C4/e D4/e G4/e C4/q'],
    ],
  },
  {
    id: 'petit-escargot',
    title: 'Petit escargot',
    theme: 'escargot', voice: 'ukulele', instrument: 'au ukulélé',
    level: 2, meter: [2, 4], bpm: 112, pickup: 1,
    phrases: [
      ['Pe|tit es|car|got', 'C4/e D4/e E4/q C4/q C4/q'],
      ['por|te sur son dos', 'C4/e D4/e E4/q C4/q C4/h'],
      ['sa mai|son|net|te.', 'D4/h G4/q G4/q E4/h C4/q'],
      ['Aus|si|tôt qu’il pleut,', 'C4/e D4/e E4/q C4/q C4/q'],
      ['il est tout heu|reux,', 'C4/e D4/e E4/q C4/q C4/h'],
      ['il sort sa tête.', 'D4/h G4/q G4/q C4/h'],
    ],
  },
  {
    id: 'dodo-l-enfant-do',
    title: 'Dodo, l’enfant do',
    theme: 'dodo', voice: 'celesta', instrument: 'au célesta',
    level: 3, meter: [2, 4], bpm: 66, pickup: 0,
    phrases: [
      ['Do|do, l’en|fant do,', 'E4/q C4/q E4/e E4/e C4/q'],
      ['l’en|fant dor|mi|ra bien vi|te.', 'D4/e E4/e F4/e E4/e D4/e G4/e E4/e C4/e'],
      ['Do|do, l’en|fant do,', 'E4/q C4/q E4/e E4/e C4/q'],
      ['l’en|fant dor|mi|ra bien|tôt.', 'D4/e E4/e F4/e E4/e D4/e G4/e C4/q'],
    ],
  },
  {
    id: 'ah-vous-dirai-je-maman',
    title: 'Ah_! vous dirai-je, maman',
    theme: 'bonbons', voice: 'metallo', instrument: 'au métallophone',
    level: 4, meter: [4, 4], bpm: 104, pickup: 0,
    phrases: [
      ['Ah_! vous di|rai-|je, ma|man,', 'C4/q C4/q G4/q G4/q A4/q A4/q G4/h'],
      ['ce qui cau|se mon tour|ment_?', 'F4/q F4/q E4/q E4/q D4/q D4/q C4/h'],
      ['Pa|pa veut que je rai|sonne', 'G4/q G4/q F4/q F4/q E4/q E4/q D4/h'],
      ['comme u|ne gran|de per|sonne.', 'G4/q G4/q F4/q F4/q E4/q E4/q D4/h'],
      ['Moi je dis que les bon|bons', 'C4/q C4/q G4/q G4/q A4/q A4/q G4/h'],
      ['va|lent mieux que la rai|son.', 'F4/q F4/q E4/q E4/q D4/q D4/q C4/h'],
    ],
  },
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    theme: 'aube', voice: 'bell', instrument: 'aux cloches',
    level: 5, meter: [4, 4], bpm: 108, pickup: 0,
    phrases: [
      ['Frè|re Jac|ques, frè|re Jac|ques,', 'C4/q D4/q E4/q C4/q C4/q D4/q E4/q C4/q'],
      ['dor|mez-|vous_? Dor|mez-|vous_?', 'E4/q F4/q G4/h E4/q F4/q G4/h'],
      ['Son|nez les ma|ti|nes, son|nez les ma|ti|nes,', 'G4/e A4/e G4/e F4/e E4/q C4/q G4/e A4/e G4/e F4/e E4/q C4/q'],
      ['ding, daing, dong_! Ding, daing, dong_!', 'C4/q G3/q C4/h C4/q G3/q C4/h'],
    ],
  },
  {
    id: 'au-clair-de-la-lune',
    title: 'Au clair de la lune',
    theme: 'lune', voice: 'musicbox', instrument: 'à la boîte à musique',
    level: 6, meter: [4, 4], bpm: 100, pickup: 0,
    phrases: [
      ['Au clair de la lu|ne, mon a|mi Pier|rot,', 'C4/q C4/q C4/q D4/q E4/h D4/h C4/q E4/q D4/q D4/q C4/w'],
      ['prê|te-|moi ta plu|me pour é|cri|re_un mot.', 'C4/q C4/q C4/q D4/q E4/h D4/h C4/q E4/q D4/q D4/q C4/w'],
      ['Ma chan|del|le_est mor|te, je n’ai plus de feu,', 'D4/q D4/q D4/q D4/q A3/h A3/h D4/q C4/q B3/q A3/q G3/w'],
      ['ou|vre-|moi ta por|te pour l’a|mour de Dieu.', 'C4/q C4/q C4/q D4/q E4/h D4/h C4/q E4/q D4/q D4/q C4/w'],
    ],
  },
  {
    id: 'dansons-la-capucine',
    title: 'Dansons la capucine',
    theme: 'capucine', voice: 'piano', instrument: 'au piano',
    level: 7, meter: [2, 4], bpm: 108, pickup: 0,
    phrases: [
      ['Dan|sons la ca|pu|ci|ne,', 'C4/q D4/e D4/e G4/e G4/e E4/e E4/e'],
      ['y_a pas de pain chez nous_;', 'C4/q D4/e D4/e G4/e G4/e E4/q'],
      ['y_en a chez la voi|si|ne,', 'C4/q D4/e D4/e G4/e G4/e E4/e E4/e'],
      ['mais ce n’est pas pour nous.', 'C4/q D4/e D4/e G4/e G4/e C4/q'],
    ],
  },
  {
    id: 'pomme-de-reinette',
    title: 'Pomme de reinette',
    theme: 'pommes', voice: 'guitar', instrument: 'à la guitare',
    level: 8, meter: [2, 4], bpm: 88, pickup: 0,
    phrases: [
      ['Pomme de rei|nette et pomme d’a|pi,', 'C4/e C4/e C4/e C4/e E4/e G4/e E4/e C4/e'],
      ['ta|pis, ta|pis rou|ge_;', 'G3/e G4/e G3/e G4/e E4/q C4/q'],
      ['pomme de rei|nette et pomme d’a|pi,', 'C4/e C4/e C4/e C4/e E4/e G4/e E4/e C4/e'],
      ['ta|pis, ta|pis gris.', 'G3/e G4/e G3/e G4/e C4/h'],
    ],
  },
  {
    id: 'ainsi-font-font-font',
    title: 'Ainsi font, font, font',
    theme: 'marionnettes', voice: 'clarinet', instrument: 'à la clarinette',
    level: 9, meter: [2, 4], bpm: 104, pickup: 1,
    phrases: [
      ['Ain|si font, font, font', 'E4/e E4/e C4/q E4/q G4/q'],
      ['les pe|ti|tes ma|rion|net|tes,', 'F4/e E4/e F4/e D4/e C4/e B3/e C4/e G3/e'],
      ['ain|si font, font, font', 'E4/e E4/e C4/q E4/q G4/q'],
      ['trois p’tits tours et puis s’en vont.', 'F4/e E4/e F4/e D4/e C4/e B3/e C4/q'],
    ],
  },
  {
    id: 'promenons-nous-dans-les-bois',
    title: 'Promenons-nous dans les bois',
    theme: 'foret', voice: 'marimba', instrument: 'au marimba',
    level: 10, meter: [2, 4], bpm: 108, pickup: 0,
    phrases: [
      ['Prome|nons-|nous dans les bois', 'C4/e C4/e C4/q D4/e D4/e G3/q'],
      ['pen|dant que le loup n’y_est pas.', 'C4/e C4/e C4/e C4/e D4/e D4/e G3/q'],
      ['Si le loup y_é|tait, il nous man|ge|rait,', 'C4/e C4/e C4/q D4/q E4/q D4/e C4/e D4/q G4/q C4/q'],
      ['mais comme il n’y_est pas, il nous mange|ra pas.', 'C4/e C4/e C4/q D4/q E4/q D4/e C4/e D4/q G4/q C4/q'],
    ],
  },
  {
    id: 'une-souris-verte',
    title: 'Une souris verte',
    theme: 'prairie', voice: 'pizz', instrument: 'au violon pincé',
    level: 11, meter: [2, 4], bpm: 112, pickup: 0,
    phrases: [
      ['U|ne sou|ris ver|te', 'C4/e C4/e C4/e D4/e C4/q G3/q'],
      ['qui cou|rait dans l’her|be,', 'C4/e C4/e C4/e D4/e C4/q G3/q'],
      ['je l’at|tra|pe par la queue,', 'F4/e E4/e D4/e E4/e F4/e E4/e D4/q'],
      ['je la mon|tre_à ces mes|sieurs.', 'F4/e E4/e D4/e E4/e F4/e E4/e D4/q'],
      ['Ces mes|sieurs me di|sent_:', 'C4/e C4/e C4/e D4/e C4/q G3/q'],
      ['«_Trem|pez-|la dans l’hui|le,', 'C4/e C4/e C4/e D4/e C4/q G3/q'],
      ['trem|pez-|la dans l’eau,', 'C4/e C4/e C4/e C4/e D4/h'],
      ['ça fe|ra un es|car|got tout chaud_!_»', 'C4/e C4/e D4/e C4/e C4/e C4/e D4/q G4/q C4/q'],
    ],
  },
  {
    id: 'dans-la-foret-lointaine',
    title: 'Dans la forêt lointaine',
    theme: 'coucou', voice: 'ocarina', instrument: 'à l’ocarina',
    level: 12, meter: [2, 4], bpm: 100, pickup: 1,
    phrases: [
      ['Dans la fo|rêt loin|tai|ne,', 'G3/e C4/e C4/e C4/e E4/e C4/e C4/q'],
      ['on en|tend le cou|cou.', 'E4/e D4/e C4/e D4/e E4/q C4/q'],
      ['Du haut de son grand chê|ne,', 'G3/e C4/e C4/e C4/e E4/e C4/e C4/q'],
      ['il ré|pond au hi|bou.', 'E4/e D4/e C4/e D4/e E4/q C4/q'],
      ['Cou|cou hi|bou, cou|cou hi|bou,', 'G4/e E4/e E4/e E4/e G4/e E4/e E4/e E4/e'],
      ['cou|cou hi|bou, cou|cou.', 'G4/e F4/e E4/e F4/e G4/q E4/q'],
      ['Cou|cou hi|bou, cou|cou hi|bou,', 'G4/e E4/e E4/e E4/e G4/e E4/e E4/e E4/e'],
      ['cou|cou hi|bou, cou|cou.', 'G4/e F4/e E4/e F4/e D4/q C4/q'],
    ],
  },
  {
    id: 'savez-vous-planter-les-choux',
    title: 'Savez-vous planter les choux_?',
    theme: 'choux', voice: 'banjo', instrument: 'au banjo',
    level: 13, meter: [2, 4], bpm: 104, pickup: 1,
    phrases: [
      ['Sa|vez-|vous plan|ter les choux', 'G3/e G3/e E4/e E4/e D4/e E4/e C4/q'],
      ['à la mo|de, à la mo|de,', 'B3/e C4/e D4/e D4/e C4/e D4/e E4/e C4/e'],
      ['sa|vez-|vous plan|ter les choux', 'G3/e G3/e E4/e E4/e D4/e E4/e C4/q'],
      ['à la mo|de de chez nous_?', 'B3/e C4/e D4/e F4/e E4/e D4/e C4/q'],
    ],
  },
  {
    id: 'sur-le-pont-d-avignon',
    title: 'Sur le pont d’Avignon',
    theme: 'provence', voice: 'galoubet', instrument: 'au galoubet, la petite flûte de Provence',
    level: 14, meter: [2, 4], bpm: 100, pickup: 0,
    phrases: [
      ['Sur le pont d’A|vi|gnon,', 'C4/e C4/e C4/q D4/e D4/e D4/q'],
      ['on y dan|se, on y dan|se,', 'E4/e. F4/s G4/e C4/e B3/e. C4/s D4/e G3/e'],
      ['sur le pont d’A|vi|gnon,', 'C4/e C4/e C4/q D4/e D4/e D4/q'],
      ['on y dan|se tous en rond.', 'E4/e. F4/s G4/e C4/e D4/e B3/e C4/e r/e'],
    ],
  },
  {
    id: 'j-ai-ramasse-des-champignons',
    title: 'J’ai ramassé des champignons',
    theme: 'champignons', voice: 'xylo', instrument: 'au xylophone',
    level: 15, meter: [4, 4], bpm: 96, pickup: 1,
    phrases: [
      ['J’ai ra|mas|sé des cham|pi|gnons,', 'G3/e A3/s B3/s C4/e C4/e C4/e C4/e C4/q'],
      ['des blancs, des bleus et des o|ran|ges.', 'C4/e B3/s C4/s D4/e D4/e C4/e D4/e E4/e C4/e'],
      ['J’ai ra|mas|sé des cham|pi|gnons', 'G3/e A3/s B3/s C4/e C4/e C4/e C4/e C4/q'],
      ['qui pous|saient sur le frais ga|zon.', 'C4/e B3/s C4/s D4/e D4/e C4/e B3/e C4/q'],
      ['Des p’tits, des gros, des grands, des min|ces,', 'E4/e G4/s F4/s E4/e C4/e D4/e D4/e E4/e C4/e'],
      ['des tout-|pe|tits et des gé|ants.', 'E4/e G4/s F4/s E4/e C4/e D4/e D4/e C4/q'],
    ],
  },
  {
    id: 'il-etait-une-bergere',
    title: 'Il était une bergère',
    theme: 'bergere', voice: 'pipeau', instrument: 'au pipeau',
    level: 16, meter: [6, 8], bpm: 120, pickup: 0.5,
    phrases: [
      ['Il é|tait u|ne ber|gère,', 'G3/e C4/q D4/e E4/q D4/e C4/q. C4/q'],
      ['et ron, ron, ron, pe|tit pa|ta|pon_;', 'G3/e A3/q A3/e G3/e G3/e G3/e A3/q A3/e G3/q'],
      ['il é|tait u|ne ber|gère', 'G3/e C4/q D4/e E4/q D4/e C4/q. C4/q'],
      ['qui gar|dait ses mou|tons, ron, ron,', 'G4/e E4/q C4/e D4/q G3/e C4/q C4/e C4/q'],
      ['qui gar|dait ses mou|tons.', 'G4/e E4/q C4/e D4/q G3/e C4/h r/e'],
    ],
  },
  {
    id: 'le-bon-roi-dagobert',
    title: 'Le bon roi Dagobert',
    theme: 'chateau', voice: 'harpsi', instrument: 'au clavecin, l’instrument des rois',
    level: 17, meter: [6, 8], bpm: 100, pickup: 0.5,
    phrases: [
      ['Le bon roi Da|go|bert a mis sa cu|lotte à l’en|vers.', 'E4/e E4/q D4/e D4/q C4/e C4/q. D4/q. E4/e F4/e E4/e D4/e C4/e D4/e C4/q. r/e'],
      ['Le grand saint É|loi lui dit_: «_Ô mon roi,', 'C4/e D4/e E4/q E4/e E4/e F4/e G4/e D4/q D4/e D4/e'],
      ['vo|tre Ma|jes|té est mal cu|lot|tée_!_»', 'C4/e D4/e E4/q E4/e E4/e F4/e G4/e D4/q D4/e D4/q'],
      ['«_C’est vrai, lui dit le roi, je vais la re|mettre à l’en|droit._»', 'E4/e E4/q D4/e D4/q C4/e C4/q. D4/q. E4/e F4/e E4/e D4/e C4/e D4/e C4/q.'],
    ],
  },
  {
    id: 'a-la-peche-aux-moules',
    title: 'À la pêche aux moules',
    theme: 'moules', voice: 'steel', instrument: 'au steel-drum',
    level: 18, meter: [2, 4], bpm: 88, pickup: 0,
    phrases: [
      ['À la pêche aux mou|les, mou|les, mou|les,', 'C4/e E4/e C4/e E4/e G4/s G4/s G4/s G4/s G4/e G4/e'],
      ['je n’veux plus y_al|ler, ma|man_!', 'A4/e A4/e A4/e C5/e G4/e G4/e G4/q'],
      ['Les gens de la vil|le, vil|le, vil|le', 'F4/e F4/e F4/e G4/e E4/s E4/s E4/s E4/s E4/e E4/e'],
      ['m’ont pris mon pa|nier, ma|man_!', 'D4/e D4/e D4/e E4/e C4/e E4/e G4/q'],
      ['Les gens de la vil|le, vil|le, vil|le', 'F4/e F4/e F4/e G4/e E4/s E4/s E4/s E4/s E4/e E4/e'],
      ['m’ont pris mon pa|nier, ma|man_!', 'D4/e D4/e D4/e E4/e C4/e C4/e C4/q'],
    ],
  },
  {
    id: 'a-la-claire-fontaine',
    title: 'À la claire fontaine',
    theme: 'fontaine', voice: 'harp', instrument: 'à la harpe',
    level: 19, meter: [4, 4], bpm: 84, pickup: 0,
    phrases: [
      ['À la clai|re fon|tai|ne,', 'C4/q C4/e E4/e E4/e D4/e E4/e D4/e'],
      ['m’en al|lant pro|me|ner,', 'C4/q C4/e E4/e E4/e D4/e E4/q'],
      ['j’ai trou|vé l’eau si bel|le', 'E4/q E4/e D4/e C4/e E4/e G4/e E4/e'],
      ['que je m’y suis bai|gné.', 'G4/q G4/e E4/e C4/e E4/e D4/q'],
      ['Il y_a long|temps que je t’ai|me,', 'C4/q C4/e E4/e E4/e D4/s C4/s E4/e C4/e'],
      ['ja|mais je ne t’ou|blie|rai.', 'E4/q E4/e D4/s C4/s E4/e D4/e C4/q'],
    ],
  },
  {
    id: 'il-court-le-furet',
    title: 'Il court, il court, le furet',
    theme: 'automne', voice: 'accordion', instrument: 'à l’accordéon',
    level: 20, meter: [4, 4], bpm: 112, pickup: 1.5,
    phrases: [
      ['Il court, il court, le fu|ret,', 'G3/e C4/e D4/e E4/q D4/e D4/e A3/q'],
      ['le fu|ret du bois, mes|dames,', 'C4/e B3/e A3/e G3/e A3/e B3/e C4/e'],
      ['il court, il court, le fu|ret,', 'G3/e C4/e D4/e E4/q D4/e D4/e A3/q'],
      ['le fu|ret du bois jo|li.', 'C4/e B3/e A3/e G3/e A3/e B3/e C4/e r/e'],
      ['Il est pas|sé par i|ci,', 'C4/e B3/e A3/e G3/e A3/e B3/e C4/q'],
      ['il re|pas|se|ra par là,', 'C4/e B3/e A3/e G3/e A3/e B3/e C4/q'],
      ['le fu|ret du bois, mes|dames,', 'C4/e B3/e A3/e G3/e A3/e B3/e C4/q'],
      ['le fu|ret du bois jo|li.', 'C4/e B3/e A3/e G3/e A3/e B3/e C4/q r/q'],
    ],
  },
];

/* ---------- analyse : partitions → événements datés ---------- */
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const NOTE_FR = { C: 'Do', D: 'Ré', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const PC_FR = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si'];
const PC_LETTER = ['C', null, 'D', null, 'E', 'F', null, 'G', null, 'A', null, 'B'];
const DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };

function parsePitch(p) {
  const m = /^([A-G])(\d)$/.exec(p);
  if (!m) throw new Error('Hauteur illisible : ' + p);
  const L = m[1], o = +m[2];
  return { name: p, letter: L, fr: NOTE_FR[L], midi: 12 * (o + 1) + NOTE_PC[L], step: o * 7 + NOTE_STEP[L], octave: o };
}

function parseDur(d) {
  const dotted = d.endsWith('.');
  const base = DUR[dotted ? d.slice(0, -1) : d];
  if (base == null) throw new Error('Durée illisible : ' + d);
  return dotted ? base * 1.5 : base;
}

function splitSyllables(text) {
  const words = text.split(' ');
  const out = [];
  words.forEach((w, wi) => {
    const parts = w.split('|');
    parts.forEach((p, pi) => {
      let s = p.replace(/_/g, ' ');
      if (pi === parts.length - 1 && wi < words.length - 1) s += ' ';
      out.push(s);
    });
  });
  return out;
}

function buildSong(src) {
  const song = Object.assign({}, src);
  const beatsPerBar = src.meter[0] * (4 / src.meter[1]);
  song.barBeats = beatsPerBar;
  song.events = [];
  song.notes = [];
  song.phrases = [];
  let t = 0;
  src.phrases.forEach(([text, seq], pi) => {
    const syl = splitSyllables(text);
    const ph = { index: pi, text, syllables: syl, events: [], notes: [], start: t };
    let si = 0;
    seq.trim().split(/\s+/).forEach((tok) => {
      const [p, d] = tok.split('/');
      const dur = parseDur(d);
      const ev = { t, dur, phrase: pi };
      if (p === 'r') {
        ev.rest = true;
      } else {
        Object.assign(ev, parsePitch(p));
        ev.n = song.notes.length;
        ev.syl = syl[si];
        ev.sylIndex = si;
        si++;
        song.notes.push(ev);
        ph.notes.push(ev.n);
      }
      // accent : premier temps de mesure (et 2e pulsation en 6/8)
      const pos = ((t - src.pickup) % beatsPerBar + beatsPerBar) % beatsPerBar;
      ev.accent = pos < 1e-6 ? 1 : (src.meter[1] === 8 && Math.abs(pos - 1.5) < 1e-6 ? 0.6 : 0);
      song.events.push(ev);
      ph.events.push(ev);
      t += dur;
    });
    ph.end = t;
    ph.sylCount = syl.length;
    ph.noteCount = si;
    song.phrases.push(ph);
  });
  song.total = t;
  // la première note de chaque phrase est donnée (mais il faut la jouer)
  song.given = new Set(song.phrases.map((ph) => ph.notes[0]));
  song.minStep = Math.min(...song.notes.map((n) => n.step));
  song.maxStep = Math.max(...song.notes.map((n) => n.step));
  song.minMidi = Math.min(...song.notes.map((n) => n.midi));
  song.maxMidi = Math.max(...song.notes.map((n) => n.midi));
  return song;
}
