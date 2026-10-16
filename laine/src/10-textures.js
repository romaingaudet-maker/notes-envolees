/* ------------------------------------------------------------------
   Textures fabriquées à l'ouverture : jersey tricoté, crochet (amigurumi),
   feutrine, fil retors, toile tissée, bois ; et quelques images pour les
   particules. Les coordonnées de texture des formes sont en centimètres :
   `repeat` dit combien de motifs tiennent dans un centimètre.
------------------------------------------------------------------- */
const TEX = {};
let maxAniso = 4;

function dataTex(data, w, h, { srgb = false, repeat = 1, rx, ry } = {}) {
  const t = new T.DataTexture(data, w, h, T.RGBAFormat, T.UnsignedByteType);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.magFilter = T.LinearFilter;
  t.minFilter = T.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = maxAniso;
  t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
  t.repeat.set(rx != null ? rx : repeat, ry != null ? ry : repeat);
  t.needsUpdate = true;
  return t;
}

/* champ de hauteur → carte de normales (+ albédo en niveaux de gris) */
function bakeMaps(H, A, w, h, strength) {
  const nrm = new Uint8Array(w * h * 4), alb = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const y0 = ((y - 1 + h) % h) * w, y1 = ((y + 1) % h) * w, yr = y * w;
    for (let x = 0; x < w; x++) {
      const x0 = (x - 1 + w) % w, x1 = (x + 1) % w;
      const dx = (H[yr + x1] - H[yr + x0]) * 0.5, dy = (H[y1 + x] - H[y0 + x]) * 0.5;
      let nx = -dx * strength, ny = -dy * strength, nz = 1;
      const l = 1 / Math.hypot(nx, ny, nz);
      nx *= l; ny *= l; nz *= l;
      const i = (yr + x) * 4;
      nrm[i] = (nx * 0.5 + 0.5) * 255; nrm[i + 1] = (ny * 0.5 + 0.5) * 255; nrm[i + 2] = (nz * 0.5 + 0.5) * 255; nrm[i + 3] = 255;
      const a = clamp(A[yr + x], 0, 1) * 255;
      alb[i] = alb[i + 1] = alb[i + 2] = a; alb[i + 3] = 255;
    }
  }
  return { nrm, alb };
}

/* Point jersey : des colonnes de V, chaque V fait de deux jambes de fil
   retors qui se chevauchent d'un rang à l'autre. */
function genKnit(S, C, R, o = {}) {
  const H = new Float32Array(S * S), A = new Float32Array(S * S);
  const cw = S / C, rh = S / R;
  const r = rng(o.seed || 11);
  const tint = new Float32Array(C * R);
  for (let i = 0; i < tint.length; i++) tint[i] = 0.93 + r() * 0.1;
  const legA = (o.legLen || 0.66) * rh, legB = (o.legWid || 0.255) * cw;
  const ang = (o.angle || 62) * DEG, ca = Math.cos(ang), sa = Math.sin(ang);
  const off = (o.offset || 0.23) * cw;
  const per = legB * 0.52, tw = 0.62; // stries de torsion du fil
  for (let y = 0; y < S; y++) {
    const gy = y / rh, cj = Math.floor(gy);
    for (let x = 0; x < S; x++) {
      const ci = Math.floor(x / cw);
      let best = 0, bt = 1, under = 0;
      for (let dj = -1; dj <= 1; dj++) {
        const j = cj + dj, cy = (j + 0.5) * rh + 0.08 * rh;
        for (let di = -1; di <= 1; di++) {
          const i = ci + di, cx = (i + 0.5) * cw;
          for (let s = -1; s <= 1; s += 2) {
            const lx = cx + s * off, ly = cy;
            const ux = -s * ca, uy = -sa; // axe de la jambe : du haut extérieur vers le bas au centre
            const px = x - lx, py = y - ly;
            const a = px * ux + py * uy, b = -px * uy + py * ux;
            const u = a / legA, v = b / legB;
            const q = u * u + v * v;
            if (q >= 1) continue;
            let hh = Math.sqrt(Math.max(0, 1 - v * v)) * Math.pow(1 - u * u, 0.35);
            const st = Math.sin(((a * tw + b * s) / per) * Math.PI);
            hh *= 0.86 + 0.14 * st * st;
            hh += 0.03 * dj; // le rang du dessus passe devant
            if (hh > best) {
              best = hh;
              bt = tint[((j % R + R) % R) * C + ((i % C + C) % C)];
              under = q;
            }
          }
        }
      }
      const k = y * S + x;
      const fuzz = pnoise2(x / 4, y / 4, S / 4, S / 4, 5) * 0.035;
      H[k] = best + fuzz;
      A[k] = bt * (0.5 + 0.5 * Math.pow(Math.max(0, best), 0.55)) * (1 - 0.08 * under) + fuzz * 0.8;
    }
  }
  return bakeMaps(H, A, S, S, o.strength || 7);
}

