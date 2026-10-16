/* ------------------------------------------------------------------
   Particules : peluches qui flottent dans la lumière, confettis de
   feutrine, feuilles, flocons et pétales qui tombent, lucioles,
   étincelles, gouttes de pluie, bulles. Tout avance image par image.
------------------------------------------------------------------- */
const PTS_VS = `
uniform float uTime; uniform vec3 uBox0; uniform vec3 uBox1; uniform float uSize; uniform float uScale;
uniform vec3 uVel; uniform float uWander; uniform float uTwinkle; uniform vec3 uKeyDir; uniform float uBeam;
attribute vec4 aSeed;
varying float vA; varying float vRot;
void main(){
  vec3 span = uBox1 - uBox0;
  vec3 p = aSeed.xyz * span + uVel * (uTime * (0.55 + aSeed.w * 0.9));
  p = mod(p, span) + uBox0;
  float ph = aSeed.w * 37.0;
  p += vec3(sin(uTime * 0.31 + ph), sin(uTime * 0.23 + ph * 1.7) * 0.6, cos(uTime * 0.27 + ph * 0.7)) * uWander;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float sz = uSize * (0.45 + aSeed.w * 0.9);
  gl_PointSize = max(1.0, sz * uScale / -mv.z);
  float tw = mix(1.0, 0.5 + 0.5 * sin(uTime * (2.0 + aSeed.x * 3.0) + ph), uTwinkle);
  // plus lumineux dans le faisceau de la lampe (uBeam > 0 : faisceau venant de uKeyDir, passant par le centre de la boîte)
  vec3 cen = (uBox0 + uBox1) * 0.5;
  vec3 rel = p - cen;
  float off = length(rel - uKeyDir * dot(rel, uKeyDir)) / (length(span) * 0.25);
  float beam = mix(1.0, 0.15 + 0.85 * smoothstep(1.0, 0.2, off), uBeam);
  vec3 q = (p - uBox0) / span;
  float edge = smoothstep(0.0, 0.08, q.y) * smoothstep(1.0, 0.92, q.y) * smoothstep(0.0, 0.06, q.x) * smoothstep(1.0, 0.94, q.x);
  vA = tw * beam * edge;
  vRot = aSeed.x * 6.283;
}`;
const PTS_FS = `
uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity;
varying float vA; varying float vRot;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float s = sin(vRot), k = cos(vRot);
  c = vec2(c.x * k - c.y * s, c.x * s + c.y * k) + 0.5;
  vec4 t = texture2D(uMap, c);
  gl_FragColor = vec4(uColor * t.rgb, t.a * vA * uOpacity);
}`;

/* nuage de points : peluches, lucioles, étoiles qui scintillent, pluie, bulles */
function pointCloud(V, o = {}) {
  const n = o.n || 80;
  const seeds = new Float32Array(n * 4), pos = new Float32Array(n * 3);
  const r = rng(o.seed || 9);
  for (let i = 0; i < n * 4; i++) seeds[i] = r();
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new T.BufferAttribute(seeds, 4));
  const b0 = v3(...(o.box0 || [-80, 0, -40])), b1 = v3(...(o.box1 || [80, 60, 40]));
  g.boundingSphere = new T.Sphere(b0.clone().add(b1).multiplyScalar(0.5), b0.distanceTo(b1));
  const m = new T.ShaderMaterial({
    vertexShader: PTS_VS, fragmentShader: PTS_FS,
    uniforms: {
      uTime: { value: 0 }, uBox0: { value: b0 }, uBox1: { value: b1 }, uSize: { value: o.size || 1.2 }, uScale: { value: 600 },
      uVel: { value: v3(...(o.vel || [0.4, 0.8, 0.2])) }, uWander: { value: o.wander != null ? o.wander : 2 },
      uTwinkle: { value: o.twinkle || 0 }, uKeyDir: { value: v3(...(o.keyDir || [-0.5, 0.7, 0.5])).normalize() }, uBeam: { value: o.beam || 0 },
      uMap: { value: sprite(o.sprite || 'lint') }, uColor: { value: col(o.color || '#FFFFFF').multiplyScalar(o.glow || 1) }, uOpacity: { value: o.opacity != null ? o.opacity : 0.7 },
    },
    transparent: true, depthWrite: false,
    blending: o.additive === false ? T.NormalBlending : T.AdditiveBlending,
  });
  const P = new T.Points(g, m);
  P.frustumCulled = false;
  P.renderOrder = 5;
  V.scene.add(P);
  const sys = {
    obj: P,
    update(t) {
      m.uniforms.uTime.value = t;
      const [w, h] = V.size;
      const pr = Engine.renderer ? Engine.renderer.getPixelRatio() : 1;
      m.uniforms.uScale.value = (h * pr) / (2 * Math.tan((V.camera.fov * DEG) / 2));
    },
  };
  V.systems.push(sys);
  return sys;
}

