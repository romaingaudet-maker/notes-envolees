/* ------------------------------------------------------------------
   Le moteur : un seul rendu WebGL partagé par l'accueil et les comptines,
   la caméra « image par image » (12 images par seconde, comme un film
   d'animation tourné en volume), et le développement de chaque image :
   profondeur de champ de maquette, halo des lumières, étalonnage, grain
   de pellicule, légère variation d'exposition d'une image à l'autre.
------------------------------------------------------------------- */
const FPS = 12;
const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

const Engine = (() => {
  let renderer = null, canvas = null, okCache = null, post = null;
  let view = null, host = null, ro = null, raf = 0, lastFrame = -1, dirty = false, frame0 = 0, paused = false;
  let W = 0, H = 0, PR = 1, tier = 2;
  const slow = [];

  function supported() {
    if (okCache != null) return okCache;
    try {
      const c = document.createElement('canvas');
      const g = c.getContext('webgl2');
      okCache = !!(window.WebGL2RenderingContext && g && T);
      if (g) { const e = g.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); }
    } catch (e) { okCache = false; }
    return okCache;
  }

  function pickTier() {
    const ua = navigator.userAgent || '';
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
    const cores = navigator.hardwareConcurrency || 4;
    if (mobile && cores <= 4) return 0;
    if (mobile) return 1;
    return cores <= 2 ? 1 : 2;
  }

  function init() {
    if (renderer) return true;
    if (!supported()) return false;
    canvas = document.createElement('canvas');
    canvas.className = 'laine-cv';
    canvas.setAttribute('aria-hidden', 'true');
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    } catch (e) { okCache = false; return false; }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.NoToneMapping;
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tier = pickTier();
    FUZZ_SHELLS = tier === 0 ? 4 : tier === 1 ? 5 : 6;
    post = makePost(renderer);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); });
    canvas.addEventListener('webglcontextrestored', () => { dirty = true; start(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (view && host) start(); });
    return true;
  }

  function pixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const cap = tier === 0 ? 1.25 : tier === 1 ? 1.6 : 2;
    return Math.min(dpr, cap) * (Engine.scale || 1);
  }

  function resize() {
    if (!host || !renderer) return;
    const r = host.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    const pr = pixelRatio();
    if (w === W && h === H && pr === PR) return;
    W = w; H = h; PR = pr;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    post.setSize(Math.round(w * pr), Math.round(h * pr));
    if (view && view.resize) view.resize(w, h);
    dirty = true;
  }

  function attach(el) {
    if (!init()) return false;
    if (ro) ro.disconnect();
    host = el;
    el.appendChild(canvas);
    W = H = 0;
    if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { resize(); if (paused) once(); }); ro.observe(el); }
    resize();
    return true;
  }

  function show(v) {
    view = v;
    frame0 = Math.floor(performance.now() / 1000 * FPS);
    lastFrame = -1;
    dirty = true;
    if (view.resize && W) view.resize(W, H);
    start();
  }
  function start() {
    if (!view || raf || document.hidden || manualF != null) return;
    paused = false;
    raf = requestAnimationFrame(loop);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function detach() {
    stop();
    if (ro) ro.disconnect();
    ro = null;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    host = null;
    view = null;
  }

  // horloge manuelle (bancs d'essai) : Engine.manual(f) dessine l'image f et arrête la boucle
  let manualF = null;
  function frameNow() { return manualF != null ? manualF : Math.floor(performance.now() / 1000 * FPS) - frame0; }
  function manual(f) { manualF = f; stop(); if (f != null && view && renderer) step(f); }

  function step(f) {
    const t = f / FPS;
    FUZZ_U.uFzBoil.value = RM.matches ? 0 : hashi(f >> 1, 99) * 0.014;
    view.tick(t, f);
    post.render(renderer, view, f, null);
    if (view.after) view.after();
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!view) return;
    const f = RM.matches ? 0 : frameNow();
    if (f === lastFrame && !dirty) return;
    const late = lastFrame >= 0 && f - lastFrame > 1;
    lastFrame = f;
    dirty = false;
    const t0 = performance.now();
    step(f);
    watch(performance.now() - t0, late);
    if (RM.matches && !view.alwaysMove) { stop(); paused = true; }
  }
  // l'image suivante est calculée sans attendre (après un changement d'état)
  function poke() { dirty = true; if (!raf && view && host) start(); }
  function once() { if (view && renderer) { step(RM.matches ? 0 : frameNow()); } }

  /* si les images arrivent en retard, on baisse la définition */
  function watch(ms, late) {
    slow.push(late || ms > 60 ? 1 : 0);
    if (slow.length > 24) slow.shift();
    if (slow.length >= 24 && slow.reduce((a, b) => a + b, 0) > 10 && (Engine.scale || 1) > 0.55) {
      Engine.scale = (Engine.scale || 1) * 0.82;
      slow.length = 0;
      W = 0; resize();
    }
  }

  /* des images fixes, à une taille donnée (portraits de l'accueil), sans toucher
     au rendu à l'écran : un second jeu de cibles, gardé pour les portraits suivants */
  let snapPost = null;
  function snapshot(v, w, h, frames = [0]) {
    if (!init()) return null;
    snapPost = snapPost || makePost(renderer);
    snapPost.setSize(w, h);
    if (v.resize) v.resize(w, h);
    const out = frames.map((f) => {
      FUZZ_U.uFzBoil.value = hashi(f >> 1, 99) * 0.014;
      v.tick(f / FPS, f);
      return snapPost.render(renderer, v, f, 'read');
    });
    renderer.setRenderTarget(null);
    return out;
  }

  return {
    supported, init, attach, detach, show, poke, once, snapshot, stop, start, manual,
    get renderer() { return renderer; },
    get view() { return view; },
    get size() { return [W, H]; },
    get tier() { return tier; },
    project(v3w, cam) { const p = v3w.clone().project(cam); return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H, p.z]; },
    scale: 1,
  };
})();