/* Crochet en mailles serrées : rangs décalés de petits V surmontés d'une boucle */
function genCrochet(S, C, R) {
  const H = new Float32Array(S * S), A = new Float32Array(S * S);
  const cw = S / C, rh = S / R;
  const r = rng(23);
  const tint = new Float32Array(C * R);
  for (let i = 0; i < tint.length; i++) tint[i] = 0.93 + r() * 0.1;
  const legA = 0.5 * rh, legB = 0.27 * cw, ang = 58 * DEG, ca = Math.cos(ang), sa = Math.sin(ang);
  const barA = 0.44 * cw, barB = 0.2 * rh;
  for (let y = 0; y < S; y++) {
    const cj = Math.floor(y / rh);
    for (let x = 0; x < S; x++) {
      let best = 0, bt = 1;
      for (let dj = -1; dj <= 1; dj++) {
        const j = cj + dj, shift = (((j % 2) + 2) % 2) * 0.5 * cw;
        const cy = (j + 0.5) * rh;
        const ci = Math.floor((x - shift) / cw);
        for (let di = -1; di <= 1; di++) {
          const i = ci + di, cx = (i + 0.5) * cw + shift;
          const t = tint[((j % R + R) % R) * C + ((i % C + C) % C)];
          for (let s = -1; s <= 1; s += 2) {
            const lx = cx + s * 0.2 * cw, ly = cy - 0.06 * rh;
            const ux = -s * ca, uy = -sa;
            const px = x - lx, py = y - ly;
            const a = px * ux + py * uy, b = -px * uy + py * ux;
            const u = a / legA, v = b / legB, q = u * u + v * v;
            if (q >= 1) continue;
            let hh = Math.sqrt(1 - v * v) * Math.pow(1 - u * u, 0.4);
            const st = Math.sin(((a * 0.6 + b * s) / (legB * 0.55)) * Math.PI);
            hh *= 0.87 + 0.13 * st * st;
            if (hh > best) { best = hh; bt = t; }
          }
          // boucle du haut (horizontale)
          const px = x - cx, py = y - (cy + 0.4 * rh);
          const u = px / barA, v = py / barB, q = u * u + v * v;
          if (q < 1) {
            let hh = Math.sqrt(1 - v * v) * Math.pow(1 - u * u, 0.4) * 0.92;
            const st = Math.sin(((px * 0.5 + py) / (barB * 0.7)) * Math.PI);
            hh *= 0.88 + 0.12 * st * st;
            if (hh > best) { best = hh; bt = t; }
          }
        }
      }
      const k = y * S + x;
      const fuzz = pnoise2(x / 2, y / 2, S / 2, S / 2, 9) * 0.03;
      H[k] = best + fuzz;
      A[k] = bt * (0.52 + 0.48 * Math.pow(Math.max(0, best), 0.5)) + fuzz;
    }
  }
  return bakeMaps(H, A, S, S, 6);
}

/* Feutrine : des milliers de fibres courtes emmêlées, sur un fond un peu bosselé */
function genFelt(S, seed = 3) {
  const H = new Float32Array(S * S), A = new Float32Array(S * S);
  const r = rng(seed);
  const stamp = (x, y, amp) => {
    const xi = Math.round(x), yi = Math.round(y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const w = dx === 0 && dy === 0 ? 1 : dx === 0 || dy === 0 ? 0.45 : 0.18;
      const k = (((yi + dy) % S + S) % S) * S + (((xi + dx) % S + S) % S);
      H[k] += amp * w;
    }
  };
  const n = Math.round(S * S * 0.028);
  for (let f = 0; f < n; f++) {
    let x = r() * S, y = r() * S, a = r() * TAU;
    const len = 6 + r() * 22, curl = (r() - 0.5) * 0.25, amp = 0.05 + r() * 0.07;
    for (let s = 0; s < len; s++) {
      stamp(x, y, amp);
      a += curl; x += Math.cos(a); y += Math.sin(a);
    }
  }
  let mx = 0;
  for (let k = 0; k < H.length; k++) mx = Math.max(mx, H[k]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const k = y * S + x;
    const low = pnoise2(x / 64, y / 64, S / 64, S / 64, seed) * 0.5 + pnoise2(x / 16, y / 16, S / 16, S / 16, seed + 1) * 0.25;
    const fib = H[k] / mx;
    H[k] = fib * 0.7 + low * 0.5;
    A[k] = 0.86 + 0.08 * low + 0.1 * (fib - 0.35);
  }
  return bakeMaps(H, A, S, S, 3.2);
}

