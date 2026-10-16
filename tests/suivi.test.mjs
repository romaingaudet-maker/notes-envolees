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
await check('clé trop courte dans le Worker : 503', async () => (await call('/donnees', { headers: { Authorization: 'Bearer court' } }, { DB: env.DB, CLE_PROF: 'court' })).status === 503);
await check('base absente : 503', async () => (await call('/e', { method: 'POST', body: '{}', headers: { Origin: SITE } }, { CLE_PROF: KEY })).status === 503);

console.log('— Jeu : envoi des résultats —');
function loadClient(url, store = {}) {
  const beacons = [];
  const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  const sandbox = {
    localStorage, crypto, performance, screen: { width: 390, height: 844 },
    document: { hidden: false, addEventListener: () => {} },
    navigator: { sendBeacon: (u, body) => { beacons.push([u, JSON.parse(body)]); return true; } },
    matchMedia: () => ({ matches: true }), window: {}, fetch: () => Promise.resolve(),
  };
  sandbox.window.matchMedia = sandbox.matchMedia;
  let src = fs.readFileSync(new URL('../src/suivi.js', import.meta.url), 'utf8');
  src = src.replace("const SUIVI_URL = '';", `const SUIVI_URL = '${url}';`);
  vm.runInNewContext(src + '\nthis.Suivi = Suivi;', sandbox);
  return { Suivi: sandbox.Suivi, beacons, store };
}
await check('sans adresse de Worker, rien ne part', () => { const c = loadClient(''); c.Suivi.send('visite', {}); return !c.beacons.length && c.Suivi.id() === null; });
await check('avec l’adresse, un envoi part vers /e avec identifiant', () => {
  const c = loadClient('https://suivi.example.workers.dev');
  c.Suivi.send('fin', { c: 'frere-jacques', etoiles: 3 });
  const [u, b] = c.beacons[0] || [];
  return u === 'https://suivi.example.workers.dev/e' && /^[a-z0-9]{12}$/.test(b.e) && b.y === 'fin' && b.etoiles === 3 && c.Suivi.id() === b.e;
});
await check('le même identifiant d’un envoi à l’autre', () => { const c = loadClient('https://s.example'); c.Suivi.send('debut', {}); c.Suivi.send('fin', {}); return c.beacons[0][1].e === c.beacons[1][1].e; });
await check('appareil du professeur exclu : rien ne part', () => { const c = loadClient('https://s.example', { 'notes-envolees-suivi-off': '1' }); c.Suivi.send('visite', {}); return !c.beacons.length; });
await check('type d’écran : téléphone', () => loadClient('https://s.example').Suivi.device() === 'telephone');

console.log(fails ? `\n${fails} test(s) sur ${total} en échec.` : `\nLes ${total} tests du suivi passent.`);
process.exit(fails ? 1 : 0);
