/* ------------------------------------------------------------------
   Matières : laine (jersey, crochet, feutrine, fil), duvet en coquilles,
   et les quelques matières qui ne sont pas en laine (yeux-boutons,
   perles, bois, verre, lumières).
------------------------------------------------------------------- */
const MAT = new Map();
// valeurs partagées par tous les duvets (frémissement image par image)
const FUZZ_U = { uFzBoil: { value: 0 } };
let FUZZ_SHELLS = 6; // réduit sur les petits appareils

function lighten(c, k) { return col(c).lerp(new T.Color(1, 1, 1), k); }
function darken(c, k) { return col(c).multiplyScalar(1 - k); }

/* laine : kind = knit | crochet | felt | yarn | weave | plain */
function wool(color, kind = 'knit', o = {}) {
  const key = ['w', kind, col(color).getHexString(), o.scale || 1, o.bump || 1, o.sheen != null ? o.sheen : '', o.rough || 1, o.side || 0, o.emissive || '', o.sheenColor || ''].join('|');
  if (MAT.has(key)) return MAT.get(key);
  const p = kind === 'plain' ? null : pattern(kind, o.scale || 1);
  const c = col(color);
  const m = new T.MeshPhysicalMaterial({
    color: c,
    roughness: o.rough || 1,
    metalness: 0,
    map: p ? p.map : null,
    normalMap: p ? p.normal : null,
    normalScale: v2(o.bump || 1, o.bump || 1),
    sheen: o.sheen != null ? o.sheen : 0.9,
    sheenRoughness: 0.55,
    sheenColor: o.sheenColor ? col(o.sheenColor) : lighten(c, 0.45),
    side: o.side || T.FrontSide,
  });
  if (o.emissive) { m.emissive = col(o.emissive); m.emissiveIntensity = o.emissiveIntensity || 1; }
  m.userData.wool = true;
  MAT.set(key, m);
  return m;
}

/* duvet : coquilles décalées le long des normales, découpées par des fibres 3D */
const fuzzCompile = function (shader) {
  const fz = this.userData.fz;
  shader.uniforms.uFzLen = fz.len;
  shader.uniforms.uFzDensity = fz.density;
  shader.uniforms.uFzDroop = fz.droop;
  shader.uniforms.uFzCurl = fz.curl;
  shader.uniforms.uFzBoil = FUZZ_U.uFzBoil;
  shader.uniforms.uFiberTex = { value: fiberTexture() };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform float uFzLen; uniform float uFzDensity; uniform vec3 uFzDroop; uniform vec3 uFzCurl; uniform float uFzBoil;
varying vec3 vFzPos; varying float vFzLayer;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
float fzL = (float(gl_InstanceID) + 1.0) / float(FZ_SHELLS);
vFzLayer = fzL;
vFzPos = (position + uFzCurl * fzL * uFzLen) * uFzDensity + vec3(uFzBoil * 0.37, uFzBoil * 0.11, uFzBoil);
transformed += normalize(objectNormal) * (fzL * uFzLen) + uFzDroop * (fzL * fzL * uFzLen);`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
uniform highp sampler3D uFiberTex;
varying vec3 vFzPos; varying float vFzLayer;`)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
float fzF = texture(uFiberTex, vFzPos).r;
if (fzF <= vFzLayer * 0.92 + 0.04) discard;`)
    .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb *= mix(0.78, 1.16, vFzLayer);`);
};

function fuzzMat(base, o) {
  const key = base.uuid + '|' + o.len + '|' + o.fiber + '|' + FUZZ_SHELLS;
  if (MAT.has(key)) return MAT.get(key);
  const m = base.clone();
  m.userData.fz = {
    len: { value: o.len },
    density: { value: 1 / (8 * o.fiber) },
    droop: { value: o.droop || v3(0, -0.35, 0) },
    curl: { value: o.curl || v3(0.6, 0.2, 0.4) },
  };
  m.defines = Object.assign({}, m.defines, { FZ_SHELLS: FUZZ_SHELLS });
  m.onBeforeCompile = fuzzCompile;
  m.customProgramCacheKey = () => 'fuzz' + FUZZ_SHELLS;
  MAT.set(key, m);
  return m;
}