/* Fil retors (pour les tubes : u le long du fil, v autour) : trois brins torsadés */
function genYarn(W, Hh, plies = 3, twists = 4) {
  const H = new Float32Array(W * Hh), A = new Float32Array(W * Hh);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / Hh;
    const q = v * plies + u * twists;
    const f = q - Math.floor(q);
    const ridge = Math.pow(Math.sin(Math.PI * f), 0.6);
    // fibres dans le sens du brin
    const fib = pnoise2(q * 9, (u * twists * 2 - v * plies) * 40, 9, 40, 2) * 0.12;
    const k = y * W + x;
    H[k] = ridge + fib;
    A[k] = 0.6 + 0.4 * ridge + fib * 0.6;
  }
  return bakeMaps(H, A, W, Hh, 5);
}

/* Toile tissée (coton) : fils de chaîne et de trame qui passent dessus et dessous */
function genWeave(S, N) {
  const H = new Float32Array(S * S), A = new Float32Array(S * S);
  const c = S / N;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = Math.floor(x / c), j = Math.floor(y / c);
    const fx = x / c - i, fy = y / c - j;
    const over = (i + j) % 2 === 0;
    const warp = Math.pow(Math.sin(Math.PI * fx), 0.7) * (over ? 0.9 + 0.1 * Math.sin(Math.PI * fy) : 0.55);
    const weft = Math.pow(Math.sin(Math.PI * fy), 0.7) * (!over ? 0.9 + 0.1 * Math.sin(Math.PI * fx) : 0.55);
    const hh = Math.max(warp, weft) + pnoise2(x / 2, y / 2, S / 2, S / 2, 4) * 0.05;
    const k = y * S + x;
    H[k] = hh;
    A[k] = 0.72 + 0.28 * hh;
  }
  return bakeMaps(H, A, S, S, 3);
}

/* Bois : veines étirées */
function genWood(S) {
  const H = new Float32Array(S * S), A = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = pnoise2(x / 64, y / 8, S / 64, S / 8, 7) * 3 + pnoise2(x / 16, y / 4, S / 16, S / 4, 8);
    const ring = 0.5 + 0.5 * Math.sin((y / S) * TAU * 6 + n * 2.2);
    const k = y * S + x;
    H[k] = ring * 0.3 + pnoise2(x / 4, y / 2, S / 4, S / 2, 9) * 0.05;
    A[k] = 0.78 + 0.22 * Math.pow(ring, 2);
  }
  return bakeMaps(H, A, S, S, 1.5);
}

/* Les motifs, fabriqués une fois et partagés (repeat = motifs par cm) */
const PATTERN = {
  // une case de 8 mailles sur 8 rangs ; maille de 0,55 cm, rang de 0,45 cm
  knit: { gen: () => genKnit(512, 8, 8), rx: 1 / (8 * 0.55), ry: 1 / (8 * 0.45) },
  crochet: { gen: () => genCrochet(512, 10, 12), rx: 1 / (10 * 0.42), ry: 1 / (12 * 0.36) },
  felt: { gen: () => genFelt(512, 3), rx: 1 / 9, ry: 1 / 9 },
  yarn: { gen: () => genYarn(256, 128), rx: 1, ry: 1, w: 256, h: 128 },
  weave: { gen: () => genWeave(256, 16), rx: 1 / 1.6, ry: 1 / 1.6, w: 256 },
  wood: { gen: () => genWood(256), rx: 1 / 12, ry: 1 / 12, w: 256 },
};
const patCache = {};
function pattern(kind, scale = 1) {
  const key = kind + '@' + scale;
  if (patCache[key]) return patCache[key];
  const P = PATTERN[kind];
  let base = patCache[kind + '@base'];
  if (!base) {
    const g = P.gen(), w = P.w || 512, h = P.h || w;
    base = patCache[kind + '@base'] = {
      map: dataTex(g.alb, w, h, { rx: P.rx, ry: P.ry }),
      normal: dataTex(g.nrm, w, h, { rx: P.rx, ry: P.ry }),
    };
  }
  if (scale === 1) return (patCache[key] = base);
  const map = base.map.clone(), normal = base.normal.clone();
  map.repeat.set(P.rx / scale, P.ry / scale);
  normal.repeat.set(P.rx / scale, P.ry / scale);
  map.needsUpdate = normal.needsUpdate = true;
  return (patCache[key] = { map, normal });
}

