/* ------------------------------------------------------------------
   Les Notes Envolées — suivi des élèves (Worker Cloudflare + base D1)

   Ce fichier se colle tel quel dans l'éditeur du Worker, sur Cloudflare.
   À relier au Worker (voir suivi/LISEZMOI.md) :
   - la base D1, sous le nom de variable  DB
   - le secret  CLE_PROF  : le mot de passe de la page de suivi
     (au moins 8 caractères)

   Ce que fait le Worker :
   - POST /e         reçoit un résultat envoyé par le jeu (aucun compte) et
                     le range avec l'heure et l'adresse IP de la connexion ;
   - GET /donnees    rend les résultats à la page de suivi (clé exigée) ;
   - DELETE /eleve   efface tout le suivi d'un élève : ?id=… (clé exigée) ;
   - GET /defi       le tableau d'honneur du Défi, montré sur l'accueil du jeu
                     (sans clé : les 10 meilleurs scores des élèves qui l'ont
                     accepté ; avec la clé : tous les scores, pour la page de suivi) ;
   - POST /defi/masque  retire un élève du tableau d'honneur, ou l'y remet :
                     { id, masque: 1 | 0 } (clé exigée) ;
   - GET /           dit si la base et la clé sont bien reliées.
   La table se crée toute seule au premier appel. Les résultats de plus
   de 13 mois sont effacés au fil de l'eau.
------------------------------------------------------------------- */

// pages autorisées à envoyer des résultats et à lire le suivi
// (une variable ORIGINES, séparée par des virgules, peut la remplacer)
const ORIGINES = ['https://romaingaudet-maker.github.io'];
const CONSERVATION = 395 * 24 * 3600 * 1000; // 13 mois
const TYPES = ['visite', 'debut', 'fin', 'bilan', 'sortie', 'micro', 'defi'];
const PAGE = 5000; // résultats rendus par appel (la page de suivi enchaîne les appels)

let pret = null;
function preparer(db) {
  if (!pret) {
    pret = db.batch([
      db.prepare('CREATE TABLE IF NOT EXISTS evenements (n INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, eleve TEXT NOT NULL, ip TEXT NOT NULL, type TEXT NOT NULL, donnees TEXT NOT NULL)'),
      db.prepare('CREATE INDEX IF NOT EXISTS evenements_eleve ON evenements (eleve)'),
      db.prepare('CREATE INDEX IF NOT EXISTS evenements_t ON evenements (t)'),
      // le Défi : le dernier score de chaque élève (masque : retiré du tableau d'honneur par le professeur)
      db.prepare('CREATE TABLE IF NOT EXISTS defi (eleve TEXT PRIMARY KEY, t INTEGER NOT NULL, nom TEXT NOT NULL, inst TEXT NOT NULL, comptines INTEGER NOT NULL, essais INTEGER NOT NULL, publier INTEGER NOT NULL, masque INTEGER NOT NULL DEFAULT 0)'),
    ]).catch((e) => { pret = null; throw e; });
  }
  return pret;
}

// ne garde que des valeurs simples, sur un seul niveau d'imbrication
function nettoyer(v, prof = 0) {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null;
  if (typeof v === 'string') return v.slice(0, 60);
  if (prof >= 2 || typeof v !== 'object') return undefined;
  if (Array.isArray(v)) return v.slice(0, 60).map((x) => nettoyer(x, 2)).filter((x) => x !== undefined);
  const o = {};
  for (const k of Object.keys(v).slice(0, 60)) {
    if (!/^[\w@-]{1,60}$/.test(k)) continue;
    const x = nettoyer(v[k], prof + 1);
    if (x !== undefined) o[k] = x;
  }
  return o;
}