/* ---------------- développement de l'image ---------------- */
const POST_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const DEPTH_FN = `
uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uAper; uniform float uMaxBlur;
float linz(float d){ return (uNear * uFar) / (uFar - (uFar - uNear) * d); }
float cocOf(float z){ return min(uMaxBlur, uAper * abs(1.0 - uFocus / max(z, 0.001))); }`;
/* Couleur saine : un pixel de la scène peut dépasser ce que garde la mémoire en demi-flottants (reflet très
   vif → infini) ou valoir NaN (normale nulle sur un téléphone). Le halo (seuil, puis flou séparé en
   largeur et en hauteur, en quart et huitième de définition) l'étalait en CARRÉ NOIR, par intermittence.
   NaN et négatifs → 0 (la comparaison avec NaN est fausse), infini → 64. */
const SANE_FN = `
float sane1(float x){ return x >= 0.0 ? min(x, 64.0) : 0.0; }
vec3 sane(vec3 c){ return vec3(sane1(c.r), sane1(c.g), sane1(c.b)); }`;

function makePost(renderer) {
  const tri = new T.BufferGeometry();
  tri.setAttribute('position', new T.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  tri.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const quad = new T.Mesh(tri);
  quad.frustumCulled = false;
  const pscene = new T.Scene();
  pscene.add(quad);
  const ocam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const ext = renderer.extensions;
  const hdr = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float');
  const type = hdr ? T.HalfFloatType : T.UnsignedByteType;
  const rt = (o = {}) => new T.WebGLRenderTarget(4, 4, Object.assign({ type, depthBuffer: false, magFilter: T.LinearFilter, minFilter: T.LinearFilter, generateMipmaps: false }, o));
  const depthTex = new T.DepthTexture(4, 4);
  depthTex.type = T.UnsignedIntType;
  const rScene = rt({ depthBuffer: true, samples: 4, depthTexture: depthTex });
  const rDof = rt(), rB1 = rt(), rB2 = rt(), rB3 = rt(), rB4 = rt();
  const rOut = new T.WebGLRenderTarget(4, 4, { type: T.UnsignedByteType, depthBuffer: false });
  let w = 4, h = 4;

  const shared = { uNear: { value: 1 }, uFar: { value: 1000 }, uFocus: { value: 100 }, uAper: { value: 4 }, uMaxBlur: { value: 9 } };
  const dofMat = new T.ShaderMaterial({
    vertexShader: POST_VS,
    uniforms: Object.assign({ tColor: { value: null }, tDepth: { value: null }, uTexel: { value: v2() } }, shared),
    fragmentShader: `varying vec2 vUv; uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uTexel;
${DEPTH_FN}
${SANE_FN}
const float GA = 2.39996323;
void main(){
  float cz = linz(texture2D(tDepth, vUv).x);
  float cs = cocOf(cz);
  vec3 c = sane(texture2D(tColor, vUv).rgb);
  float tot = 1.0, r = 0.6, mxc = cs;
  float ang = 0.0;
  for (int i = 0; i < 140; i++) {
    if (r >= uMaxBlur) break;
    vec2 tc = vUv + vec2(cos(ang), sin(ang)) * uTexel * r;
    vec3 sc = sane(texture2D(tColor, tc).rgb);
    float sz = linz(texture2D(tDepth, tc).x);
    float ss = cocOf(sz);
    if (sz > cz) ss = clamp(ss, 0.0, cs * 2.0);
    float m = smoothstep(r - 0.5, r + 0.5, ss);
    mxc = max(mxc, ss * m);
    c += mix(c / tot, sc, m);
    tot += 1.0;
    r += 0.62 / r;
    ang += GA;
  }
  gl_FragColor = vec4(c / tot, mxc);
}`,
    depthTest: false, depthWrite: false,
  });
  const brightMat = new T.ShaderMaterial({
    vertexShader: POST_VS,
    uniforms: { tSrc: { value: null }, uTexel: { value: v2() }, uThr: { value: 1.0 } },
    fragmentShader: `varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr;
${SANE_FN}
void main(){
  vec3 c = (sane(texture2D(tSrc, vUv + uTexel * vec2(-1.0,-1.0)).rgb) + sane(texture2D(tSrc, vUv + uTexel * vec2(1.0,-1.0)).rgb)
          + sane(texture2D(tSrc, vUv + uTexel * vec2(-1.0,1.0)).rgb) + sane(texture2D(tSrc, vUv + uTexel * vec2(1.0,1.0)).rgb)) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  float k = max(0.0, l - uThr) / max(l, 1e-4);
  gl_FragColor = vec4(sane(c * k), 1.0);
}`,
    depthTest: false, depthWrite: false,
  });
  const blurMat = new T.ShaderMaterial({
    vertexShader: POST_VS,
    uniforms: { tSrc: { value: null }, uDir: { value: v2() } },
    fragmentShader: `varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uDir;
${SANE_FN}
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
  c += (texture2D(tSrc, vUv + uDir * 1.3846).rgb + texture2D(tSrc, vUv - uDir * 1.3846).rgb) * 0.316216;
  c += (texture2D(tSrc, vUv + uDir * 3.2308).rgb + texture2D(tSrc, vUv - uDir * 3.2308).rgb) * 0.070270;
  gl_FragColor = vec4(sane(c), 1.0);
}`,
    depthTest: false, depthWrite: false,
  });
  const finalMat = new T.ShaderMaterial({
    vertexShader: POST_VS,
    uniforms: Object.assign({
      tColor: { value: null }, tDof: { value: null }, tDepth: { value: null }, tB1: { value: null }, tB2: { value: null },
      uRes: { value: v2() }, uExposure: { value: 1 }, uBloom: { value: 0.6 }, uGrain: { value: 0.035 }, uVig: { value: 0.35 },
      uFrame: { value: 0 }, uFlicker: { value: 0 }, uSat: { value: 1.08 }, uLift: { value: new T.Color(0, 0, 0) }, uGain: { value: new T.Color(1, 1, 1) },
      uDofOn: { value: 1 }, uFlip: { value: 0 }, uPunch: { value: 1.3 },
    }, shared),
    fragmentShader: `varying vec2 vUv;
uniform sampler2D tColor; uniform sampler2D tDof; uniform sampler2D tDepth; uniform sampler2D tB1; uniform sampler2D tB2;
uniform vec2 uRes; uniform float uExposure; uniform float uBloom; uniform float uGrain; uniform float uVig; uniform float uFrame;
uniform float uFlicker; uniform float uSat; uniform vec3 uLift; uniform vec3 uGain; uniform float uDofOn; uniform float uFlip; uniform float uPunch;
${DEPTH_FN}
${SANE_FN}
vec3 agxC(vec3 x){ vec3 x2 = x*x; vec3 x4 = x2*x2; return 15.5*x4*x2 - 40.14*x4*x + 31.96*x4 - 6.868*x2*x + 0.4298*x2 + 0.1191*x - 0.00232; }
vec3 agx(vec3 c){
  const mat3 toR = mat3(vec3(0.6274,0.0691,0.0164), vec3(0.3293,0.9195,0.0880), vec3(0.0433,0.0113,0.8956));
  const mat3 fromR = mat3(vec3(1.6605,-0.1246,-0.0182), vec3(-0.5876,1.1329,-0.1006), vec3(-0.0728,-0.0083,1.1187));
  const mat3 ins = mat3(vec3(0.856627153315983,0.137318972929847,0.11189821299995), vec3(0.0951212405381588,0.761241990602591,0.0767994186031903), vec3(0.0482516061458583,0.101439036467562,0.811302368396859));
  const mat3 outs = mat3(vec3(1.1271005818144368,-0.1413297634984383,-0.14132976349843826), vec3(-0.11060664309660323,1.157823702216272,-0.11060664309660294), vec3(-0.016493938717834573,-0.016493938717834257,1.2519364065950405));
  c = toR * c; c = ins * c; c = max(c, 1e-10); c = log2(c);
  c = clamp((c + 12.47393) / 16.5, 0.0, 1.0);
  c = agxC(c);
  // « look » contrasté (punchy) : plus de contraste et de couleur, comme une pellicule
  float lw = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = pow(max(c, 0.0), vec3(uPunch));
  c = lw + (1.0 + (uPunch - 1.0) * 1.15) * (c - lw);
  c = outs * c; c = pow(max(vec3(0.0), c), vec3(2.2)); c = fromR * c;
  return clamp(c, 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
void main(){
  vec2 uv = vUv;
  vec3 c = sane(texture2D(tColor, uv).rgb);
  if (uDofOn > 0.5) {
    float coc = cocOf(linz(texture2D(tDepth, uv).x));
    vec4 d = texture2D(tDof, uv);
    c = mix(c, sane(d.rgb), smoothstep(0.3, 1.4, max(coc, d.a)));
  }
  c += (sane(texture2D(tB1, uv).rgb) * 0.75 + sane(texture2D(tB2, uv).rgb) * 0.55) * uBloom;
  c *= uExposure * (1.0 + uFlicker);
  c = agx(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = max(mix(vec3(l), c, uSat), 0.0);
  c = c * uGain + uLift * (1.0 - c);
  c = toSRGB(clamp(c, 0.0, 1.0));
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= mix(1.0, smoothstep(1.15, 0.2, length(q)), uVig);
  c += (hash(floor(uv * uRes) + uFrame * 7.13) - 0.5) * uGrain;
  gl_FragColor = vec4(c, 1.0);
}`,
    depthTest: false, depthWrite: false,
  });

  function pass(mat, target) {
    quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(pscene, ocam);
  }

  function setSize(W, H) {
    if (W === w && H === h) return;
    w = Math.max(2, W); h = Math.max(2, H);
    rScene.setSize(w, h);
    const hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1);
    rDof.setSize(hw, hh);
    rB1.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); rB2.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2));
    rB3.setSize(Math.max(2, w >> 3), Math.max(2, h >> 3)); rB4.setSize(Math.max(2, w >> 3), Math.max(2, h >> 3));
    rOut.setSize(w, h);
  }

  function render(r, v, f, mode) {
    const cam = v.camera, P = v.post || {};
    // 1. la scène
    r.setRenderTarget(rScene);
    r.render(v.scene, cam);
    // 2. profondeur de champ (demi-définition)
    shared.uNear.value = cam.near; shared.uFar.value = cam.far;
    shared.uFocus.value = P.focus || 100;
    const k = h / 720; // le flou se règle pour un écran de 720 px de haut
    shared.uAper.value = (P.aper != null ? P.aper : 5) * k * 0.5;
    shared.uMaxBlur.value = Math.max(1.5, (P.maxBlur || 10) * k * 0.5);
    const dofOn = P.aper !== 0 && w > 64;
    if (dofOn) {
      dofMat.uniforms.tColor.value = rScene.texture;
      dofMat.uniforms.tDepth.value = rScene.depthTexture;
      dofMat.uniforms.uTexel.value.set(1 / rDof.width, 1 / rDof.height);
      pass(dofMat, rDof);
    }
    // 3. halo des lumières
    const src = dofOn ? rDof.texture : rScene.texture;
    brightMat.uniforms.tSrc.value = src;
    brightMat.uniforms.uTexel.value.set(1 / rB1.width, 1 / rB1.height);
    brightMat.uniforms.uThr.value = (P.bloomThr != null ? P.bloomThr : 1.0) * (hdr ? 1 : 0.82);
    pass(brightMat, rB1);
    blurMat.uniforms.tSrc.value = rB1.texture; blurMat.uniforms.uDir.value.set(1 / rB1.width, 0); pass(blurMat, rB2);
    blurMat.uniforms.tSrc.value = rB2.texture; blurMat.uniforms.uDir.value.set(0, 1 / rB1.height); pass(blurMat, rB1);
    blurMat.uniforms.tSrc.value = rB1.texture; blurMat.uniforms.uDir.value.set(1.6 / rB3.width, 0); pass(blurMat, rB3);
    blurMat.uniforms.tSrc.value = rB3.texture; blurMat.uniforms.uDir.value.set(0, 1.6 / rB3.height); pass(blurMat, rB4);
    // 4. étalonnage, grain, vignette
    const U = finalMat.uniforms;
    U.tColor.value = rScene.texture; U.tDof.value = rDof.texture; U.tDepth.value = rScene.depthTexture;
    U.tB1.value = rB1.texture; U.tB2.value = rB4.texture;
    U.uRes.value.set(w, h);
    U.uExposure.value = P.exposure != null ? P.exposure : 1;
    U.uBloom.value = P.bloom != null ? P.bloom : 0.55;
    U.uGrain.value = RM.matches ? 0.02 : (P.grain != null ? P.grain : 0.04);
    U.uVig.value = P.vignette != null ? P.vignette : 0.38;
    U.uFrame.value = f % 64;
    U.uFlicker.value = RM.matches ? 0 : (hashi(f, 7) - 0.5) * (P.flicker != null ? P.flicker : 0.022);
    U.uSat.value = P.sat != null ? P.sat : 1.1;
    U.uLift.value.set(P.lift || 0x000000);
    U.uGain.value.set(P.gain || 0xffffff);
    U.uDofOn.value = dofOn ? 1 : 0;
    U.uPunch.value = P.punch != null ? P.punch : 1.3;
    if (mode === 'read') {
      pass(finalMat, rOut);
      const px = new Uint8Array(w * h * 4);
      r.readRenderTargetPixels(rOut, 0, 0, w, h, px);
      r.setRenderTarget(null);
      return { w, h, px };
    }
    pass(finalMat, null);
    return null;
  }

  return { setSize, render };
}