/* Fibres en 3D pour le duvet de la laine (coquilles successives) : une
   texture 32³ qui se répète, plus forte au cœur de chaque brin. */
let fiberTex3D = null;
function fiberTexture() {
  if (fiberTex3D) return fiberTex3D;
  const N = 32, cells = 8, cs = N / cells;
  const pts = [];
  const r = rng(77);
  for (let i = 0; i < cells * cells * cells; i++) pts.push([r(), r(), r()]);
  const data = new Uint8Array(N * N * N);
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const gx = x / cs, gy = y / cs, gz = z / cs;
    const cx = Math.floor(gx), cy = Math.floor(gy), cz = Math.floor(gz);
    let d = 9;
    for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const ix = cx + i, iy = cy + j, iz = cz + k;
      const p = pts[(((iz % cells) + cells) % cells) * cells * cells + (((iy % cells) + cells) % cells) * cells + (((ix % cells) + cells) % cells)];
      const dx = ix + p[0] - gx, dy = iy + p[1] - gy, dz = iz + p[2] - gz;
      d = Math.min(d, Math.hypot(dx, dy, dz));
    }
    data[(z * N + y) * N + x] = clamp(1 - d * 1.55, 0, 1) * 255;
  }
  const t = new T.Data3DTexture(data, N, N, N);
  t.format = T.RedFormat;
  t.type = T.UnsignedByteType;
  t.minFilter = t.magFilter = T.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = T.RepeatWrapping;
  t.unpackAlignment = 1;
  t.needsUpdate = true;
  return (fiberTex3D = t);
}

/* Petites images dessinées (particules, ombres de contact) */
function canvasTex(size, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new T.CanvasTexture(c);
  t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
  t.needsUpdate = true;
  return t;
}
const SPRITES = {};
function sprite(kind) {
  if (SPRITES[kind]) return SPRITES[kind];
  let t;
  if (kind === 'soft') {
    t = canvasTex(64, (g, s) => {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    });
  } else if (kind === 'lint') {
    t = canvasTex(128, (g, s) => {
      const r = rng(5);
      g.lineCap = 'round';
      for (let i = 0; i < 70; i++) {
        const a = r() * TAU, l = s * (0.18 + r() * 0.3), bend = (r() - 0.5) * 1.4;
        g.strokeStyle = `rgba(255,255,255,${0.12 + r() * 0.3})`;
        g.lineWidth = 0.8 + r() * 1.1;
        g.beginPath();
        g.moveTo(s / 2 + Math.cos(a) * 4, s / 2 + Math.sin(a) * 4);
        g.quadraticCurveTo(s / 2 + Math.cos(a + bend) * l * 0.6, s / 2 + Math.sin(a + bend) * l * 0.6, s / 2 + Math.cos(a + bend * 0.3) * l, s / 2 + Math.sin(a + bend * 0.3) * l);
        g.stroke();
      }
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.2);
      gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    });
  } else if (kind === 'spark') {
    t = canvasTex(64, (g, s) => {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      g.fillStyle = 'rgba(255,255,255,.9)';
      for (let k = 0; k < 2; k++) {
        g.save(); g.translate(s / 2, s / 2); g.rotate(k * Math.PI / 2);
        g.beginPath(); g.moveTo(-s / 2, 0); g.quadraticCurveTo(0, -1.6, s / 2, 0); g.quadraticCurveTo(0, 1.6, -s / 2, 0); g.fill();
        g.restore();
      }
    });
  } else if (kind === 'shadow') {
    t = canvasTex(128, (g, s) => {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(0.45, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }, false);
  } else if (kind === 'ring') {
    t = canvasTex(64, (g, s) => {
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
      g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 4, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(s * 0.36, s * 0.34, 4, 0, TAU); g.fill();
    });
  } else if (kind === 'drop') {
    t = canvasTex(64, (g, s) => {
      const gr = g.createLinearGradient(0, 0, 0, s);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.9)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(s / 2, 2); g.quadraticCurveTo(s / 2 + 7, s * 0.7, s / 2, s - 3); g.quadraticCurveTo(s / 2 - 7, s * 0.7, s / 2, 2); g.fill();
    });
  }
  return (SPRITES[kind] = t);
}