/* ajoute le duvet à une forme en laine (len : longueur des fibres en cm) */
function fuzz(mesh, len = 0.18, o = {}) {
  if (!FUZZ_SHELLS || !mesh.geometry) return mesh;
  const sh = new T.InstancedMesh(mesh.geometry, fuzzMat(mesh.material, Object.assign({ len, fiber: o.fiber || 0.11 }, o)), FUZZ_SHELLS);
  const id = new T.Matrix4();
  for (let i = 0; i < FUZZ_SHELLS; i++) sh.setMatrixAt(i, id);
  sh.castShadow = false;
  sh.receiveShadow = true;
  sh.frustumCulled = mesh.frustumCulled;
  sh.userData.isFuzz = true;
  mesh.add(sh);
  return mesh;
}

/* ce qui n'est pas en laine */
function plastic(color = '#151515', o = {}) {
  const key = ['p', col(color).getHexString(), o.rough || 0.22].join('|');
  if (MAT.has(key)) return MAT.get(key);
  const m = new T.MeshPhysicalMaterial({ color: col(color), roughness: o.rough || 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
  MAT.set(key, m);
  return m;
}
function woodMat(color = '#B9874F', o = {}) {
  const key = ['wd', col(color).getHexString(), o.rough || 0.62].join('|');
  if (MAT.has(key)) return MAT.get(key);
  const p = pattern('wood', o.scale || 1);
  const m = new T.MeshStandardMaterial({ color: col(color), roughness: o.rough || 0.62, map: p.map, normalMap: p.normal, normalScale: v2(0.6, 0.6) });
  MAT.set(key, m);
  return m;
}
function glassMat(color = '#DDF3FF', o = {}) {
  const key = ['g', col(color).getHexString(), o.opacity || 0.22].join('|');
  if (MAT.has(key)) return MAT.get(key);
  const m = new T.MeshPhysicalMaterial({
    color: col(color), roughness: 0.04, metalness: 0, transparent: true, opacity: o.opacity || 0.22,
    clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.6,
  });
  MAT.set(key, m);
  return m;
}
function metalMat(color = '#D8B45A', o = {}) {
  const key = ['m', col(color).getHexString(), o.rough || 0.32].join('|');
  if (MAT.has(key)) return MAT.get(key);
  const m = new T.MeshStandardMaterial({ color: col(color), roughness: o.rough || 0.32, metalness: 1 });
  MAT.set(key, m);
  return m;
}
/* lumière (bougie, fenêtre allumée, luciole) : couleur au-delà de 1 pour le halo */
function glowMat(color = '#FFD27A', k = 3) {
  const key = ['l', col(color).getHexString(), k].join('|');
  if (MAT.has(key)) return MAT.get(key);
  const m = new T.MeshBasicMaterial({ color: col(color).multiplyScalar(k), toneMapped: false, fog: false });
  MAT.set(key, m);
  return m;
}
/* résine colorée et brillante (eau, sucre d'orge, bonbons) */
function resinMat(color, o = {}) {
  const key = ['r', col(color).getHexString(), o.rough || 0.12, o.opacity || 1].join('|');
  if (MAT.has(key)) return MAT.get(key);
  const m = new T.MeshPhysicalMaterial({
    color: col(color), roughness: o.rough || 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04,
    transparent: (o.opacity || 1) < 1, opacity: o.opacity || 1,
  });
  if (o.normal) { const p = pattern(o.normal, o.scale || 1); m.normalMap = p.normal; m.normalScale = v2(o.bump || 0.6, o.bump || 0.6); }
  MAT.set(key, m);
  return m;
}
