// Tests du suivi des élèves : le Worker (suivi/worker.js), avec une base SQLite
// en mémoire à la place de D1, et l'envoi côté jeu (src/suivi.js).
// Lancer : node --no-warnings tests/suivi.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import nodeCrypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import worker from '../suivi/worker.js';

// Cloudflare fournit crypto.subtle.timingSafeEqual ; Node non
if (!crypto.subtle.timingSafeEqual) crypto.subtle.timingSafeEqual = (a, b) => nodeCrypto.timingSafeEqual(a, b);

// une base « D1 » minimale au-dessus de SQLite
function fakeD1() {
  const db = new DatabaseSync(':memory:');
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
    raw: async () => db.prepare(sql).all(...args).map((row) => Object.values(row)),
  });
  return { prepare: (sql) => stmt(sql), batch: async (list) => { const out = []; for (const s of list) out.push(await s.run()); return out; } };
}

const SITE = 'https://romaingaudet-maker.github.io';
const KEY = 'une-cle-de-test';
const env = { DB: fakeD1(), CLE_PROF: KEY };
const ctx = { waitUntil: () => {} };
const call = (path, opts = {}, e = env) => worker.fetch(new Request('https://suivi.example.workers.dev' + path, opts), e, ctx);
const post = (body, headers = {}) => call('/e', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { Origin: SITE, ...headers } });
const read = (q = '', key = KEY) => call('/donnees' + q, { headers: { Authorization: 'Bearer ' + key, Origin: SITE } });