// un score du Défi : le nom montré (30 caractères au plus), l'instrument, les comptines réussies, les essais, l'accord
function scoreDefi(d) {
  const entier = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const nom = typeof d.nom === 'string' ? d.nom.replace(/[\u0000-\u001f<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30) : '';
  const inst = typeof d.inst === 'string' && /^[a-z]{1,20}$/.test(d.inst) ? d.inst : '';
  return [nom, inst, entier(d.comptines, 100), entier(d.essais, 100000), d.publier && nom ? 1 : 0];
}

async function autorise(req, env) {
  const cle = env.CLE_PROF || '';
  const h = req.headers.get('Authorization') || '';
  const donnee = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (cle.length < 8 || !donnee) return false;
  const a = new TextEncoder().encode(donnee), b = new TextEncoder().encode(cle);
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

const reponse = (corps, status, entetes, type = 'application/json; charset=utf-8') =>
  new Response(corps, { status, headers: { 'Content-Type': type, 'Cache-Control': 'no-store', ...entetes } });
const json = (data, status, entetes) => reponse(JSON.stringify(data), status, entetes);

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origines = (env.ORIGINES ? String(env.ORIGINES).split(',') : ORIGINES).map((s) => s.trim()).filter(Boolean);
    const origine = req.headers.get('Origin') || '';
    const cors = origines.includes(origine) ? { 'Access-Control-Allow-Origin': origine, Vary: 'Origin' } : { Vary: 'Origin' };

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, DELETE', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' } });
    }

    // page d'accueil du Worker : vérification de l'installation
    if (req.method === 'GET' && url.pathname === '/') {
      let base = 'non reliée : ajoute la liaison D1 sous le nom DB';
      if (env.DB) {
        try { await preparer(env.DB); base = 'reliée ✓'; } catch (e) { base = 'erreur : ' + e.message; }
      }
      const cle = (env.CLE_PROF || '').length >= 8 ? 'enregistrée ✓' : 'absente : ajoute le secret CLE_PROF (8 caractères au moins)';
      return reponse(`Les Notes Envolées — suivi des élèves\n\nBase de données : ${base}\nClé de la page de suivi : ${cle}\n`, 200, {}, 'text/plain; charset=utf-8');
    }

    if (!env.DB) return json({ erreur: 'base', message: 'La base D1 n’est pas reliée au Worker (nom de variable : DB).' }, 503, cors);

    try {
      // un résultat envoyé par le jeu
      if (req.method === 'POST' && url.pathname === '/e') {
        if (!origines.includes(origine)) return new Response(null, { status: 403 });
        const texte = await req.text();
        if (texte.length > 8000) return new Response(null, { status: 413, headers: cors });
        let d;
        try { d = JSON.parse(texte); } catch (e) { return new Response(null, { status: 400, headers: cors }); }
        if (!d || typeof d !== 'object' || Array.isArray(d)) return new Response(null, { status: 400, headers: cors });
        const eleve = typeof d.e === 'string' && /^[a-z0-9]{6,32}$/.test(d.e) ? d.e : null;
        const type = TYPES.includes(d.y) ? d.y : null;
        if (!eleve || !type) return new Response(null, { status: 400, headers: cors });
        delete d.e;
        delete d.y;
        const ip = (req.headers.get('CF-Connecting-IP') || '').slice(0, 64);
        await preparer(env.DB);
        const maintenant = Date.now();
        await env.DB.prepare('INSERT INTO evenements (t, eleve, ip, type, donnees) VALUES (?, ?, ?, ?, ?)')
          .bind(maintenant, eleve, ip, type, JSON.stringify(nettoyer(d))).run();
        // le Défi : le dernier score de l'élève, pour le tableau d'honneur (le retrait par le professeur reste)
        if (type === 'defi') {
          await env.DB.prepare('INSERT INTO defi (eleve, t, nom, inst, comptines, essais, publier) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(eleve) DO UPDATE SET t = excluded.t, nom = excluded.nom, inst = excluded.inst, comptines = excluded.comptines, essais = excluded.essais, publier = excluded.publier')
            .bind(eleve, maintenant, ...scoreDefi(d)).run();
        }
        if (Math.random() < 0.02) {
          ctx.waitUntil(env.DB.batch([
            env.DB.prepare('DELETE FROM evenements WHERE t < ?').bind(maintenant - CONSERVATION),
            env.DB.prepare('DELETE FROM defi WHERE t < ?').bind(maintenant - CONSERVATION),
          ]).catch(() => {}));
        }
        return new Response(null, { status: 204, headers: cors });
      }

      // la page de suivi lit les résultats (par paquets, à partir du numéro « depuis »)
      if (req.method === 'GET' && url.pathname === '/donnees') {
        if ((env.CLE_PROF || '').length < 8) return json({ erreur: 'cle-absente', message: 'Le secret CLE_PROF n’est pas enregistré dans le Worker.' }, 503, cors);
        if (!(await autorise(req, env))) return json({ erreur: 'cle', message: 'Clé incorrecte.' }, 401, cors);
        await preparer(env.DB);
        const depuis = Math.max(0, parseInt(url.searchParams.get('depuis') || '0', 10) || 0);
        const lignes = await env.DB.prepare('SELECT n, t, eleve, ip, type, donnees FROM evenements WHERE n > ? ORDER BY n LIMIT ?').bind(depuis, PAGE).raw();
        const corps = '{"maintenant":' + Date.now() + ',"suite":' + (lignes.length === PAGE) + ',"evenements":['
          + lignes.map((r) => '[' + r[0] + ',' + r[1] + ',' + JSON.stringify(r[2]) + ',' + JSON.stringify(r[3]) + ',' + JSON.stringify(r[4]) + ',' + r[5] + ']').join(',')
          + ']}';
        return reponse(corps, 200, cors);
      }

      // effacer tout le suivi d'un élève (et son score du Défi)
      if (req.method === 'DELETE' && url.pathname === '/eleve') {
        if (!(await autorise(req, env))) return json({ erreur: 'cle', message: 'Clé incorrecte.' }, 401, cors);
        const id = url.searchParams.get('id') || '';
        if (!/^[a-z0-9]{6,32}$/.test(id)) return json({ erreur: 'id' }, 400, cors);
        await preparer(env.DB);
        const [r] = await env.DB.batch([
          env.DB.prepare('DELETE FROM evenements WHERE eleve = ?').bind(id),
          env.DB.prepare('DELETE FROM defi WHERE eleve = ?').bind(id),
        ]);
        return json({ effaces: (r && r.meta && r.meta.changes) || 0 }, 200, cors);
      }

      // le tableau d'honneur du Défi : sans clé, pour l'accueil du jeu ; avec la clé, tous les scores (page de suivi)
      if (req.method === 'GET' && url.pathname === '/defi') {
        await preparer(env.DB);
        if (req.headers.get('Authorization')) {
          if (!(await autorise(req, env))) return json({ erreur: 'cle', message: 'Clé incorrecte.' }, 401, cors);
          const tous = await env.DB.prepare('SELECT eleve, t, nom, inst, comptines, essais, publier, masque FROM defi ORDER BY comptines DESC, essais ASC, t ASC').raw();
          return json({ maintenant: Date.now(), eleves: tous.map(([eleve, t, nom, inst, comptines, essais, publier, masque]) => ({ eleve, t, nom, inst, comptines, essais, publier, masque })) }, 200, cors);
        }
        const meilleurs = await env.DB.prepare("SELECT nom, inst, comptines, essais FROM defi WHERE publier = 1 AND masque = 0 AND nom <> '' AND comptines > 0 ORDER BY comptines DESC, essais ASC, t ASC LIMIT 10").raw();
        return json({ classement: meilleurs.map(([nom, inst, comptines, essais]) => ({ nom, inst, comptines, essais })) }, 200, { ...cors, 'Cache-Control': 'public, max-age=60' });
      }

      // le professeur retire un élève du tableau d'honneur (ou l'y remet)
      if (req.method === 'POST' && url.pathname === '/defi/masque') {
        if (!(await autorise(req, env))) return json({ erreur: 'cle', message: 'Clé incorrecte.' }, 401, cors);
        let d;
        try { d = JSON.parse(await req.text()); } catch (e) { return json({ erreur: 'json' }, 400, cors); }
        const id = d && typeof d.id === 'string' && /^[a-z0-9]{6,32}$/.test(d.id) ? d.id : null;
        if (!id) return json({ erreur: 'id' }, 400, cors);
        await preparer(env.DB);
        const r = await env.DB.prepare('UPDATE defi SET masque = ? WHERE eleve = ?').bind(d.masque ? 1 : 0, id).run();
        return json({ change: (r.meta && r.meta.changes) || 0 }, 200, cors);
      }

      return json({ erreur: 'introuvable' }, 404, cors);
    } catch (e) {
      return json({ erreur: 'serveur', message: String((e && e.message) || e) }, 500, cors);
    }
  },
};
