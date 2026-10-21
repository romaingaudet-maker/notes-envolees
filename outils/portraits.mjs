// Portraits des décors de la version en laine (les tambours de l'accueil) : une bande de 4 images 320×320
// par comptine, rendue par le moteur de la page, rangée dans laine/portraits/{thème}.webp.
// Les fabriquer à l'avance évite au téléphone de rendre vingt décors en 3D à l'ouverture de l'accueil.
// À relancer quand un décor change :  node build.mjs && node outils/portraits.mjs
// Il faut Playwright et Chromium (npm i playwright ; npx playwright install chromium) ; le rendu passe par
// SwiftShader (rendu sur le processeur), comme sur une machine sans carte graphique.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(process.env.PLAYWRIGHT_DIR || import.meta.url);
const { chromium } = require('playwright');
const root = new URL('../', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(p, (err, b) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(b); });
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => {
  window.NE_PORTRAITS_TOOL = true;
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); // la meilleure qualité de rendu
  try { localStorage.setItem('notes-envolees-suivi-off', '1'); } catch (e) { /* */ }
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('erreur de la page :', String(e)));
await page.goto(`http://127.0.0.1:${server.address().port}/laine/`, { waitUntil: 'load' });
await page.waitForFunction(() => window.HomeSkin && window.Laine && Laine.Engine.supported(), null, { timeout: 60000 });
const strips = await page.evaluate(() => HomeSkin.strips());
const dir = path.join(root, 'laine/portraits');
fs.mkdirSync(dir, { recursive: true });
let total = 0;
for (const [theme, url] of Object.entries(strips)) {
  const b = Buffer.from(url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(dir, `${theme}.webp`), b);
  total += b.length;
  console.log(`laine/portraits/${theme}.webp`, (b.length / 1024).toFixed(0) + ' Ko');
}
console.log(Object.keys(strips).length, 'portraits,', (total / 1024).toFixed(0), 'Ko en tout');
await browser.close();
server.close();