let total = 0, fails = 0;
async function check(name, fn) {
  total++;
  let ok = false, why = '';
  try { ok = await fn(); } catch (e) { why = e.message; }
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `   [${why || 'échec'}]`}`);
}

console.log('— Worker —');
await check('accueil : base et clé reliées', async () => { const t = await (await call('/')).text(); return t.includes('Base de données : reliée ✓') && t.includes('Clé de la page de suivi : enregistrée ✓'); });
await check('accueil : dit ce qui manque', async () => { const t = await (await call('/', {}, {})).text(); return t.includes('non reliée') && t.includes('absente'); });
await check('un résultat du jeu est rangé (204)', async () => (await post({ e: 'abcdef234567', y: 'fin', inst: 'clarinette', mode: 'mic', c: 'frere-jacques', niveau: 1, etoiles: 2, erreurs: 7, sur: 32, duree: 245 }, { 'CF-Connecting-IP': '203.0.113.42' })).status === 204);
await check('refusé sans origine', async () => (await call('/e', { method: 'POST', body: '{"e":"abcdef234567","y":"visite"}' })).status === 403);
await check('refusé depuis un autre site', async () => (await post({ e: 'abcdef234567', y: 'visite' }, { Origin: 'https://ailleurs.example' })).status === 403);
await check('identifiant invalide refusé', async () => (await post({ e: 'AB', y: 'visite' })).status === 400);
await check('type inconnu refusé', async () => (await post({ e: 'abcdef234567', y: 'pirate' })).status === 400);
await check('JSON cassé refusé', async () => (await post('{oups')).status === 400);
await check('envoi trop gros refusé', async () => (await post({ e: 'abcdef234567', y: 'visite', x: 'a'.repeat(9000) })).status === 413);
await check('valeurs nettoyées (imbrication, longueur, clés)', async () => {
  await post({ e: 'zzzzzz234567', y: 'visite', etoiles: { 'frere-jacques': 3, 'frere-jacques@2': 1 }, profond: { a: { b: 1 } }, long: 'x'.repeat(200), '<b>': 1 }, { 'CF-Connecting-IP': '2a01:cb00:8a3:1200::7' });
  const j = await (await read()).json();
  const d = j.evenements.find((r) => r[2] === 'zzzzzz234567')[5];
  return d.etoiles['frere-jacques@2'] === 1 && JSON.stringify(d.profond) === '{}' && d.long.length === 60 && !('<b>' in d);
});
await check('marque d’un appareil du professeur rangée telle quelle', async () => {
  const ok = (await post({ e: 'prof12345678', y: 'visite', v: 1, prof: 1 })).status === 204;
  const j = await (await read()).json();
  const m = j.evenements.find((r) => r[2] === 'prof12345678');
  await call('/eleve?id=prof12345678', { method: 'DELETE', headers: { Authorization: 'Bearer ' + KEY } });
  return ok && m && m[4] === 'visite' && m[5].prof === 1;
});
await check('lecture sans clé : 401', async () => (await call('/donnees', { headers: { Origin: SITE } })).status === 401);
await check('lecture avec une mauvaise clé : 401', async () => (await read('', 'mauvaise-cle-123')).status === 401);
await check('lecture : événements, heure et IP du serveur', async () => {
  const r = await read();
  const j = await r.json();
  const [n, t, eleve, ip, type, d] = j.evenements[0];
  return r.status === 200 && r.headers.get('Access-Control-Allow-Origin') === SITE && n === 1 && Math.abs(t - Date.now()) < 5000
    && eleve === 'abcdef234567' && ip === '203.0.113.42' && type === 'fin' && d.erreurs === 7 && j.suite === false;
});
await check('lecture à partir d’un numéro (depuis)', async () => { const j = await (await read('?depuis=1')).json(); return j.evenements.length === 1 && j.evenements[0][2] === 'zzzzzz234567'; });
await check('préflight CORS pour la page de suivi', async () => { const r = await call('/donnees', { method: 'OPTIONS', headers: { Origin: SITE } }); return r.status === 204 && r.headers.get('Access-Control-Allow-Headers').includes('Authorization'); });
await check('effacer un élève exige la clé', async () => (await call('/eleve?id=zzzzzz234567', { method: 'DELETE' })).status === 401);
await check('effacer un élève n’efface que lui', async () => {
  const r = await (await call('/eleve?id=zzzzzz234567', { method: 'DELETE', headers: { Authorization: 'Bearer ' + KEY } })).json();
  const j = await (await read()).json();
  return r.effaces === 1 && j.evenements.length === 1 && j.evenements[0][2] === 'abcdef234567';
});
await check('prénom de l’élève (accents, apostrophe, trait d’union) rangé tel quel', async () => {
  const ok = (await post({ e: 'prenom234567', y: 'debut', inst: 'flute', mode: 'mic', c: 'frere-jacques', niveau: 1, prenom: 'Léa-Marie D’Arc' })).status === 204;
  const j = await (await read()).json();
  const r = j.evenements.find((x) => x[2] === 'prenom234567');
  await call('/eleve?id=prenom234567', { method: 'DELETE', headers: { Authorization: 'Bearer ' + KEY } });
  return ok && r && r[5].prenom === 'Léa-Marie D’Arc' && r[5].inst === 'flute';
});
console.log('— Défi : le tableau d’honneur —');
const defiPost = (e, d) => post(Object.assign({ e, y: 'defi', v: 1, inst: 'flute', mode: 'mic', jeu: 'defi' }, d));
const board = async () => (await (await call('/defi', { headers: { Origin: SITE } })).json()).classement;
await check('un score du Défi est rangé (204), et reste dans le suivi', async () => {
  const ok = (await defiPost('defiaa234567', { prenom: 'Léa Martin', nom: 'Léa M.', comptines: 3, essais: 7, publier: 1 })).status === 204;
  const j = await (await read()).json();
  return ok && j.evenements.some((r) => r[2] === 'defiaa234567' && r[4] === 'defi' && r[5].comptines === 3);
});
await check('tableau d’honneur sans clé : nom, instrument, score ; ni identifiant ni prénom entier', async () => {
  const r = await call('/defi', { headers: { Origin: SITE } });
  const list = (await r.json()).classement;
  return r.status === 200 && r.headers.get('Access-Control-Allow-Origin') === SITE && list.length === 1
    && JSON.stringify(list[0]) === JSON.stringify({ nom: 'Léa M.', inst: 'flute', comptines: 3, essais: 7 });
});
await check('seulement les élèves qui l’acceptent, et qui ont un nom', async () => {
  await defiPost('defibb234567', { nom: 'Tom', comptines: 9, essais: 12, publier: 0 });
  await defiPost('deficc234567', { nom: '', comptines: 9, essais: 9, publier: 1 });
  return (await board()).map((x) => x.nom).join() === 'Léa M.';
});
await check('classement : le plus de comptines, puis le moins d’essais', async () => {
  await defiPost('defidd234567', { nom: 'Inès', comptines: 3, essais: 5, publier: 1 });
  await defiPost('defiee234567', { nom: 'Paul', comptines: 4, essais: 30, publier: 1 });
  return (await board()).map((x) => x.nom).join() === 'Paul,Inès,Léa M.';
});
await check('le dernier score remplace le précédent ; décocher retire du tableau', async () => {
  await defiPost('defidd234567', { nom: 'Inès', comptines: 5, essais: 6, publier: 1 });
  const a = (await board()).map((x) => x.nom).join();
  await defiPost('defidd234567', { nom: 'Inès', comptines: 5, essais: 6, publier: 0 });
  return a === 'Inès,Paul,Léa M.' && (await board()).map((x) => x.nom).join() === 'Paul,Léa M.';
});
await check('nom nettoyé (balises, longueur), instrument inconnu ignoré', async () => {
  await defiPost('defiff234567', { nom: '<b>Zoé</b> "la" ' + 'x'.repeat(40), inst: 'Flute!', comptines: 1, essais: 1, publier: 1 });
  const z = (await board()).find((x) => x.nom.startsWith('bZoé'));
  return z && z.nom.length === 30 && !/[<>"]/.test(z.nom) && z.inst === '';
});
await check('tous les scores avec la clé (page de suivi) ; sans la bonne clé : 401', async () => {
  const r = await call('/defi', { headers: { Origin: SITE, Authorization: 'Bearer ' + KEY } });
  const j = await r.json();
  const bad = (await call('/defi', { headers: { Origin: SITE, Authorization: 'Bearer mauvaise-cle-123' } })).status;
  return r.status === 200 && j.eleves.length === 6 && j.eleves.some((x) => x.eleve === 'defibb234567' && x.publier === 0 && x.masque === 0) && bad === 401;
});
await check('le professeur retire un élève du tableau, puis l’y remet', async () => {
  const masque = (m) => call('/defi/masque', { method: 'POST', body: JSON.stringify({ id: 'defiee234567', masque: m }), headers: { Origin: SITE, Authorization: 'Bearer ' + KEY } });
  const sans = (await call('/defi/masque', { method: 'POST', body: JSON.stringify({ id: 'defiee234567', masque: 1 }), headers: { Origin: SITE } })).status;
  const r1 = await (await masque(1)).json();
  const a = (await board()).map((x) => x.nom).join();
  // un nouveau score ne remet pas l'élève au tableau : le retrait reste
  await defiPost('defiee234567', { nom: 'Paul', comptines: 6, essais: 31, publier: 1 });
  const b = (await board()).map((x) => x.nom).join();
  await masque(0);
  const c = (await board()).map((x) => x.nom).join();
  return sans === 401 && r1.change === 1 && !a.includes('Paul') && !b.includes('Paul') && c.startsWith('Paul');
});
await check('effacer un élève efface aussi son score du Défi', async () => {
  await call('/eleve?id=defiee234567', { method: 'DELETE', headers: { Authorization: 'Bearer ' + KEY } });
  return !(await board()).some((x) => x.nom === 'Paul');
});
for (const id of ['defiaa234567', 'defibb234567', 'deficc234567', 'defidd234567', 'defiff234567']) await call('/eleve?id=' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + KEY } });
await check('clé trop courte dans le Worker : 503', async () => (await call('/donnees', { headers: { Authorization: 'Bearer court' } }, { DB: env.DB, CLE_PROF: 'court' })).status === 503);
await check('base absente : 503', async () => (await call('/e', { method: 'POST', body: '{}', headers: { Origin: SITE } }, { CLE_PROF: KEY })).status === 503);

console.log('— Jeu : envoi des résultats —');
function loadClient(url, store = {}, ns) {
  const beacons = [];
  const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  const sandbox = {
    localStorage, crypto, performance, screen: { width: 390, height: 844 },
    document: { hidden: false, addEventListener: () => {} },
    navigator: { sendBeacon: (u, body) => { beacons.push([u, JSON.parse(body)]); return true; } },
    matchMedia: () => ({ matches: true }), window: {}, fetch: () => Promise.resolve(),
  };
  sandbox.window.matchMedia = sandbox.matchMedia;
  // comme la version de qualification : l'adresse du Worker et le préfixe du stockage viennent de la page
  sandbox.window.NE_SUIVI_URL = url;
  if (ns) sandbox.window.NE_NS = ns;
  const src = fs.readFileSync(new URL('../src/suivi.js', import.meta.url), 'utf8');
  vm.runInNewContext(src + '\nthis.Suivi = Suivi;', sandbox);
  return { Suivi: sandbox.Suivi, beacons, store };
}
await check('qualification : clés du stockage à part (préfixe NE_NS)', () => {
  const c = loadClient('https://suivi.example.workers.dev', {}, 'qualif-');
  c.Suivi.send('visite', {});
  return c.beacons.length === 1 && 'qualif-notes-envolees-id' in c.store && !('notes-envolees-id' in c.store);
});
await check('sans adresse de Worker, rien ne part', () => { const c = loadClient(''); c.Suivi.send('visite', {}); return !c.beacons.length && c.Suivi.id() === null; });
await check('avec l’adresse, un envoi part vers /e avec identifiant', () => {
  const c = loadClient('https://suivi.example.workers.dev');
  c.Suivi.send('fin', { c: 'frere-jacques', etoiles: 3 });
  const [u, b] = c.beacons[0] || [];
  return u === 'https://suivi.example.workers.dev/e' && /^[a-z0-9]{12}$/.test(b.e) && b.y === 'fin' && b.etoiles === 3 && c.Suivi.id() === b.e;
});
await check('le prénom part avec l’envoi quand le jeu le donne', () => {
  const c = loadClient('https://suivi.example.workers.dev');
  c.Suivi.send('debut', { c: 'frere-jacques', inst: 'flute', prenom: 'Léa' });
  const b = (c.beacons[0] || [])[1] || {};
  return b.prenom === 'Léa' && b.inst === 'flute' && b.y === 'debut';
});
await check('le même identifiant d’un envoi à l’autre', () => { const c = loadClient('https://s.example'); c.Suivi.send('debut', {}); c.Suivi.send('fin', {}); return c.beacons[0][1].e === c.beacons[1][1].e; });
await check('appareil du professeur exclu : rien ne part', () => { const c = loadClient('https://s.example', { 'notes-envolees-suivi-off': '1' }); c.Suivi.send('visite', {}); return !c.beacons.length; });
await check('type d’écran : téléphone', () => loadClient('https://s.example').Suivi.device() === 'telephone');

console.log(fails ? `\n${fails} test(s) sur ${total} en échec.` : `\nLes ${total} tests du suivi passent.`);
process.exit(fails ? 1 : 0);
