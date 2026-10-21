/* ------------------------------------------------------------------
   Les Notes Envolées, version laine : décors 3D animés image par image.
   Les fichiers de laine/src et laine/scenes sont mis bout à bout (dans
   l'ordre de leur nom) à l'intérieur d'une seule fonction : ils partagent
   leurs déclarations. Unités : le centimètre (une marionnette fait 8 à 15 cm).
------------------------------------------------------------------- */
'use strict';
const T = window.THREE;
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = sat(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - sat(t), 3);
const easeIn = (t) => Math.pow(sat(t), 3);
const easeInOut = (t) => { t = sat(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOutBack = (t, s = 1.70158) => { t = sat(t) - 1; return 1 + (s + 1) * t * t * t + s * t * t; };
// une bosse 0 → 1 → 0 sur [0, 1]
const bump = (t) => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t));
const v3 = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const v2 = (x = 0, y = 0) => new T.Vector2(x, y);
const col = (c) => (c && c.isColor ? c.clone() : new T.Color(c));

/* Normales nulles. Une pièce extrudée (les lettres en feutrine du titre…) contient des triangles aplatis
   dont la normale est nulle ; quand la scène bouge, il arrive qu'un tel triangle couvre un pixel :
   normalize(0) donne NaN dans le shader, et le halo étalait ce pixel NaN en carré noir (accueil,
   « Envolées », par intermittence). Toute normale nulle (ou NaN) reçoit une direction quelconque. */
function saneNormals(g) {
  const n = g && g.attributes && g.attributes.normal;
  if (!n) return g;
  let fixed = 0;
  for (let i = 0; i < n.count; i++) {
    if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) { n.setXYZ(i, 0, 0, 1); fixed++; }
  }
  if (fixed) n.needsUpdate = true;
  return g;
}
const SANE_GEO = new WeakSet();
function saneScene(scene) {
  scene.traverse((o) => { if (o.geometry && !SANE_GEO.has(o.geometry)) { SANE_GEO.add(o.geometry); saneNormals(o.geometry); } });
}
{ // toutes les normales calculées passent par là (ExtrudeGeometry les calcule à sa création)
  const cvn = T.BufferGeometry.prototype.computeVertexNormals;
  T.BufferGeometry.prototype.computeVertexNormals = function () { cvn.call(this); saneNormals(this); };
}

/* hasards reproductibles */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashi(a, b = 0, c = 0) {
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca77) ^ Math.imul(c | 0, 0xc2b2ae3d);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12; h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
/* bruit de valeur 3D, lisse, reproductible (pour les bosses « faites main ») */
function vnoise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hashi(ix + a, iy + b, iz + c);
  const x00 = lerp(h(0, 0, 0), h(1, 0, 0), ux), x10 = lerp(h(0, 1, 0), h(1, 1, 0), ux);
  const x01 = lerp(h(0, 0, 1), h(1, 0, 1), ux), x11 = lerp(h(0, 1, 1), h(1, 1, 1), ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz) * 2 - 1;
}
function fbm3(x, y, z, oct = 3) {
  let a = 0, w = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { a += w * vnoise3(x * f, y * f, z * f); f *= 2.03; w *= 0.5; }
  return a;
}
/* bruit 2D périodique (pour les textures qui se répètent sans couture) */
function pnoise2(x, y, px, py, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a, b) => hashi(((ix + a) % px + px) % px, ((iy + b) % py + py) % py, seed);
  return lerp(lerp(h(0, 0), h(1, 0), ux), lerp(h(0, 1), h(1, 1), ux), uy) * 2 - 1;
}

/* les couleurs des notes, les mêmes que sur le reste de la page */
const NOTE_COL = { C: '#E5484D', D: '#F2803C', E: '#F5C32C', F: '#4CAF5A', G: '#1FA7A0', A: '#3E6FD8', B: '#8B57C9' };
const NOTE_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/* registre des décors : SCENES[thème] = { color, build(K, opts) } */
const SCENES = {};