/* confettis de feutrine (instances, avec ombre), lancés à la demande */
const CONF_GEO = {};
function confettiGeo(kind) {
  if (CONF_GEO[kind]) return CONF_GEO[kind];
  const sh = kind === 'star' ? starShape(0.9, 0.5) : kind === 'heart' ? heartShape(1.7) : kind === 'leaf' ? leafShape(1.2, 2.2, 0.2) : circleShape(0.75);
  return (CONF_GEO[kind] = feltGeo(sh, 0.16, { bevel: 0.05, curve: 8 }));
}
function confetti(V, o = {}) {
  const kinds = o.kinds || ['disc', 'star', 'heart'];
  const per = o.n || 60;
  const pools = kinds.map((k) => {
    const im = new T.InstancedMesh(confettiGeo(k), wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#7A7A7A' }), per);
    im.castShadow = true;
    im.receiveShadow = false;
    im.frustumCulled = false;
    im.count = 0;
    V.scene.add(im);
    return { im, parts: [] };
  });
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = v3(), c = new T.Color();
  let last = null;
  const floorY = o.floor != null ? o.floor : 0;
  const sys = {
    burst(at, n = 18, colors = Object.values(NOTE_COL), power = 1, spread = 1) {
      for (let i = 0; i < n; i++) {
        const P = pools[Math.floor(Math.random() * pools.length)];
        if (P.parts.length >= per) P.parts.shift();
        const a = Math.random() * TAU, up = 0.6 + Math.random() * 0.8;
        P.parts.push({
          p: v3(at.x, at.y, at.z), v: v3(Math.cos(a) * spread * (8 + Math.random() * 14), up * 34 * power, Math.sin(a) * spread * (5 + Math.random() * 9)),
          r: v3(Math.random() * 6, Math.random() * 6, Math.random() * 6), w: v3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18),
          c: col(colors[i % colors.length]), life: 0, max: 2.4 + Math.random() * 1.4, s: (o.size || 1) * (0.75 + Math.random() * 0.6), land: false,
        });
      }
    },
    rain(box, n = 40, colors = Object.values(NOTE_COL)) {
      for (let i = 0; i < n; i++) {
        const P = pools[i % pools.length];
        if (P.parts.length >= per) P.parts.shift();
        P.parts.push({
          p: v3(lerp(box[0], box[1], Math.random()), box[2] + Math.random() * 30, lerp(box[3], box[4], Math.random())), v: v3((Math.random() - 0.5) * 4, -8 - Math.random() * 6, 0),
          r: v3(Math.random() * 6, Math.random() * 6, Math.random() * 6), w: v3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
          c: col(colors[i % colors.length]), life: -Math.random() * 1.5, max: 6, s: (o.size || 1) * (0.8 + Math.random() * 0.5), land: false,
        });
      }
    },
    update(t) {
      const dt = last == null ? 1 / FPS : clamp(t - last, 0, 0.25);
      last = t;
      for (const P of pools) {
        let k = 0;
        P.parts = P.parts.filter((p) => p.life < p.max);
        for (const p of P.parts) {
          p.life += dt;
          if (p.life < 0) continue;
          if (!p.land) {
            p.v.y -= 38 * dt;
            p.v.multiplyScalar(Math.pow(0.35, dt));
            // les confettis planent un peu : ils se balancent en tombant
            p.p.x += (p.v.x + Math.sin(p.life * 5 + p.r.x) * 3) * dt;
            p.p.y += Math.max(p.v.y, -16) * dt;
            p.p.z += p.v.z * dt;
            p.r.x += p.w.x * dt; p.r.y += p.w.y * dt; p.r.z += p.w.z * dt;
            const fy = o.height ? o.height(p.p.x, p.p.z) : floorY;
            if (p.p.y < fy + 0.2) { p.p.y = fy + 0.15; p.land = true; p.r.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3; p.r.y = 0; }
          }
          const fade = p.max - p.life < 0.5 ? (p.max - p.life) / 0.5 : 1;
          e.set(p.r.x, p.r.y, p.r.z);
          q.setFromEuler(e);
          sc.setScalar(p.s * Math.max(0.01, fade));
          m4.compose(p.p, q, sc);
          P.im.setMatrixAt(k, m4);
          P.im.setColorAt(k, p.c);
          k++;
        }
        P.im.count = k;
        P.im.instanceMatrix.needsUpdate = true;
        if (P.im.instanceColor) P.im.instanceColor.needsUpdate = true;
      }
    },
  };
  V.systems.push(sys);
  return sys;
}

/* chutes continues (feuilles, flocons, pétales) : instances qui bouclent */
function fallers(V, o = {}) {
  const n = o.n || 30;
  const geo = o.geo || confettiGeo(o.kind || 'leaf');
  const im = new T.InstancedMesh(geo, o.mat || wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#7A7A7A' }), n);
  im.castShadow = o.cast !== false;
  im.frustumCulled = false;
  const r = rng(o.seed || 21);
  const box = o.box || [-60, 60, 0, 70, -20, 30];
  const cols = (o.colors || ['#E8743B', '#D9A23A', '#B8452A']).map(col);
  const P = [];
  for (let i = 0; i < n; i++) {
    P.push({ x: lerp(box[0], box[1], r()), z: lerp(box[4], box[5], r()), ph: r(), sp: 0.6 + r() * 0.8, sw: 2 + r() * 4, rot: r() * TAU, s: (o.size || 1) * (0.7 + r() * 0.6) });
    im.setColorAt(i, cols[i % cols.length].clone().multiplyScalar(0.9 + r() * 0.2));
  }
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = v3(), pos = v3();
  V.scene.add(im);
  const H = box[3] - box[2];
  const sys = {
    obj: im,
    on: o.on != null ? o.on : 1,
    update(t) {
      for (let i = 0; i < n; i++) {
        const p = P[i];
        const fall = (o.speed || 6) * p.sp;
        const y = box[3] - ((t * fall + p.ph * H) % H);
        pos.set(p.x + Math.sin(t * 0.9 * p.sp + p.ph * 9) * p.sw, y, p.z + Math.cos(t * 0.7 + p.ph * 5) * 2);
        e.set(Math.sin(t * 1.3 + p.ph * 7) * 1.1, p.rot + t * 0.6, Math.cos(t * 1.1 + p.ph * 3) * 0.9);
        q.setFromEuler(e);
        const vis = i < Math.round(n * sys.on) ? 1 : 0;
        sc.setScalar(p.s * vis);
        m4.compose(pos, q, sc);
        im.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  V.systems.push(sys);
  return sys;
}
