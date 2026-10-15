/* ------------------------------------------------------------------
   Les décors en papier découpé (SVG 1000 × 1000, rognés à l'écran)
   Zone sûre : x 150–850, y 170–830.
------------------------------------------------------------------- */
const Scenes = (() => {
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
  const starPath = (r) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  };
  const sparkle = (r) => `M0 ${-r} L${r * 0.22} ${-r * 0.22} L${r} 0 L${r * 0.22} ${r * 0.22} L0 ${r} L${-r * 0.22} ${r * 0.22} L${-r} 0 L${-r * 0.22} ${-r * 0.22}Z`;
  const cloud = (x, y, s, fill) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-40" cy="8" r="34" fill="${fill}"/><circle cx="0" cy="-10" r="46" fill="${fill}"/><circle cx="46" cy="6" r="36" fill="${fill}"/><rect x="-74" y="8" width="150" height="34" rx="17" fill="${fill}"/></g>`;

  /* --- « notes envolées » : petites formes qui flottent dans le décor --- */
  function floaters(world, n, seed) {
    const r = rng(seed);
    const [x0, y0, x1, y1] = world.area;
    let out = '<g class="floaters">';
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + r() * (x1 - x0));
      const y = Math.round(y0 + r() * (y1 - y0));
      const dl = (r() * -6).toFixed(2), du = (4.5 + r() * 3).toFixed(2), rot = Math.round(r() * 50 - 25);
      out += `<g class="fl" style="transform:translate(${x}px,${y}px)"><g class="fl-in" style="animation-delay:${dl}s;animation-duration:${du}s"><g transform="rotate(${rot})">${world.floater}</g></g></g>`;
    }
    return out + '</g>';
  }

  const W = {};

  /* ============ 1. Ah ! vous dirai-je, maman — la confiserie ============ */
  W.bonbons = {
    color: '#FFC2D3',
    area: [170, 190, 830, 470],
    floater: '<path d="M-12 0 L-26 -11 L-26 11Z M12 0 L26 -11 L26 11Z" fill="#E23D73"/><ellipse rx="14" ry="11" fill="#FFE07A"/><path d="M-6 -8 Q0 0 -6 8 M4 -9 Q10 0 4 9" stroke="#F49C2E" stroke-width="2.5" fill="none"/>',
    draw() {
      const r = rng(7);
      const colors = ['#E23D73', '#FFE07A', '#9FE3C8', '#7DB7F5', '#F49C2E', '#B58CF0', '#FF8FB1'];
      let candies = '';
      for (let row = 0; row < 9; row++) {
        for (let c = 0; c < 8; c++) {
          const x = 360 + c * 40 + (row % 2) * 20 + (r() * 10 - 5);
          const y = 790 - row * 38 + (r() * 8 - 4);
          const col = colors[Math.floor(r() * colors.length)];
          candies += r() < 0.5
            ? `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="19" fill="${col}"/><circle cx="${(x - 6).toFixed(0)}" cy="${(y - 6).toFixed(0)}" r="5" fill="#fff" opacity=".55"/>`
            : `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${Math.round(r() * 60 - 30)})"><path d="M-12 0 L-24 -10 L-24 10Z M12 0 L24 -10 L24 10Z" fill="${col}"/><ellipse rx="15" ry="12" fill="${col}"/><ellipse rx="15" ry="12" fill="#fff" opacity=".18"/></g>`;
        }
      }
      let rain = '';
      for (let i = 0; i < 18; i++) {
        const x = Math.round(80 + r() * 840), col = colors[i % colors.length];
        rain += `<g class="rain-c" style="--x:${x}px;--d:${(r() * 1.6).toFixed(2)}s;--r:${Math.round(r() * 360)}deg"><path d="M-10 0 L-21 -9 L-21 9Z M10 0 L21 -9 L21 9Z" fill="${col}"/><ellipse rx="12" ry="10" fill="${col}"/></g>`;
      }
      let scallops = '';
      for (let x = 0; x < 1000; x += 100) {
        scallops += `<path d="M${x} 150 Q${x + 25} 200 ${x + 50} 150Z" fill="#E23D73"/><path d="M${x + 50} 150 Q${x + 75} 200 ${x + 100} 150Z" fill="#FFF4F7"/>`;
      }
      return `
      <defs>
        <pattern id="bb-stripes" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#FFD6E2"/><rect width="45" height="90" fill="#FFC6D6"/><circle cx="22" cy="20" r="4" fill="#fff" opacity=".6"/><circle cx="67" cy="65" r="4" fill="#fff" opacity=".6"/></pattern>
        <clipPath id="bb-jarclip"><path d="M392 478 Q352 506 352 562 V758 Q352 790 384 790 H616 Q648 790 648 758 V562 Q648 506 608 478 Z"/></clipPath>
        <linearGradient id="bb-glass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".22" stop-color="#fff" stop-opacity=".12"/><stop offset=".78" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient>
      </defs>
      <rect width="1000" height="1000" fill="url(#bb-stripes)"/>
      <g class="pl" style="--d:.4" filter="url(#ps)">
        <rect x="40" y="380" width="230" height="16" rx="6" fill="#B8735A"/>
        <rect x="730" y="380" width="230" height="16" rx="6" fill="#B8735A"/>
        <g transform="translate(95 300)"><rect x="-32" y="0" width="64" height="80" rx="14" fill="#fff" opacity=".7"/><circle cx="-12" cy="58" r="12" fill="#9FE3C8"/><circle cx="12" cy="56" r="12" fill="#E23D73"/><circle cx="0" cy="36" r="12" fill="#FFE07A"/><rect x="-26" y="-12" width="52" height="16" rx="6" fill="#9FE3C8"/></g>
        <g transform="translate(200 310)"><rect x="-28" y="0" width="56" height="70" rx="12" fill="#fff" opacity=".7"/><circle cx="-10" cy="50" r="11" fill="#B58CF0"/><circle cx="11" cy="48" r="11" fill="#F49C2E"/><rect x="-22" y="-10" width="44" height="14" rx="6" fill="#E23D73"/></g>
        <g transform="translate(790 300)"><rect x="-32" y="0" width="64" height="80" rx="14" fill="#fff" opacity=".7"/><circle cx="-12" cy="58" r="12" fill="#7DB7F5"/><circle cx="12" cy="57" r="12" fill="#FFE07A"/><circle cx="-2" cy="36" r="12" fill="#E23D73"/><rect x="-26" y="-12" width="52" height="16" rx="6" fill="#FFE07A"/></g>
        <g transform="translate(900 310)"><rect x="-28" y="0" width="56" height="70" rx="12" fill="#fff" opacity=".7"/><circle cx="-10" cy="50" r="11" fill="#FF8FB1"/><circle cx="11" cy="48" r="11" fill="#9FE3C8"/><rect x="-22" y="-10" width="44" height="14" rx="6" fill="#7DB7F5"/></g>
      </g>
      <g class="pl" style="--d:.2" filter="url(#ps)">
        <path d="M0 0 H1000 V150 H0Z" fill="#E23D73"/>
        ${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 100 + 50}" y="0" width="50" height="150" fill="#FFF4F7"/>`).join('')}
        ${scallops}
      </g>
      <g filter="url(#ps)">
        <path d="M0 800 H1000 V1000 H0Z" fill="#C77B5C"/>
        <rect x="0" y="788" width="1000" height="24" fill="#E39A78"/>
        <rect x="60" y="850" width="250" height="110" rx="18" fill="#B86C4E"/><rect x="375" y="850" width="250" height="110" rx="18" fill="#B86C4E"/><rect x="690" y="850" width="250" height="110" rx="18" fill="#B86C4E"/>
      </g>
      <g class="bb-lolly bb-l1" filter="url(#ps)">
        <rect x="222" y="520" width="16" height="275" rx="8" fill="#FFF7EC"/>
        <circle cx="230" cy="480" r="74" fill="#FFE07A"/>
        <path d="M230 480 m0 -8 a8 8 0 1 1 -8 8 a16 16 0 1 1 16 16 a26 26 0 1 1 -26 -26 a36 36 0 1 1 36 36 a46 46 0 1 1 -46 -46 a56 56 0 1 1 56 56" fill="none" stroke="#E23D73" stroke-width="11" stroke-linecap="round"/>
      </g>
      <g class="bb-lolly bb-l2" filter="url(#ps)">
        <rect x="782" y="540" width="16" height="255" rx="8" fill="#FFF7EC"/>
        <circle cx="790" cy="500" r="80" fill="#9FE3C8"/>
        <path d="M790 500 m0 -8 a8 8 0 1 1 -8 8 a17 17 0 1 1 17 17 a28 28 0 1 1 -28 -28 a39 39 0 1 1 39 39 a50 50 0 1 1 -50 -50 a61 61 0 1 1 61 61" fill="none" stroke="#2BAE88" stroke-width="11" stroke-linecap="round"/>
      </g>
      <g filter="url(#ps)">
        <ellipse cx="130" cy="776" rx="56" ry="18" fill="#B58CF0"/><rect x="74" y="760" width="112" height="14" fill="#FFF4E0"/><ellipse cx="130" cy="752" rx="56" ry="18" fill="#B58CF0"/>
        <ellipse cx="130" cy="728" rx="50" ry="16" fill="#9FE3C8"/><rect x="80" y="714" width="100" height="12" fill="#FFF4E0"/><ellipse cx="130" cy="708" rx="50" ry="16" fill="#9FE3C8"/>
        <ellipse cx="130" cy="686" rx="44" ry="14" fill="#FF8FB1"/><rect x="86" y="674" width="88" height="10" fill="#FFF4E0"/><ellipse cx="130" cy="668" rx="44" ry="14" fill="#FF8FB1"/>
        <path d="M850 790 L880 730 L910 790Z" fill="#FFE07A"/><path d="M880 790 L910 740 L940 790Z" fill="#E23D73"/><path d="M820 790 L846 744 L872 790Z" fill="#7DB7F5"/>
      </g>
      <g class="bb-jar" filter="url(#ps2)">
        <path d="M392 478 Q352 506 352 562 V758 Q352 790 384 790 H616 Q648 790 648 758 V562 Q648 506 608 478 Z" fill="#FFF" opacity=".35"/>
        <g clip-path="url(#bb-jarclip)"><g class="bb-fill">${candies}</g></g>
        <path d="M392 478 Q352 506 352 562 V758 Q352 790 384 790 H616 Q648 790 648 758 V562 Q648 506 608 478 Z" fill="url(#bb-glass)" stroke="#fff" stroke-width="7" stroke-opacity=".85"/>
        <rect x="380" y="440" width="240" height="46" rx="16" fill="#E23D73"/>
        <rect x="380" y="440" width="240" height="14" rx="7" fill="#fff" opacity=".25"/>
        <circle cx="500" cy="428" r="18" fill="#E23D73"/>
        <g transform="translate(500 640) rotate(-4)"><rect x="-74" y="-26" width="148" height="52" rx="10" fill="#FFF8E7"/><text y="10" text-anchor="middle" class="sc-text" font-size="30" fill="#4A1D3A">Bonbons</text></g>
      </g>
      <g class="bb-rain">${rain}</g>`;
    },
  };

  /* ============ 2. Frère Jacques — l'aube au clocher ============ */
  W.aube = {
    color: '#FFB98C',
    area: [160, 190, 840, 470],
    floater: '<path d="M-20 0 Q-10 -12 0 -2 Q10 -12 20 0 Q10 -6 0 4 Q-10 -6 -20 0Z" fill="#4B3B7A"/>',
    draw() {
      const r = rng(3);
      let stars = '';
      for (let i = 0; i < 40; i++) stars += `<circle cx="${Math.round(r() * 1000)}" cy="${Math.round(r() * 560)}" r="${(1.5 + r() * 2.5).toFixed(1)}" fill="#FFF6D8"/>`;
      let trees = '';
      [[90, 840, 46], [170, 860, 36], [870, 845, 50], [950, 860, 38], [780, 880, 30]].forEach(([x, y, s]) => {
        trees += `<rect x="${x - 5}" y="${y}" width="10" height="${s}" fill="#3E2F66"/><circle cx="${x}" cy="${y - s * 0.2}" r="${s}" fill="#4E3E80"/>`;
      });
      return `
      <defs>
        <linearGradient id="au-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7A08C"/><stop offset=".55" stop-color="#FFC995"/><stop offset="1" stop-color="#FFE9BF"/></linearGradient>
        <linearGradient id="au-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E2257"/><stop offset=".6" stop-color="#4B3E86"/><stop offset="1" stop-color="#8A5C9C"/></linearGradient>
      </defs>
      <rect width="1000" height="1000" fill="url(#au-day)"/>
      <g class="au-night"><rect width="1000" height="1000" fill="url(#au-night)"/>${stars}</g>
      <g class="au-sun"><circle cx="290" cy="560" r="175" fill="#FFD45E" opacity=".28"/><circle cx="290" cy="560" r="122" fill="#FFD45E"/></g>
      <g class="pl" style="--d:.3" filter="url(#ps)"><path d="M0 650 Q180 565 360 615 T720 595 T1000 610 V1000 H0Z" fill="#E7A2B4"/></g>
      <g class="pl" style="--d:.6" filter="url(#ps)"><path d="M0 720 Q220 655 430 705 T860 685 T1000 690 V1000 H0Z" fill="#B57CB0"/></g>
      <g class="pl" style="--d:.9" filter="url(#ps)">
        <path d="M300 700 H520 V870 H300Z" fill="#F3DCC4"/>
        <path d="M280 712 L410 615 L540 712Z" fill="#7B4E8F"/>
        <circle cx="410" cy="772" r="54" fill="#3E2E5C"/>
        <g class="au-monk">
          <circle cx="410" cy="796" r="36" fill="#8B5A3C"/>
          <circle cx="410" cy="782" r="24" fill="#F6CDA6"/>
          <path d="M388 770 Q400 744 430 742 L454 724" stroke="#D9475B" stroke-width="16" fill="none" stroke-linecap="round"/>
          <circle cx="456" cy="722" r="9" fill="#fff"/>
          <g class="au-asleep"><path d="M398 784 q5 5 10 0 M414 784 q5 5 10 0" stroke="#3E2E5C" stroke-width="3" fill="none" stroke-linecap="round"/></g>
          <g class="au-awake"><circle cx="403" cy="783" r="4" fill="#3E2E5C"/><circle cx="419" cy="783" r="4" fill="#3E2E5C"/><ellipse cx="411" cy="796" rx="6" ry="7" fill="#3E2E5C"/></g>
        </g>
        <circle cx="410" cy="772" r="54" fill="none" stroke="#C9A98A" stroke-width="11"/>
        <rect x="462" y="796" width="40" height="74" rx="20" fill="#9C6B4E"/>
        <rect x="560" y="330" width="150" height="540" fill="#F6E3CC"/>
        <rect x="560" y="330" width="42" height="540" fill="#E2C7AA"/>
        <path d="M545 338 L635 172 L725 338Z" fill="#5A3F86"/>
        <path d="M635 172 V120 M620 136 H650" stroke="#5A3F86" stroke-width="8" stroke-linecap="round"/>
        <path d="M583 470 V405 A52 52 0 0 1 687 405 V470Z" fill="#3E2E5C"/>
        <rect x="590" y="368" width="90" height="9" rx="4" fill="#6B4A86"/>
        <g class="au-bell">
          <path d="M600 444 C600 400 612 378 635 378 C658 378 670 400 670 444 L682 456 L588 456 Z" fill="#E8AE3C"/>
          <path d="M612 444 C612 410 620 392 632 388" stroke="#F8D57A" stroke-width="7" fill="none" stroke-linecap="round"/>
          <circle cx="635" cy="463" r="8" fill="#B7812A"/>
        </g>
        <circle cx="635" cy="560" r="32" fill="#FFF8EE" stroke="#C9A98A" stroke-width="6"/>
        <path d="M635 560 V538 M635 560 L650 568" stroke="#3E2E5C" stroke-width="5" stroke-linecap="round"/>
        <path d="M612 700 V660 A23 23 0 0 1 658 660 V700Z" fill="#3E2E5C"/>
      </g>
      <g class="pl" style="--d:1.2" filter="url(#ps)"><path d="M0 830 Q250 770 520 828 T1000 806 V1000 H0Z" fill="#6A4C93"/>${trees}</g>
      <g class="au-zzz sc-text" fill="#fff"><text x="470" y="700" font-size="34">Z</text><text x="500" y="664" font-size="26">z</text><text x="522" y="636" font-size="20">z</text></g>
      <g class="au-ding sc-text" fill="#FFF8E0" stroke="#5A3F86" stroke-width="6" paint-order="stroke">
        <text x="700" y="300" font-size="52">Ding&#160;!</text><text x="430" y="330" font-size="52">Daing&#160;!</text><text x="720" y="470" font-size="52">Dong&#160;!</text>
      </g>`;
    },
  };

  /* ============ 3. Au clair de la lune — nuit de Pierrot ============ */
  W.lune = {
    color: '#1E2A66',
    area: [170, 200, 830, 480],
    floater: `<path d="${sparkle(13)}" fill="#FFF2B8"/>`,
    draw(song) {
      const r = rng(11);
      let stars = '';
      const n = song.notes.length;
      for (let i = 0; i < n; i++) {
        let x, y, tries = 0;
        do { x = 40 + r() * 920; y = 40 + r() * 470; tries++; } while (tries < 20 && Math.hypot(x - 700, y - 270) < 150);
        stars += `<path class="lu-star" d="${starPath(7 + r() * 7)}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})" fill="#FFF1A8"/>`;
      }
      let roofs = '';
      [[0, 600, 120], [110, 560, 140], [240, 610, 90], [600, 590, 150], [740, 548, 120], [850, 600, 160]].forEach(([x, y, w]) => {
        roofs += `<path d="M${x} ${y} L${x + w / 2} ${y - 60} L${x + w} ${y} V1000 H${x}Z" fill="#232D6B"/><rect x="${x + w * 0.62}" y="${y - 70}" width="18" height="44" fill="#232D6B"/>`;
        roofs += `<rect x="${x + w * 0.25}" y="${y + 40}" width="18" height="26" rx="3" fill="${r() < 0.35 ? '#F6D47A' : '#38448C'}"/><rect x="${x + w * 0.6}" y="${y + 40}" width="18" height="26" rx="3" fill="${r() < 0.3 ? '#F6D47A' : '#38448C'}"/>`;
      });
      return `
      <defs>
        <radialGradient id="lu-sky" cx=".7" cy=".25" r=".9"><stop offset="0" stop-color="#2D3A86"/><stop offset=".55" stop-color="#18215A"/><stop offset="1" stop-color="#0D1238"/></radialGradient>
        <radialGradient id="lu-glow"><stop offset="0" stop-color="#FFF6CF" stop-opacity=".5"/><stop offset="1" stop-color="#FFF6CF" stop-opacity="0"/></radialGradient>
        <radialGradient id="lu-warm"><stop offset="0" stop-color="#FFD877" stop-opacity=".95"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1000" height="1000" fill="url(#lu-sky)"/>
      <g class="lu-stars">${stars}</g>
      <circle cx="700" cy="270" r="240" fill="url(#lu-glow)"/>
      <g class="lu-moon pl" style="--d:.2" filter="url(#ps)">
        <circle cx="700" cy="270" r="106" fill="#F7F1D4"/>
        <circle cx="662" cy="236" r="17" fill="#ECE2B8"/><circle cx="742" cy="312" r="22" fill="#ECE2B8"/><circle cx="738" cy="226" r="10" fill="#ECE2B8"/>
        <g class="lu-sleep"><path d="M664 276 q12 10 24 0 M712 276 q12 10 24 0" stroke="#B7A877" stroke-width="5" fill="none" stroke-linecap="round"/></g>
        <g class="lu-smile"><circle cx="676" cy="272" r="7" fill="#7A6A3D"/><circle cx="724" cy="272" r="7" fill="#7A6A3D"/><path d="M676 302 Q700 324 724 302" stroke="#7A6A3D" stroke-width="6" fill="none" stroke-linecap="round"/></g>
      </g>
      <g class="pl" style="--d:.5" filter="url(#ps)">${roofs}</g>
      <g class="pl" style="--d:.9" filter="url(#ps)">
        <rect x="230" y="560" width="320" height="440" fill="#2F3B80"/>
        <path d="M205 572 L390 462 L575 572Z" fill="#1B2357"/>
        <rect x="455" y="470" width="40" height="70" fill="#1B2357"/>
        <rect x="300" y="628" width="180" height="160" rx="10" fill="#141B45"/>
        <rect class="lu-lit" x="300" y="628" width="180" height="160" rx="10" fill="url(#lu-warm)"/>
        <g class="lu-pierrot">
          <path d="M338 788 Q338 712 390 708 Q442 712 442 788Z" fill="#F2F2F7"/>
          <circle cx="390" cy="740" r="7" fill="#1B1B2A"/><circle cx="390" cy="768" r="7" fill="#1B1B2A"/>
          <path d="M352 712 q9 -12 19 0 q9 -12 19 0 q9 -12 19 0 q9 -12 19 0 q9 -12 19 0 q-47 16 -95 0Z" fill="#fff" stroke="#C9D3F2" stroke-width="2"/>
          <circle cx="390" cy="676" r="28" fill="#FBF7F2"/>
          <path d="M362 672 A28 28 0 0 1 418 672 Z" fill="#1B1B2A"/>
          <g class="lu-sad"><path d="M375 684 q5 -4 10 0 M396 684 q5 -4 10 0" stroke="#1B1B2A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M380 700 q10 -6 20 0" stroke="#1B1B2A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M404 690 q-4 9 0 12 q4 -3 0 -12Z" fill="#7FB2FF"/></g>
          <g class="lu-happy"><circle cx="380" cy="684" r="4" fill="#1B1B2A"/><circle cx="401" cy="684" r="4" fill="#1B1B2A"/><path d="M378 696 q12 12 24 0" stroke="#1B1B2A" stroke-width="3" fill="none" stroke-linecap="round"/></g>
          <path d="M436 742 L470 690" stroke="#F2F2F7" stroke-width="16" stroke-linecap="round"/>
          <path d="M466 700 Q486 650 520 618 Q500 662 474 704Z" fill="#F7E7B4"/>
        </g>
        <rect x="288" y="782" width="204" height="18" rx="6" fill="#4A57A6"/>
        <ellipse cx="456" cy="782" rx="22" ry="6" fill="#C9A24A"/>
        <rect x="449" y="742" width="14" height="40" rx="3" fill="#F3E9D2"/>
        <path d="M456 742 V734" stroke="#333" stroke-width="2"/>
        <g class="lu-flame"><circle cx="456" cy="722" r="26" fill="url(#lu-warm)"/><path d="M456 712 Q466 724 456 735 Q446 724 456 712Z" fill="#FFC94A"/></g>
        <rect x="610" y="650" width="280" height="350" fill="#263170"/>
        <path d="M590 660 L750 560 L910 660Z" fill="#1A2152"/>
        <path d="M700 1000 V880 A50 50 0 0 1 800 880 V1000Z" fill="#1A2152"/>
        <path class="lu-door" d="M700 1000 V880 A50 50 0 0 1 800 880 V1000Z" fill="url(#lu-warm)"/>
        <circle cx="786" cy="940" r="6" fill="#C9A24A"/>
        <rect x="660" y="720" width="50" height="60" rx="6" fill="#141B45"/><rect x="790" y="720" width="50" height="60" rx="6" fill="#141B45"/>
      </g>
      <path d="M0 910 Q500 880 1000 910 V1000 H0Z" fill="#111640"/>`;
    },
  };

  /* ============ 4. Une souris verte — la prairie ============ */
  W.prairie = {
    color: '#9FD98A',
    area: [160, 200, 840, 480],
    floater: '<path d="M0 0 C-14 -20 -28 -6 -19 5 C-14 11 -6 6 0 0Z M0 0 C14 -20 28 -6 19 5 C14 11 6 6 0 0Z" fill="#F7A6C4"/><path d="M0 -9 V9" stroke="#3B2E3A" stroke-width="3" stroke-linecap="round"/>',
    draw() {
      const r = rng(5);
      let blades = 'M0 770';
      for (let x = 0; x <= 1000; x += 25) blades += ` L${x + 12} ${720 + Math.round(r() * 30)} L${x + 25} ${768 + Math.round(r() * 8)}`;
      blades += ' V1000 H0Z';
      let blades2 = 'M0 860';
      for (let x = 0; x <= 1000; x += 30) blades2 += ` L${x + 15} ${800 + Math.round(r() * 40)} L${x + 30} ${858 + Math.round(r() * 8)}`;
      blades2 += ' V1000 H0Z';
      let daisies = '';
      [[150, 650], [230, 690], [880, 640], [960, 680], [610, 655], [90, 700]].forEach(([x, y]) => {
        let petals = '';
        for (let k = 0; k < 8; k++) petals += `<ellipse cx="0" cy="-11" rx="5" ry="10" fill="#fff" transform="rotate(${k * 45})"/>`;
        daisies += `<path d="M${x} ${y} V${y + 60}" stroke="#4E9A47" stroke-width="4"/><g transform="translate(${x} ${y})">${petals}<circle r="6" fill="#F6C343"/></g>`;
      });
      let poppies = '';
      [[70, 800], [300, 820], [700, 810], [920, 790]].forEach(([x, y]) => {
        poppies += `<path d="M${x} ${y} V${y + 120}" stroke="#2E7D43" stroke-width="5"/><circle cx="${x}" cy="${y}" r="20" fill="#E5484D"/><circle cx="${x}" cy="${y}" r="7" fill="#2B1B1B"/>`;
      });
      return `
      <defs><linearGradient id="pr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9DDF3"/><stop offset="1" stop-color="#EAF8F1"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#pr-sky)"/>
      <g class="pr-sun"><circle cx="830" cy="200" r="70" fill="#FFD54F"/>${Array.from({ length: 12 }, (_, i) => `<rect x="826" y="94" width="8" height="34" rx="4" fill="#FFD54F" transform="rotate(${i * 30} 830 200)"/>`).join('')}</g>
      <g class="pr-cloud pl" style="--d:.2">${cloud(240, 250, 1, '#fff')}${cloud(600, 170, 0.75, '#fff')}</g>
      <g class="pl" style="--d:.4" filter="url(#ps)"><path d="M0 570 Q250 470 520 545 T1000 525 V1000 H0Z" fill="#A8DB86"/></g>
      <g class="pr-sirs">
        <g transform="translate(700 560)"><circle r="30" fill="#F3D1B3"/><circle cx="-9" cy="-4" r="3.5" fill="#2E2A3A"/><circle cx="10" cy="-4" r="7" fill="none" stroke="#C9A24A" stroke-width="3"/><circle cx="10" cy="-4" r="3" fill="#2E2A3A"/><rect x="-26" y="-36" width="52" height="10" rx="3" fill="#2E2A3A"/><rect x="-18" y="-82" width="36" height="50" rx="4" fill="#2E2A3A"/><rect x="-18" y="-46" width="36" height="8" fill="#B4232B"/></g>
        <g transform="translate(790 572)"><circle r="28" fill="#EBC3A0"/><circle cx="-8" cy="-4" r="3.5" fill="#2E2A3A"/><circle cx="9" cy="-4" r="3.5" fill="#2E2A3A"/><path d="M-12 8 q12 -6 24 0" stroke="#5A3A2A" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="-25" y="-34" width="50" height="10" rx="3" fill="#3B3550"/><rect x="-17" y="-78" width="34" height="48" rx="4" fill="#3B3550"/></g>
      </g>
      <g class="pl" style="--d:.7" filter="url(#ps)"><path d="M0 650 Q300 580 600 640 T1000 620 V1000 H0Z" fill="#74C35E"/>${daisies}</g>
      <g class="pl" style="--d:1" filter="url(#ps)"><path d="${blades}" fill="#43A65A"/></g>
      <g class="pr-mouse-pos">
        <g class="pr-mouse" filter="url(#ps)">
          <path d="M-62 -26 Q-120 -14 -112 -60 Q-108 -80 -92 -78" stroke="#6CB96C" stroke-width="7" fill="none" stroke-linecap="round"/>
          <ellipse cx="-10" cy="-38" rx="62" ry="38" fill="#7CCB7C"/>
          <ellipse cx="-22" cy="-30" rx="34" ry="20" fill="#93D893"/>
          <circle cx="44" cy="-58" r="30" fill="#86D486"/>
          <circle cx="32" cy="-92" r="19" fill="#86D486"/><circle cx="32" cy="-92" r="10" fill="#F6A6B8"/>
          <circle cx="56" cy="-62" r="5.5" fill="#1E2B22"/><circle cx="58" cy="-64" r="2" fill="#fff"/>
          <circle cx="74" cy="-52" r="6" fill="#F28AA0"/>
          <path d="M70 -46 L96 -42 M70 -50 L96 -56" stroke="#3E6E3E" stroke-width="2"/>
          <ellipse cx="22" cy="-4" rx="14" ry="6" fill="#F6A6B8"/><ellipse cx="-38" cy="-4" rx="14" ry="6" fill="#F6A6B8"/>
        </g>
        <g class="pr-snail" filter="url(#ps)">
          <path d="M-90 -4 Q-96 -26 -60 -26 H54 Q78 -30 84 -66 L90 -86 M84 -66 L100 -84" stroke="#9CCB78" stroke-width="10" fill="none" stroke-linecap="round"/>
          <path d="M-96 0 Q-90 -30 -50 -30 H60 Q86 -34 90 -70 Q96 -60 92 -34 Q86 0 60 0Z" fill="#B6DB8E"/>
          <circle cx="90" cy="-88" r="6" fill="#2E3A2A"/><circle cx="102" cy="-86" r="6" fill="#2E3A2A"/>
          <circle cx="-14" cy="-70" r="52" fill="#E8935B"/>
          <path d="M-14 -70 m0 -6 a6 6 0 1 1 -6 6 a14 14 0 1 1 14 14 a24 24 0 1 1 -24 -24 a34 34 0 1 1 34 34" fill="none" stroke="#B8602E" stroke-width="7" stroke-linecap="round"/>
          <g class="pr-steam" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"><path d="M-40 -136 q-12 -16 0 -32 q12 -16 0 -32"/><path d="M-12 -140 q-12 -16 0 -32 q12 -16 0 -32"/><path d="M16 -136 q-12 -16 0 -32 q12 -16 0 -32"/></g>
        </g>
        <g class="pr-puff"><circle cx="-30" cy="-60" r="40" fill="#fff"/><circle cx="20" cy="-80" r="46" fill="#fff"/><circle cx="50" cy="-40" r="36" fill="#fff"/><circle cx="-10" cy="-20" r="34" fill="#fff"/></g>
      </g>
      <g filter="url(#ps)"><path d="${blades2}" fill="#2E8549"/>${poppies}</g>`;
    },
  };

  /* ============ 5. Promenons-nous dans les bois — le bois du loup ============ */
  W.foret = {
    color: '#2F7A57',
    area: [160, 200, 840, 520],
    floater: '<path d="M-17 8 C-15 -11 4 -17 17 -13 C15 6 -2 15 -17 8Z" fill="#A7D46F"/><path d="M-15 7 L13 -10" stroke="#5E8E3F" stroke-width="2.5"/>',
    draw() {
      const r = rng(13);
      let far = '';
      for (let i = 0; i < 9; i++) {
        const x = 40 + i * 120 + r() * 40;
        far += `<rect x="${(x - 16).toFixed(0)}" y="300" width="32" height="700" fill="#5D9B71"/><circle cx="${x.toFixed(0)}" cy="${(250 + r() * 80).toFixed(0)}" r="${(90 + r() * 40).toFixed(0)}" fill="#6FAE80"/>`;
      }
      let ferns = '';
      [[60, 900], [180, 940], [880, 920], [960, 960], [520, 960]].forEach(([x, y]) => {
        ferns += `<g transform="translate(${x} ${y})">${[-50, -25, 0, 25, 50].map((a) => `<path d="M0 0 Q${a * 0.6} -60 ${a * 1.6} -110" stroke="#2C6E45" stroke-width="16" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
      });
      return `
      <defs>
        <linearGradient id="fo-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D3EBBE"/><stop offset=".55" stop-color="#86BF8F"/><stop offset="1" stop-color="#3E7A5A"/></linearGradient>
        <linearGradient id="fo-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8C9" stop-opacity=".55"/><stop offset="1" stop-color="#FFF8C9" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="1000" height="1000" fill="url(#fo-bg)"/>
      <g class="fo-rays"><path d="M180 0 L280 0 L520 900 L360 900Z" fill="url(#fo-ray)"/><path d="M420 0 L480 0 L700 900 L600 900Z" fill="url(#fo-ray)"/></g>
      <g class="pl" style="--d:.25" opacity=".85">${far}</g>
      <g class="pl" style="--d:.55" filter="url(#ps)">
        <path d="M0 700 Q300 640 520 690 T1000 670 V1000 H0Z" fill="#4F9A69"/>
        <path d="M430 1000 Q470 860 560 790 Q620 740 600 690 L640 690 Q670 760 600 820 Q520 900 540 1000Z" fill="#D9C79A"/>
        <rect x="96" y="250" width="58" height="750" fill="#5A3E2A"/><circle cx="125" cy="230" r="150" fill="#2F7A4E"/><circle cx="40" cy="300" r="90" fill="#3A8A59"/>
        <rect x="880" y="200" width="62" height="800" fill="#5A3E2A"/><circle cx="910" cy="190" r="160" fill="#2F7A4E"/>
      </g>
      <g class="fo-kids pl" style="--d:.8" filter="url(#ps)"><g class="fo-run">
        ${[[230, '#E5484D', '#F6CFA8'], [300, '#3E6FD8', '#E7B08A'], [370, '#F5C32C', '#F6CFA8']].map(([x, c, s], i) => `<g class="fo-kid" style="animation-delay:${-i * 0.25}s"><path d="M${x - 22} 860 L${x} 790 L${x + 22} 860Z" fill="${c}"/><circle cx="${x}" cy="774" r="17" fill="${s}"/><path d="M${x - 14} 770 q14 -20 28 0" fill="#5A3A2A"/><path d="M${x - 20} 806 L${x - 36} 826 M${x + 20} 806 L${x + 36} 826" stroke="${s}" stroke-width="7" stroke-linecap="round"/><path d="M${x - 9} 860 V884 M${x + 9} 860 V884" stroke="#3B2A22" stroke-width="7" stroke-linecap="round"/></g>`).join('')}
      </g></g>
      <g class="fo-wolf-wrap">
        <g class="fo-wolf" filter="url(#ps)">
          <path d="M-60 120 Q-70 40 -10 20 L40 20 Q90 40 80 120Z" fill="#6E7C8C"/>
          <g class="fo-shirt"><path d="M-46 120 Q-52 60 -6 44 L30 44 Q72 60 64 120Z" fill="#F2F2F2"/><path d="M-6 44 L12 70 L30 44" fill="#E5484D"/></g>
          <g class="fo-pants"><path d="M-48 112 H66 L60 170 H22 L12 140 L2 170 H-36Z" fill="#E5484D"/></g>
          <g class="fo-boots"><rect x="-36" y="166" width="34" height="34" rx="8" fill="#3B2A22"/><rect x="22" y="166" width="38" height="34" rx="8" fill="#3B2A22"/></g>
          <path d="M-30 -40 L-48 -100 L-4 -66Z" fill="#6E7C8C"/><path d="M50 -40 L70 -100 L24 -66Z" fill="#6E7C8C"/>
          <path d="M-34 -50 L-40 -84 L-14 -62Z" fill="#E7B4B4"/><path d="M52 -50 L58 -84 L34 -62Z" fill="#E7B4B4"/>
          <ellipse cx="10" cy="-20" rx="58" ry="52" fill="#7D8A99"/>
          <path d="M-30 -2 Q10 60 50 -2 Q10 22 -30 -2Z" fill="#E9EDF1"/>
          <ellipse cx="10" cy="8" rx="15" ry="11" fill="#2A2F38"/>
          <circle cx="-14" cy="-30" r="8" fill="#fff"/><circle cx="34" cy="-30" r="8" fill="#fff"/>
          <circle cx="-12" cy="-29" r="4.5" fill="#2A2F38"/><circle cx="32" cy="-29" r="4.5" fill="#2A2F38"/>
          <path d="M-2 26 Q10 36 22 26" stroke="#2A2F38" stroke-width="4" fill="none" stroke-linecap="round"/>
          <g class="fo-hat"><path d="M-46 -64 H66 L52 -80 H-32Z" fill="#3B2A22"/><rect x="-26" y="-124" width="64" height="48" rx="8" fill="#3B2A22"/><rect x="-26" y="-92" width="64" height="12" fill="#E5484D"/></g>
          <g class="fo-arms"><path d="M-56 60 L-96 0" stroke="#6E7C8C" stroke-width="20" stroke-linecap="round"/><path d="M74 60 L114 0" stroke="#6E7C8C" stroke-width="20" stroke-linecap="round"/></g>
        </g>
      </g>
      <g class="pl" style="--d:.9" filter="url(#ps)">
        <rect x="640" y="330" width="130" height="670" fill="#6B4A35"/><path d="M660 420 q20 30 0 60 M740 520 q-20 30 0 70 M680 700 q24 40 0 80" stroke="#4E3526" stroke-width="7" fill="none"/>
        <circle cx="705" cy="300" r="140" fill="#3F8A5A"/><circle cx="610" cy="350" r="80" fill="#4E9A69"/><circle cx="800" cy="360" r="90" fill="#367E52"/>
      </g>
      <g filter="url(#ps)">${ferns}
        <g transform="translate(150 880)"><rect x="-8" y="0" width="16" height="36" rx="6" fill="#F4EBDD"/><path d="M-34 4 Q0 -46 34 4Z" fill="#D9473A"/><circle cx="-12" cy="-12" r="5" fill="#fff"/><circle cx="10" cy="-18" r="4" fill="#fff"/></g>
        <g transform="translate(820 900) scale(.8)"><rect x="-8" y="0" width="16" height="36" rx="6" fill="#F4EBDD"/><path d="M-34 4 Q0 -46 34 4Z" fill="#D9473A"/><circle cx="-12" cy="-12" r="5" fill="#fff"/><circle cx="12" cy="-16" r="4" fill="#fff"/></g>
      </g>
      <g class="fo-bubble-kids"><rect class="bub-bg" x="190" y="566" width="300" height="70" rx="24" fill="#FFFDF5" stroke="#1F4A35" stroke-width="5"/><path d="M300 632 L290 680 L334 632Z" fill="#FFFDF5" stroke="#1F4A35" stroke-width="5" stroke-linejoin="round"/><path d="M297 630 H336" stroke="#FFFDF5" stroke-width="8"/><text class="bub-t sc-text" x="340" y="612" text-anchor="middle" font-size="32" fill="#1F4A35">Loup, y es-tu&#160;?</text></g>
      <g class="fo-bubble-wolf"><rect class="bub-bg" x="420" y="300" width="360" height="72" rx="24" fill="#FFFDF5" stroke="#1F4A35" stroke-width="5"/><path d="M612 368 L598 426 L652 368Z" fill="#FFFDF5" stroke="#1F4A35" stroke-width="5" stroke-linejoin="round"/><path d="M608 366 H655" stroke="#FFFDF5" stroke-width="8"/><text class="fo-say bub-t sc-text" x="610" y="347" text-anchor="middle" font-size="30" fill="#1F4A35">Je mets ma culotte&#160;!</text></g>`;
    },
  };

  /* ============ 6. Sur le pont d'Avignon — Provence ============ */
  W.provence = {
    color: '#9C82D8',
    area: [160, 180, 840, 420],
    floater: '<ellipse rx="6" ry="13" fill="#9B7FD9"/><ellipse cx="9" cy="-4" rx="5" ry="11" fill="#B9A1EE" transform="rotate(35)"/>',
    draw() {
      let rows = '';
      for (let i = 0; i < 9; i++) {
        const xb = -500 + i * 250;
        rows += `<path d="M${500 + (i - 4) * 46} 790 L${500 + (i - 4) * 58} 790 L${xb + 120} 1000 L${xb} 1000Z" fill="${i % 2 ? '#8E6CCB' : '#7A58BC'}"/>`;
      }
      const dancer = (x, body, skin, cls, i) => `<g class="pv-dancer ${cls}" style="--i:${i}"><g class="pv-dancer-in"><path d="M${x - 20} 540 L${x} 486 L${x + 20} 540Z" fill="${body}"/><circle cx="${x}" cy="472" r="14" fill="${skin}"/><path d="M${x - 16} 500 L${x - 32} 476 M${x + 16} 500 L${x + 32} 476" stroke="${skin}" stroke-width="6" stroke-linecap="round"/><path d="M${x - 12} 466 q12 -18 24 0" fill="#4A2E1F"/></g></g>`;
      return `
      <defs><linearGradient id="pv-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ED3F2"/><stop offset=".65" stop-color="#DDF1EA"/><stop offset="1" stop-color="#FFE3A3"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#pv-sky)"/>
      <g class="pv-sun"><circle cx="800" cy="220" r="78" fill="#FFCB3D"/>${Array.from({ length: 10 }, (_, i) => `<path d="M800 110 L812 132 L788 132Z" fill="#FFCB3D" transform="rotate(${i * 36} 800 220)"/>`).join('')}</g>
      <g class="pl" style="--d:.2"><path d="M0 560 Q200 500 420 540 T820 520 T1000 540 V700 H0Z" fill="#B9D0DF"/></g>
      <g class="pl" style="--d:.35" filter="url(#ps)">
        <path d="M40 600 V420 H80 V400 H100 V420 H130 V360 H150 V340 H170 V360 H200 V430 H250 V380 H270 V365 H290 V380 H320 V600Z" fill="#EBC896"/>
        <path d="M200 600 V470 H330 V600Z" fill="#E0B984"/>
        <rect x="90" y="450" width="14" height="30" rx="7" fill="#C49A62"/><rect x="160" y="400" width="14" height="30" rx="7" fill="#C49A62"/><rect x="270" y="420" width="14" height="30" rx="7" fill="#C49A62"/>
        <circle cx="360" cy="560" r="50" fill="#6E9B56"/><circle cx="410" cy="580" r="40" fill="#5E8B48"/>
      </g>
      <rect x="0" y="600" width="1000" height="200" fill="#4BA4D8"/>
      <g class="pv-waves" stroke="#8FD0EE" stroke-width="6" fill="none" stroke-linecap="round">
        <path d="M60 650 q20 -10 40 0 M300 700 q20 -10 40 0 M600 660 q20 -10 40 0 M820 720 q20 -10 40 0 M180 760 q20 -10 40 0 M720 770 q20 -10 40 0"/>
      </g>
      <g class="pl" style="--d:.6" filter="url(#ps)">
        <path d="M30 540 H760 L772 556 L756 570 L770 586 L758 602 L768 618 L756 640 V706 H30Z
                 M70 706 V650 A64 64 0 0 1 198 650 V706Z M250 706 V650 A64 64 0 0 1 378 650 V706Z M430 706 V650 A64 64 0 0 1 558 650 V706Z M610 706 V650 A64 64 0 0 1 738 650 V706Z" fill="#E9B86B" fill-rule="evenodd"/>
        <path d="M30 540 H760 V556 H30Z" fill="#D9A256"/>
        <path d="M70 706 V650 A64 64 0 0 1 198 650 V706Z M250 706 V650 A64 64 0 0 1 378 650 V706Z M430 706 V650 A64 64 0 0 1 558 650 V706Z M610 706 V650 A64 64 0 0 1 738 650 V706Z" fill="#2F7DB0" opacity=".55"/>
        <path d="M210 540 V470 H290 V540Z" fill="#E2B572"/><path d="M200 474 L250 432 L300 474Z" fill="#B5653D"/><path d="M236 440 V410 H264 V440Z" fill="#E2B572"/><circle cx="250" cy="424" r="6" fill="#8A5A2E"/>
        <rect x="234" y="496" width="32" height="44" rx="16" fill="#8A5A2E"/>
      </g>
      <g class="pv-dancers">
        ${dancer(360, '#E5484D', '#F6CFA8', 'd1', 0)}${dancer(450, '#3E6FD8', '#E7B08A', 'd2', 1)}${dancer(540, '#F5C32C', '#F6CFA8', 'd3', 2)}${dancer(630, '#4CAF5A', '#E7B08A', 'd4', 3)}
      </g>
      <g class="pl" style="--d:1" filter="url(#ps)">
        <path d="M0 790 H1000 V1000 H0Z" fill="#6FA35A"/>
        ${rows}
        <path d="M900 800 Q870 620 905 470 Q940 620 912 800Z" fill="#2E6B3E"/><path d="M960 820 Q935 660 965 540 Q995 660 970 820Z" fill="#245A33"/>
        <path d="M70 830 Q50 700 80 600 Q110 700 90 830Z" fill="#2E6B3E"/>
      </g>`;
    },
  };

  /* ============ 7. Le bon roi Dagobert — au château ============ */
  W.chateau = {
    color: '#C2333B',
    area: [170, 190, 830, 430],
    floater: `<path d="${sparkle(15)}" fill="#F7C548"/><circle r="3" fill="#fff"/>`,
    draw() {
      let floor = '';
      for (let row = 0; row < 6; row++) {
        const y0 = 780 + row * 40, y1 = y0 + 40, w0 = 1000 + row * 260, w1 = w0 + 260, n = 10;
        for (let c = 0; c < n; c++) {
          const xa0 = 500 - w0 / 2 + (c * w0) / n, xb0 = xa0 + w0 / n;
          const xa1 = 500 - w1 / 2 + (c * w1) / n, xb1 = xa1 + w1 / n;
          floor += `<path d="M${xa0.toFixed(0)} ${y0} L${xb0.toFixed(0)} ${y0} L${xb1.toFixed(0)} ${y1} L${xa1.toFixed(0)} ${y1}Z" fill="${(row + c) % 2 ? '#5B2A6E' : '#F0D9A8'}"/>`;
        }
      }
      let blocks = '';
      for (let y = 40; y < 780; y += 60) for (let x = (y / 60) % 2 ? -60 : 0; x < 1000; x += 120) blocks += `<rect x="${x}" y="${y}" width="120" height="60" fill="none" stroke="#E2C07F" stroke-width="3"/>`;
      const lys = (x, y) => `<path transform="translate(${x} ${y})" d="M0 -40 Q14 -20 6 0 Q24 -12 30 4 Q18 8 8 6 L8 14 H-8 L-8 6 Q-18 8 -30 4 Q-24 -12 -6 0 Q-14 -20 0 -40Z M-16 14 H16 V22 H-16Z" fill="#F2B33D"/>`;
      return `
      <rect width="1000" height="1000" fill="#F4D9A3"/>
      ${blocks}
      <g class="pl" style="--d:.2">
        <path d="M430 430 V250 A70 70 0 0 1 570 250 V430Z" fill="#A9D7F0"/><path d="M500 180 V430 M430 300 H570" stroke="#C9A06A" stroke-width="10"/>
        <path d="M430 430 V250 A70 70 0 0 1 570 250 V430Z" fill="none" stroke="#C9A06A" stroke-width="14"/>
      </g>
      <g class="pl dg-banners" style="--d:.35" filter="url(#ps)">
        <path d="M190 90 H290 V420 L240 380 L190 420Z" fill="#B4232B"/>${lys(240, 230)}
        <path d="M710 90 H810 V420 L760 380 L710 420Z" fill="#B4232B"/>${lys(760, 230)}
        <rect x="170" y="80" width="140" height="14" rx="7" fill="#C9A06A"/><rect x="690" y="80" width="140" height="14" rx="7" fill="#C9A06A"/>
      </g>
      <g class="pl" style="--d:.4" filter="url(#ps)">
        <path d="M390 780 V420 Q500 360 610 420 V780Z" fill="#E8B33C"/><path d="M420 780 V460 Q500 410 580 460 V780Z" fill="#B4232B"/>
        <circle cx="390" cy="418" r="18" fill="#E8B33C"/><circle cx="610" cy="418" r="18" fill="#E8B33C"/>
      </g>
      <g filter="url(#ps)">${floor}</g>
      <g class="pl" style="--d:.9" filter="url(#ps)">
        <g class="dg-eloi">
          <path d="M700 900 L730 600 H830 L860 900Z" fill="#4E8F6E"/><path d="M770 600 V900" stroke="#F2B33D" stroke-width="12"/>
          <circle cx="780" cy="560" r="40" fill="#F3CFAE"/>
          <path d="M748 572 Q780 640 812 572 Q780 596 748 572Z" fill="#E8E8EE"/>
          <circle cx="766" cy="552" r="4.5" fill="#3B2416"/><circle cx="794" cy="552" r="4.5" fill="#3B2416"/>
          <path d="M744 530 L780 430 L816 530Z" fill="#FFFDF5"/><path d="M780 430 V530 M752 500 H808" stroke="#F2B33D" stroke-width="7"/>
          <path d="M880 960 V520 Q880 470 920 470 Q960 470 960 510 Q960 540 930 540" stroke="#F2B33D" stroke-width="12" fill="none" stroke-linecap="round"/>
          <path class="dg-point" d="M730 680 L640 700" stroke="#F3CFAE" stroke-width="18" stroke-linecap="round"/>
        </g>
        <g class="dg-king">
          <path d="M370 920 Q360 660 420 560 H580 Q640 660 630 920Z" fill="#B4232B"/>
          <path d="M370 920 Q360 660 420 560 L400 920Z" fill="#fff"/><path d="M630 920 Q640 660 580 560 L600 920Z" fill="#fff"/>
          <circle cx="388" cy="700" r="4" fill="#222"/><circle cx="392" cy="800" r="4" fill="#222"/><circle cx="612" cy="720" r="4" fill="#222"/><circle cx="608" cy="840" r="4" fill="#222"/>
          <path d="M440 580 H560 L572 720 H428Z" fill="#2E8B57"/>
          <rect x="462" y="822" width="28" height="76" fill="#F7F7F7"/><rect x="510" y="822" width="28" height="76" fill="#F7F7F7"/>
          <path d="M452 900 H494 V920 H442Z" fill="#3B2416"/><path d="M506 900 H548 L558 920 H506Z" fill="#3B2416"/>
          <g class="dg-culotte">
            <path d="M432 708 H568 V726 H432Z" fill="#23408E"/>
            <path d="M432 724 Q414 780 444 826 H496 L500 760 L504 826 H556 Q586 780 568 724Z" fill="#3E6FD8"/>
            <circle cx="452" cy="760" r="6" fill="#fff"/><circle cx="476" cy="790" r="6" fill="#fff"/><circle cx="530" cy="770" r="6" fill="#fff"/><circle cx="552" cy="800" r="6" fill="#fff"/><circle cx="515" cy="810" r="5" fill="#fff"/>
            <rect x="444" y="820" width="52" height="12" rx="6" fill="#F2B33D"/><rect x="504" y="820" width="52" height="12" rx="6" fill="#F2B33D"/>
            <path d="M548 712 L566 696 L578 714 L560 728Z" fill="#fff" stroke="#23408E" stroke-width="3"/>
          </g>
          <circle cx="500" cy="500" r="54" fill="#F6CFA8"/>
          <path d="M452 508 Q500 610 548 508 Q520 530 500 524 Q480 530 452 508Z" fill="#9A5B2E"/>
          <path d="M476 522 Q500 506 524 522" stroke="#7A4420" stroke-width="9" fill="none" stroke-linecap="round"/>
          <circle cx="480" cy="488" r="6" fill="#3B2416"/><circle cx="520" cy="488" r="6" fill="#3B2416"/>
          <circle cx="468" cy="508" r="8" fill="#F29A8A" opacity=".6"/><circle cx="532" cy="508" r="8" fill="#F29A8A" opacity=".6"/>
          <g class="dg-crown"><path d="M448 462 L452 410 L476 438 L500 400 L524 438 L548 410 L552 462Z" fill="#F2B33D"/><circle cx="500" cy="440" r="7" fill="#E5484D"/><circle cx="470" cy="450" r="5" fill="#3E6FD8"/><circle cx="530" cy="450" r="5" fill="#3E6FD8"/></g>
          <path d="M600 620 L650 560" stroke="#F6CFA8" stroke-width="18" stroke-linecap="round"/>
          <path d="M650 600 V430" stroke="#C9A06A" stroke-width="10" stroke-linecap="round"/><circle cx="650" cy="424" r="16" fill="#F2B33D"/>
        </g>
      </g>
      <g class="dg-curtains" filter="url(#ps2)">
        <path d="M0 0 H190 Q150 300 170 520 Q120 700 0 760Z" fill="#B4232B"/><path d="M40 0 Q20 380 60 740" stroke="#8E1A22" stroke-width="10" fill="none"/>
        <path d="M1000 0 H810 Q850 300 830 520 Q880 700 1000 760Z" fill="#B4232B"/><path d="M960 0 Q980 380 940 740" stroke="#8E1A22" stroke-width="10" fill="none"/>
        <circle cx="170" cy="520" r="14" fill="#F2B33D"/><circle cx="830" cy="520" r="14" fill="#F2B33D"/>
      </g>
      <g class="dg-ok sc-text" fill="#FFF8E0" stroke="#7A1A22" stroke-width="7" paint-order="stroke"><text x="500" y="250" text-anchor="middle" font-size="56">À l’endroit&#160;!</text></g>`;
    },
  };

  /* ============ 8. À la claire fontaine — le jardin ============ */
  W.fontaine = {
    color: '#8FD3E2',
    area: [170, 200, 640, 480],
    floater: '<circle r="12" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-width="2.5"/><circle cx="-4" cy="-4" r="3" fill="#fff"/>',
    draw() {
      const leaves = [[700, 230, 120, '#4E9A5F'], [820, 200, 110, '#3E8650'], [900, 300, 110, '#5FAE6E'], [760, 330, 100, '#3E8650'], [620, 290, 80, '#5FAE6E'], [880, 120, 80, '#4E9A5F']]
        .map(([x, y, rr, c]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${c}"/>`).join('');
      return `
      <defs>
        <linearGradient id="fn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD3A1"/><stop offset=".5" stop-color="#FDEBCB"/><stop offset="1" stop-color="#D5EFD9"/></linearGradient>
        <linearGradient id="fn-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8E6F2"/><stop offset="1" stop-color="#5DBFD6"/></linearGradient>
      </defs>
      <rect width="1000" height="1000" fill="url(#fn-sky)"/>
      <circle cx="240" cy="330" r="96" fill="#FFE3A0"/>
      <g class="fn-rainbow" fill="none" stroke-width="22" stroke-linecap="round">
        <path d="M150 640 A270 270 0 0 1 690 640" stroke="#E5484D"/><path d="M172 640 A248 248 0 0 1 668 640" stroke="#F2803C"/><path d="M194 640 A226 226 0 0 1 646 640" stroke="#F5C32C"/><path d="M216 640 A204 204 0 0 1 624 640" stroke="#4CAF5A"/><path d="M238 640 A182 182 0 0 1 602 640" stroke="#3E6FD8"/><path d="M260 640 A160 160 0 0 1 580 640" stroke="#8B57C9"/>
      </g>
      <g class="pl" style="--d:.3" filter="url(#ps)"><path d="M0 600 Q120 540 240 590 T480 580 T720 590 T1000 570 V1000 H0Z" fill="#7DB98A"/>
        <path d="M60 600 Q40 450 75 360 Q110 450 92 600Z" fill="#3E7A4E"/><path d="M130 610 Q115 490 142 420 Q170 490 154 610Z" fill="#336B43"/></g>
      <g class="pl" style="--d:.6" filter="url(#ps)">
        <path d="M740 1000 V420 Q720 380 640 370 L600 372 L600 350 Q700 340 760 380 Q800 330 790 260 L820 260 Q830 360 800 430 V1000Z" fill="#6E4B30"/>
        ${leaves}
        <g transform="translate(700 380)"><ellipse cx="0" cy="0" rx="9" ry="12" fill="#B07A3D"/><rect x="-9" y="-16" width="18" height="8" rx="4" fill="#6B4A2A"/></g>
        <g transform="translate(860 400)"><ellipse cx="0" cy="0" rx="9" ry="12" fill="#B07A3D"/><rect x="-9" y="-16" width="18" height="8" rx="4" fill="#6B4A2A"/></g>
      </g>
      <g class="fn-bird pl" style="--d:.6" filter="url(#ps)">
        <path d="M576 352 Q560 330 540 336 L556 346Z" fill="#7A5236"/>
        <ellipse cx="600" cy="340" rx="34" ry="24" fill="#9C6B48"/><ellipse cx="606" cy="348" rx="22" ry="14" fill="#E8CBA6"/>
        <circle cx="630" cy="318" r="18" fill="#9C6B48"/><circle cx="636" cy="314" r="4" fill="#2A1B12"/>
        <g class="fn-beak"><path d="M646 316 L666 320 L646 324Z" fill="#E1A13C"/></g>
        <path d="M590 362 V376 M606 362 V376" stroke="#E1A13C" stroke-width="4"/>
        <g class="fn-notes sc-text" fill="#7A5236"><text x="660" y="290" font-size="34">&#9834;</text><text x="690" y="250" font-size="28">&#9835;</text><text x="650" y="220" font-size="24">&#9834;</text></g>
      </g>
      <g class="pl" style="--d:.8" filter="url(#ps)">
        <ellipse cx="420" cy="800" rx="250" ry="58" fill="#C9C1AE"/>
        <path d="M170 790 V740 H670 V790Z" fill="#E9E4D8"/>
        <ellipse cx="420" cy="740" rx="250" ry="52" fill="#F4F0E6"/>
        <ellipse cx="420" cy="742" rx="226" ry="40" fill="url(#fn-water)"/>
        <g class="fn-ripples" fill="none" stroke="#E6FAFF" stroke-width="4"><ellipse cx="420" cy="742" rx="60" ry="10"/><ellipse cx="420" cy="742" rx="120" ry="20"/></g>
        <ellipse cx="300" cy="746" rx="26" ry="8" fill="#5FAE6E"/><ellipse cx="560" cy="736" rx="22" ry="7" fill="#5FAE6E"/>
        <rect x="404" y="590" width="32" height="150" fill="#E9E4D8"/>
        <path d="M330 590 Q420 640 510 590Z" fill="#F4F0E6"/><ellipse cx="420" cy="590" rx="90" ry="16" fill="#F4F0E6"/><ellipse cx="420" cy="590" rx="74" ry="10" fill="#A8E6F2"/>
        <g class="fn-jets" fill="none" stroke="#D2F6FD" stroke-width="10" stroke-linecap="round">
          <path d="M420 584 Q420 470 420 470"/><path d="M420 520 Q330 460 300 730"/><path d="M420 520 Q510 460 540 730"/><path d="M420 540 Q370 500 352 600"/><path d="M420 540 Q470 500 488 600"/>
        </g>
        <g class="fn-spray" fill="#E6FAFF"><circle cx="420" cy="462" r="8"/><circle cx="404" cy="476" r="5"/><circle cx="436" cy="478" r="5"/></g>
      </g>
      <g filter="url(#ps)"><path d="M0 860 Q200 820 420 860 T1000 850 V1000 H0Z" fill="#5DAE6B"/>
        <g transform="translate(110 880)"><circle r="10" fill="#E5484D"/><circle cx="14" cy="-10" r="8" fill="#F5C32C"/></g>
        <g transform="translate(880 900)"><circle r="10" fill="#8B57C9"/><circle cx="-16" cy="-8" r="8" fill="#fff"/></g>
        <path d="M640 1000 Q630 900 646 840 M660 1000 Q664 910 690 860 M620 1000 Q600 920 590 870" stroke="#3E8650" stroke-width="8" fill="none" stroke-linecap="round"/>
      </g>`;
    },
  };

  /* ============ 9. Il court, il court, le furet — le bois en automne ============ */
  W.automne = {
    color: '#E8743B',
    area: [160, 190, 840, 480],
    holes: [[210, 770], [390, 712], [570, 752], [745, 700], [870, 812]],
    floater: '<path d="M-17 8 C-15 -11 4 -17 17 -13 C15 6 -2 15 -17 8Z" fill="#E8743B"/><path d="M-15 7 L13 -10" stroke="#9E3F1C" stroke-width="2.5"/>',
    draw() {
      const crowns = [[90, 330, 120, '#F2A541'], [250, 280, 110, '#E8743B'], [420, 340, 100, '#F6D06B'], [600, 300, 120, '#C8452C'], [790, 320, 115, '#F2A541'], [950, 290, 110, '#E8743B']];
      const back = crowns.map(([x, y, rr, c]) => `<rect x="${x - 14}" y="${y}" width="28" height="420" fill="#7A5236"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${c}"/><circle cx="${x - rr * 0.45}" cy="${y + rr * 0.35}" r="${rr * 0.55}" fill="${c}" opacity=".8"/>`).join('');
      const holes = this.holes.map(([x, y]) => `<ellipse cx="${x}" cy="${y + 4}" rx="62" ry="28" fill="#6E4A2E"/><ellipse cx="${x}" cy="${y}" rx="52" ry="22" fill="#2E1C12"/>`).join('');
      return `
      <defs>
        <linearGradient id="au2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6C4"/><stop offset="1" stop-color="#F7C08A"/></linearGradient>
        <clipPath id="fu-clip" clipPathUnits="userSpaceOnUse"><rect x="-120" y="-260" width="240" height="262"/></clipPath>
      </defs>
      <rect width="1000" height="1000" fill="url(#au2-sky)"/>
      <circle cx="770" cy="270" r="92" fill="#FFB86B" opacity=".85"/>
      <g class="pl" style="--d:.3" filter="url(#ps)">${back}</g>
      <g class="pl" style="--d:.6" filter="url(#ps)">
        <path d="M0 690 Q300 590 600 650 T1000 630 V1000 H0Z" fill="#A8713F"/>
        <path d="M0 860 Q260 800 520 850 T1000 830 V1000 H0Z" fill="#8C5A33"/>
        <path d="M60 690 Q120 640 160 700 M640 650 Q700 610 760 668" stroke="#6E4A2E" stroke-width="12" fill="none" stroke-linecap="round"/>
        ${holes}
      </g>
      <g class="fu-pos">
        <g clip-path="url(#fu-clip)">
          <g class="fu-ferret" filter="url(#ps)">
            <path d="M-30 30 Q-36 -60 -8 -110 Q4 -128 20 -112 Q40 -60 34 30Z" fill="#F1DFC3"/>
            <path d="M-22 -40 Q2 -10 26 -40 Q4 -20 -22 -40Z" fill="#FFF6E6"/>
            <ellipse cx="6" cy="-128" rx="34" ry="28" fill="#F1DFC3"/>
            <path d="M-28 -132 Q6 -112 40 -132 Q36 -150 6 -146 Q-24 -150 -28 -132Z" fill="#7A5C45"/>
            <circle cx="-8" cy="-134" r="5" fill="#1E140D"/><circle cx="20" cy="-134" r="5" fill="#1E140D"/>
            <circle cx="-6" cy="-136" r="1.8" fill="#fff"/><circle cx="22" cy="-136" r="1.8" fill="#fff"/>
            <ellipse cx="6" cy="-114" rx="6" ry="4.5" fill="#E78B92"/>
            <circle cx="-22" cy="-150" r="10" fill="#E3C9A6"/><circle cx="34" cy="-150" r="10" fill="#E3C9A6"/>
            <ellipse cx="-14" cy="-12" rx="10" ry="7" fill="#E3C9A6"/><ellipse cx="22" cy="-12" rx="10" ry="7" fill="#E3C9A6"/>
          </g>
        </g>
        <path d="M-52 0 A52 22 0 0 0 52 0 L62 4 A62 28 0 0 1 -62 4Z" fill="#6E4A2E"/>
      </g>
      <g filter="url(#ps)">
        <g transform="translate(110 900)"><rect x="-8" y="0" width="16" height="34" rx="6" fill="#F4EBDD"/><path d="M-32 4 Q0 -42 32 4Z" fill="#C8452C"/><circle cx="-10" cy="-10" r="5" fill="#fff"/><circle cx="12" cy="-14" r="4" fill="#fff"/></g>
        <g transform="translate(640 930) scale(.8)"><rect x="-8" y="0" width="16" height="34" rx="6" fill="#F4EBDD"/><path d="M-32 4 Q0 -42 32 4Z" fill="#E8743B"/><circle cx="-10" cy="-10" r="5" fill="#fff"/></g>
        <g transform="translate(470 920)"><ellipse rx="14" ry="18" fill="#B07A3D"/><rect x="-14" y="-24" width="28" height="12" rx="6" fill="#6B4A2A"/></g>
        <g transform="translate(940 950)"><ellipse rx="12" ry="16" fill="#B07A3D"/><rect x="-12" y="-22" width="24" height="10" rx="5" fill="#6B4A2A"/></g>
      </g>`;
    },
  };

  /* ------------------------------------------------------------------
     Mise à jour selon la progression (p de 0 à 1, phrases trouvées…)
  ------------------------------------------------------------------- */
  const MOUSE_X = [250, 420, 560, 720, 340, 640, 480];
  const WOLF_SAYS = ['Je mets ma culotte !', 'Je mets ma chemise !', 'Je mets mon chapeau !', 'Je mets mes bottes !', 'J’arrive !'];

  function update(stage, st) {
    stage.style.setProperty('--p', st.p.toFixed(3));
    stage.style.setProperty('--ph', st.phrasesDone);
    stage.classList.toggle('is-done', st.done);
    const svg = stage.querySelector('svg');
    if (!svg) return;
    // formes envolées restantes
    const fl = svg.querySelectorAll('.fl');
    const remain = Math.round(fl.length * (1 - st.p));
    fl.forEach((g, i) => g.classList.toggle('gone', i >= remain));
    stage.dataset.half = st.p >= 0.5 ? '1' : '0';
    if (st.world === 'lune') {
      svg.querySelectorAll('.lu-star').forEach((s, i) => s.classList.toggle('on', i < st.found));
    }
    if (st.world === 'provence') {
      svg.querySelectorAll('.pv-dancer').forEach((d, i) => d.classList.toggle('on', i < st.phrasesDone));
    }
    if (st.world === 'foret') {
      const stageN = st.done ? 4 : Math.min(3, st.phrasesDone);
      stage.dataset.wolf = st.done ? 'out' : String(stageN);
      const say = svg.querySelector('.fo-say');
      if (say) say.textContent = WOLF_SAYS[st.done ? 4 : stageN];
      fitBubbles(svg);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitBubbles(svg));
    }
    if (st.world === 'prairie' && !stage.style.getPropertyValue('--mx')) {
      stage.style.setProperty('--mx', MOUSE_X[st.found % MOUSE_X.length] + 'px');
    }
    if (st.world === 'automne' && !stage.dataset.hole) placeFerret(stage, st.found % 5, false);
    const w = W[st.world];
    if (w && w.update) w.update(stage, st, svg);
  }

  function fitBubbles(svg) {
    svg.querySelectorAll('.bub-t').forEach((t) => {
      const bg = t.parentNode.querySelector('.bub-bg');
      try {
        const w = t.getComputedTextLength();
        if (!w) return;
        const cx = +t.getAttribute('x');
        bg.setAttribute('x', (cx - w / 2 - 30).toFixed(0));
        bg.setAttribute('width', (w + 60).toFixed(0));
      } catch (e) { /* texte pas encore rendu */ }
    });
  }

  function placeFerret(stage, k, pop) {
    const [x, y] = W.automne.holes[k];
    stage.dataset.hole = k;
    stage.style.setProperty('--hx', x + 'px');
    stage.style.setProperty('--hy', y + 'px');
    if (pop) restartClass(stage, 'fu-pop');
  }

  function restartClass(el, cls) {
    el.classList.remove(cls);
    void el.getBoundingClientRect();
    el.classList.add(cls);
  }

  let doneTimer = null;
  function react(stage, kind, st) {
    const w = W[st.world];
    if (w && w.react) w.react(stage, kind, st, stage.querySelector('svg'));
    if (kind === 'correct' || kind === 'phrase') {
      restartClass(stage, 'react');
      if (st.world === 'prairie') {
        stage.style.setProperty('--mx', MOUSE_X[st.found % MOUSE_X.length] + 'px');
        restartClass(stage, 'pr-hop');
      }
      if (st.world === 'automne') {
        let k = Math.floor(Math.random() * 5);
        if (String(k) === stage.dataset.hole) k = (k + 2) % 5;
        placeFerret(stage, k, true);
      }
    }
    if (kind === 'phrase') restartClass(stage, 'react-big');
    if (kind === 'complete') {
      restartClass(stage, 'react-big');
      if (st.world === 'automne') {
        clearInterval(doneTimer);
        let i = 0;
        doneTimer = setInterval(() => {
          placeFerret(stage, i % 5, true);
          if (++i > 10) { clearInterval(doneTimer); placeFerret(stage, 2, true); }
        }, 420);
      }
    }
  }

  function svgFor(song, st) {
    const w = W[song.theme];
    return `<svg class="sc sc-${song.theme}" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${w.draw(song)}${floaters(w, Math.min(12, song.notes.length - 1), song.notes.length * 7 + 1)}</svg>`;
  }

  /* ------------------------------------------------------------------
     Médaillons de la page d'accueil
  ------------------------------------------------------------------- */
  const EMBLEMS = {
    bonbons: '<rect x="46" y="48" width="8" height="44" rx="4" fill="#FFF7EC"/><circle cx="50" cy="40" r="27" fill="#FFE07A"/><path d="M50 40 m0 -4 a4 4 0 1 1 -4 4 a9 9 0 1 1 9 9 a15 15 0 1 1 -15 -15 a21 21 0 1 1 21 21" fill="none" stroke="#E23D73" stroke-width="5" stroke-linecap="round"/>',
    aube: '<rect x="28" y="20" width="44" height="6" rx="3" fill="#5A3F86"/><path d="M32 66 C32 40 40 28 50 28 C60 28 68 40 68 66 L74 72 L26 72Z" fill="#E8AE3C"/><path d="M39 62 C39 44 43 36 48 34" stroke="#F8D57A" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="50" cy="77" r="5" fill="#B7812A"/>',
    lune: '<path d="M60 18 A32 32 0 1 0 82 66 A26 26 0 1 1 60 18Z" fill="#F7F1D4"/><path d="M24 26 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" fill="#FFF1A8"/><circle cx="34" cy="70" r="2.5" fill="#FFF1A8"/>',
    prairie: '<path d="M24 66 Q6 70 8 50" stroke="#6CB96C" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="42" cy="62" rx="24" ry="16" fill="#7CCB7C"/><circle cx="64" cy="50" r="15" fill="#86D486"/><circle cx="58" cy="34" r="10" fill="#86D486"/><circle cx="58" cy="34" r="5" fill="#F6A6B8"/><circle cx="68" cy="48" r="3" fill="#1E2B22"/><circle cx="78" cy="54" r="3.5" fill="#F28AA0"/>',
    foret: '<path d="M28 40 L22 12 L42 28Z M72 40 L78 12 L58 28Z" fill="#6E7C8C"/><ellipse cx="50" cy="50" rx="28" ry="25" fill="#7D8A99"/><path d="M30 58 Q50 86 70 58 Q50 70 30 58Z" fill="#E9EDF1"/><ellipse cx="50" cy="62" rx="8" ry="6" fill="#2A2F38"/><circle cx="39" cy="46" r="4" fill="#fff"/><circle cx="61" cy="46" r="4" fill="#fff"/><circle cx="39" cy="46" r="2.2" fill="#2A2F38"/><circle cx="61" cy="46" r="2.2" fill="#2A2F38"/>',
    provence: '<rect x="8" y="64" width="84" height="20" fill="#4BA4D8"/><path d="M8 40 H92 V70 H8Z M18 70 V60 A12 12 0 0 1 42 60 V70Z M58 70 V60 A12 12 0 0 1 82 60 V70Z" fill="#E9B86B" fill-rule="evenodd"/><path d="M40 40 V26 H56 V40Z" fill="#E2B572"/><path d="M36 28 L48 18 L60 28Z" fill="#B5653D"/>',
    chateau: '<path d="M18 70 L20 32 L36 50 L50 24 L64 50 L80 32 L82 70Z" fill="#F2B33D"/><rect x="16" y="68" width="68" height="10" rx="3" fill="#E8A21F"/><circle cx="50" cy="52" r="6" fill="#E5484D"/><circle cx="30" cy="60" r="4" fill="#3E6FD8"/><circle cx="70" cy="60" r="4" fill="#3E6FD8"/>',
    fontaine: '<ellipse cx="50" cy="78" rx="38" ry="9" fill="#F4F0E6"/><path d="M12 78 V70 H88 V78Z" fill="#E9E4D8"/><ellipse cx="50" cy="70" rx="38" ry="8" fill="#7FD1E6"/><rect x="46" y="44" width="8" height="26" fill="#E9E4D8"/><ellipse cx="50" cy="44" rx="16" ry="4" fill="#F4F0E6"/><path d="M50 42 V20 M50 30 Q34 24 28 62 M50 30 Q66 24 72 62" stroke="#D2F6FD" stroke-width="4" fill="none" stroke-linecap="round"/>',
    automne: '<ellipse cx="50" cy="80" rx="30" ry="10" fill="#2E1C12"/><path d="M36 80 Q34 40 46 30 Q50 26 56 30 Q66 40 64 80Z" fill="#F1DFC3"/><ellipse cx="50" cy="30" rx="16" ry="13" fill="#F1DFC3"/><path d="M36 28 Q50 38 64 28 Q62 20 50 21 Q38 20 36 28Z" fill="#7A5C45"/><circle cx="44" cy="27" r="2.5" fill="#1E140D"/><circle cx="56" cy="27" r="2.5" fill="#1E140D"/><ellipse cx="50" cy="36" rx="3" ry="2.2" fill="#E78B92"/><path d="M70 22 C72 10 84 8 90 10 C88 20 80 26 70 22Z" fill="#E8743B"/>',
  };

  function emblem(theme) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${EMBLEMS[theme]}</svg>`;
  }

  return { W, svgFor, update, react, emblem, EMBLEMS, kit: { rng, cloud, starPath, sparkle, restartClass } };
})();
