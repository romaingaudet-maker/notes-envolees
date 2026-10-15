/* ------------------------------------------------------------------
   Les décors des nouvelles comptines (même principe : SVG 1000 × 1000,
   éléments importants entre y 250 et 780 pour rester visibles sur
   téléphone)
------------------------------------------------------------------- */
(() => {
  const { W, EMBLEMS } = Scenes;
  const { rng, cloud, starPath, sparkle, restartClass } = Scenes.kit;
  const on = (svg, sel, n) => svg.querySelectorAll(sel).forEach((e, i) => e.classList.toggle('on', i < n));
  const grass = (seed, y0, h, step, color) => {
    const r = rng(seed);
    let d = `M0 ${y0 + h}`;
    for (let x = 0; x <= 1000; x += step) d += ` L${x + step / 2} ${y0 + Math.round(r() * h * 0.6)} L${x + step} ${y0 + h - Math.round(r() * 6)}`;
    return `<path d="${d} V1000 H0Z" fill="${color}"/>`;
  };

  /* ================= Une poule sur un mur ================= */
  W.poule = {
    color: '#9FD6F0',
    area: [160, 170, 840, 400],
    floater: '<path d="M0 -17 C11 -8 11 9 0 17 C-11 9 -11 -8 0 -17Z" fill="#FFFFFF"/><path d="M0 -15 V17" stroke="#D9C9B0" stroke-width="2.5"/>',
    draw() {
      const r = rng(21);
      let stones = '';
      for (let row = 0; row < 4; row++) {
        let x = row % 2 ? -46 : 0;
        while (x < 1000) {
          const w = 92 + Math.round(r() * 58);
          const shade = ['#C9BBA6', '#B8A890', '#D6C9B3', '#BFAF97'][Math.floor(r() * 4)];
          stones += `<rect x="${x + 3}" y="${616 + row * 40}" width="${w - 6}" height="34" rx="12" fill="${shade}"/>`;
          x += w;
        }
      }
      let crumbs = '';
      for (let i = 0; i < 10; i++) {
        crumbs += `<ellipse class="po-crumb" cx="${556 + i * 25 + Math.round(r() * 8)}" cy="${597 + Math.round(r() * 5)}" rx="${(7 + r() * 4).toFixed(1)}" ry="5" fill="#E2A55A"/>`;
      }
      let flowers = '';
      [[80, 820, '#F5C32C'], [180, 860, '#fff'], [820, 830, '#E5484D'], [910, 870, '#F5C32C'], [640, 880, '#fff']].forEach(([x, y, c]) => {
        flowers += `<path d="M${x} ${y} V${y + 50}" stroke="#4E8F3A" stroke-width="5"/>`;
        for (let k = 0; k < 5; k++) flowers += `<circle cx="${x + Math.cos(k * 1.256) * 11}" cy="${y + Math.sin(k * 1.256) * 11}" r="9" fill="${c}"/>`;
        flowers += `<circle cx="${x}" cy="${y}" r="7" fill="#E8833A"/>`;
      });
      return `
      <defs><linearGradient id="po-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86CDEF"/><stop offset="1" stop-color="#E6F7FB"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#po-sky)"/>
      <circle cx="170" cy="250" r="72" fill="#FFD95A"/>
      <g class="pl" style="--d:.2">${cloud(720, 220, 0.9, '#fff')}${cloud(430, 160, 0.6, '#fff')}</g>
      <g class="pl" style="--d:.35" filter="url(#ps)">
        <path d="M0 520 Q250 450 520 500 T1000 480 V1000 H0Z" fill="#BFDF83"/>
        <path d="M0 565 Q300 505 600 548 T1000 532 V1000 H0Z" fill="#A3CF64"/>
        <g transform="translate(790 410)"><rect x="0" y="40" width="120" height="90" fill="#C8463B"/><path d="M-12 46 L60 -8 L132 46Z" fill="#8E2E27"/><rect x="45" y="78" width="30" height="52" fill="#F4E3C3"/><path d="M45 78 L75 130 M75 78 L45 130" stroke="#C8463B" stroke-width="5"/></g>
        <g transform="translate(110 470)"><rect x="-6" y="0" width="12" height="70" fill="#7A5236"/><circle cx="0" cy="-12" r="44" fill="#6FAE4E"/></g>
      </g>
      <g filter="url(#ps)"><rect x="0" y="608" width="1000" height="172" fill="#A8977F"/>${stones}<rect x="0" y="594" width="1000" height="20" rx="9" fill="#DCD0BB"/></g>
      <g class="po-crumbs">${crumbs}</g>
      <g class="po-hen-pos">
        <g class="po-hen" filter="url(#ps)">
          <path d="M-22 -6 V2 M18 -6 V2" stroke="#E8A33C" stroke-width="8" stroke-linecap="round"/>
          <g class="po-tail"><path d="M-62 -78 Q-128 -118 -104 -160 Q-86 -122 -66 -112 Q-98 -160 -66 -184 Q-60 -134 -44 -116 Q-60 -150 -30 -168 Q-30 -120 -20 -104Z" fill="#F3EFE6"/></g>
          <ellipse cx="0" cy="-62" rx="82" ry="58" fill="#FFFFFF"/>
          <path class="po-wing" d="M-46 -74 Q4 -108 42 -66 Q8 -34 -46 -48Z" fill="#ECE6DA"/>
          <g class="po-head">
            <path d="M40 -92 Q60 -150 92 -140 Q104 -110 80 -84Z" fill="#FFFFFF"/>
            <circle cx="84" cy="-138" r="30" fill="#FFFFFF"/>
            <path d="M66 -164 Q72 -186 82 -170 Q88 -190 96 -168 Q106 -184 106 -160Z" fill="#E5484D"/>
            <path d="M110 -142 L132 -134 L110 -126Z" fill="#F2A93B"/>
            <path d="M104 -124 Q112 -104 98 -104 Q92 -114 100 -124Z" fill="#E5484D"/>
            <circle cx="94" cy="-144" r="5" fill="#2A1E16"/><circle cx="95.5" cy="-145.5" r="1.6" fill="#fff"/>
          </g>
        </g>
      </g>
      <g filter="url(#ps)">${grass(4, 760, 40, 26, '#7DBA4E')}${flowers}</g>`;
    },
    update(stage, st, svg) {
      const left = Math.round(10 * (1 - st.p));
      svg.querySelectorAll('.po-crumb').forEach((c, i) => c.classList.toggle('gone', i >= left));
    },
    react(stage, kind) { if (kind !== 'complete') restartClass(stage, 'po-peck'); },
  };

  /* ================= Petit escargot ================= */
  W.escargot = {
    color: '#A9C3D3',
    area: [170, 190, 830, 430],
    floater: '<path d="M0 -15 C9 -2 11 6 0 13 C-11 6 -9 -2 0 -15Z" fill="#7FB8E6"/><circle cx="-3" cy="4" r="3" fill="#fff" opacity=".7"/>',
    draw() {
      const r = rng(31);
      let rain = '';
      for (let i = 0; i < 46; i++) {
        const x = Math.round(r() * 1000), d = (r() * 1.2).toFixed(2), len = 26 + Math.round(r() * 22);
        rain += `<path class="es-drop" style="--x:${x}px;--d:-${d}s" d="M0 0 L-6 ${len}" stroke="#E8F3FB" stroke-width="4" stroke-linecap="round"/>`;
      }
      let leaves = '';
      [[90, 700, -30, 1.2], [880, 690, 25, 1.3], [760, 760, 10, 0.9], [230, 770, -12, 0.95]].forEach(([x, y, rot, s]) => {
        leaves += `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C-70 -40 -60 -170 0 -210 C60 -170 70 -40 0 0Z" fill="#3E8F55"/><path d="M0 -6 V-200" stroke="#2D6E40" stroke-width="5"/>${[-150, -110, -70].map((yy) => `<path d="M0 ${yy} Q-30 ${yy + 10} -44 ${yy + 34} M0 ${yy} Q30 ${yy + 10} 44 ${yy + 34}" stroke="#2D6E40" stroke-width="3" fill="none"/>`).join('')}</g>`;
      });
      return `
      <defs><linearGradient id="es-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7F98AE"/><stop offset="1" stop-color="#D4E2E8"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#es-sky)"/>
      <g class="es-sun"><circle cx="820" cy="250" r="68" fill="#FFE37A"/></g>
      <g class="es-clouds pl" style="--d:.2">${cloud(250, 230, 1.3, '#93A6B8')}${cloud(560, 190, 1.1, '#A3B4C4')}${cloud(840, 260, 1.2, '#8E9FB2')}</g>
      <g class="es-rain">${rain}</g>
      <g class="pl" style="--d:.4" filter="url(#ps)"><path d="M0 620 Q260 570 520 610 T1000 590 V1000 H0Z" fill="#6BAE6E"/></g>
      <g class="pl" style="--d:.6" filter="url(#ps)">${leaves}</g>
      <g filter="url(#ps)"><path d="M0 760 Q300 720 600 750 T1000 740 V1000 H0Z" fill="#4E9A5A"/>
        <ellipse cx="300" cy="850" rx="120" ry="20" fill="#9CC6E2"/><ellipse cx="760" cy="880" rx="90" ry="16" fill="#9CC6E2"/>
      </g>
      <g class="es-rings" fill="none" stroke="#E8F3FB" stroke-width="3"><ellipse cx="300" cy="850" rx="30" ry="6"/><ellipse cx="760" cy="880" rx="24" ry="5"/></g>
      <g transform="translate(500 790)">
        <g class="es-snail" filter="url(#ps)">
          <path d="M-130 0 Q-140 -30 -100 -34 H60 Q90 -36 110 -52 L130 -20 Q120 0 90 0Z" fill="#C7A57A"/>
          <g class="es-head">
            <path d="M70 -40 Q90 -110 130 -100 Q160 -90 150 -40Z" fill="#C7A57A"/>
            <path d="M108 -98 L96 -170 M134 -96 L146 -166" stroke="#B48F63" stroke-width="7" stroke-linecap="round"/>
            <circle cx="96" cy="-172" r="10" fill="#B48F63"/><circle cx="146" cy="-168" r="10" fill="#B48F63"/>
            <circle cx="96" cy="-172" r="4.5" fill="#2A1E16"/><circle cx="146" cy="-168" r="4.5" fill="#2A1E16"/>
            <path class="es-smile" d="M114 -66 Q128 -56 140 -68" stroke="#6E4E2E" stroke-width="4" fill="none" stroke-linecap="round"/>
            <circle cx="138" cy="-80" r="7" fill="#F29A8A" opacity=".55"/>
          </g>
          <circle cx="-14" cy="-104" r="92" fill="#E2934E"/>
          <path d="M-14 -104 m0 -8 a8 8 0 1 1 -8 8 a18 18 0 1 1 18 18 a30 30 0 1 1 -30 -30 a44 44 0 1 1 44 44 a58 58 0 1 1 -58 -58 a72 72 0 1 1 72 72" fill="none" stroke="#B5622B" stroke-width="9" stroke-linecap="round"/>
          <path d="M-80 -160 Q-40 -196 10 -190" stroke="#F4BD86" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>
        </g>
      </g>
      <g filter="url(#ps)">${grass(9, 880, 36, 22, '#3B8A4C')}</g>`;
    },
    react(stage, kind) { restartClass(stage, 'es-wiggle'); },
  };

  /* ================= Dodo, l'enfant do ================= */
  W.dodo = {
    color: '#C9B6E4',
    area: [170, 150, 540, 380],
    floater: `<path d="${sparkle(12)}" fill="#FFE9A8"/>`,
    draw() {
      const r = rng(41);
      let dots = '';
      for (let y = 40; y < 760; y += 70) for (let x = (y / 70) % 2 ? 35 : 0; x < 1000; x += 70) dots += `<path d="${sparkle(6)}" transform="translate(${x} ${y})" fill="#D8C8EE"/>`;
      let stars = '';
      for (let i = 0; i < 14; i++) stars += `<circle cx="${630 + Math.round(r() * 230)}" cy="${226 + Math.round(r() * 120)}" r="${(1.5 + r() * 2).toFixed(1)}" fill="#FFF6CF"/>`;
      return `
      <rect width="1000" height="1000" fill="#E9DDF5"/>
      ${dots}
      <rect x="0" y="760" width="1000" height="240" fill="#B07A52"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="0" y="${770 + i * 40}" width="1000" height="3" fill="#946342"/>`).join('')}
      <rect x="0" y="752" width="1000" height="16" fill="#8C5A3A"/>
      <g class="pl" style="--d:.25">
        <rect x="600" y="196" width="290" height="290" rx="18" fill="#FFFFFF"/>
        <rect x="614" y="210" width="262" height="262" rx="10" fill="#1E2463"/>
        ${stars}
        <circle cx="830" cy="262" r="30" fill="#FFF3C4"/><circle cx="844" cy="252" r="26" fill="#1E2463"/>
        <path d="M614 420 Q700 380 790 410 T876 400 V472 H614Z" fill="#2E3A7A"/>
        <g transform="translate(650 380)"><rect x="0" y="26" width="86" height="62" fill="#9A3B3B"/><path d="M-8 30 L43 -6 L94 30Z" fill="#6E2A2A"/><rect x="32" y="52" width="22" height="36" fill="#3B1C1C"/></g>
        <g transform="translate(770 452)"><ellipse cx="0" cy="0" rx="20" ry="14" fill="#FFFFFF"/><circle cx="16" cy="-14" r="9" fill="#FFFFFF"/><path d="M14 -24 l4 -6 l4 6Z" fill="#E5484D"/><path d="M25 -14 l6 2 l-6 2Z" fill="#F2A93B"/>
          <ellipse class="do-egg" cx="-30" cy="6" rx="8" ry="10" fill="#FFF8E6"/></g>
        <path d="M745 210 V472 M614 341 H876" stroke="#FFFFFF" stroke-width="10"/>
        <path d="M584 186 Q620 330 590 500 L560 500 L560 186Z" fill="#8E6CCB"/><path d="M906 186 Q870 330 900 500 L930 500 L930 186Z" fill="#8E6CCB"/>
        <rect x="556" y="178" width="378" height="16" rx="8" fill="#6B4AA8"/>
      </g>
      <g class="pl" style="--d:.45">
        <g transform="translate(205 600)" filter="url(#ps)"><rect x="-50" y="60" width="100" height="100" rx="10" fill="#C99A6E"/><rect x="-60" y="52" width="120" height="16" rx="6" fill="#B07A52"/>
          <path d="M-8 52 V0" stroke="#7A5236" stroke-width="8"/><path d="M-44 4 L28 4 L16 -50 L-32 -50Z" fill="#FFD27A"/></g>
      </g>
      <g class="do-mobile-pos" transform="translate(470 0)">
        <path d="M0 0 V250" stroke="#7A5E9E" stroke-width="3"/>
        <g class="do-mobile">
          <path d="M-120 250 H120" stroke="#7A5E9E" stroke-width="5" stroke-linecap="round"/>
          <path d="M-120 250 V300 M0 250 V320 M120 250 V290" stroke="#7A5E9E" stroke-width="2"/>
          <path d="${starPath(26)}" transform="translate(-120 326)" fill="#F5C32C"/>
          <path d="M14 330 A26 26 0 1 1 -10 368 A20 20 0 1 0 14 330Z" fill="#FFF3C4"/>
          <g transform="translate(120 306) scale(.5)">${cloud(0, 20, 1, '#FFFFFF')}</g>
        </g>
      </g>
      <ellipse cx="480" cy="800" rx="270" ry="40" fill="#9BC4E8" opacity=".8"/>
      <g class="do-cradle-pos" transform="translate(480 770)">
        <g class="do-cradle" filter="url(#ps)">
          <path d="M-230 0 Q0 60 230 0" stroke="#8C5A3A" stroke-width="16" fill="none" stroke-linecap="round"/>
          <path d="M-200 -12 V-150 Q-200 -190 -160 -190 H-140 V-30 H140 V-150 H200 V-12Z" fill="#D9A36E"/>
          <path d="M-210 -200 Q-170 -250 -120 -200Z" fill="#C88A55"/>
          <rect x="-150" y="-120" width="300" height="100" rx="18" fill="#E7B786"/>
          ${[-110, -60, -10, 40, 90].map((x) => `<rect x="${x}" y="-112" width="16" height="84" rx="8" fill="#D9A36E"/>`).join('')}
          <ellipse cx="-90" cy="-150" rx="70" ry="30" fill="#FFFFFF"/>
          <g class="do-baby">
            <circle cx="-80" cy="-168" r="38" fill="#F6CFA8"/>
            <path d="M-118 -178 Q-80 -226 -42 -182 Q-80 -200 -118 -178Z" fill="#8B5A3C"/>
            <g class="do-open"><circle cx="-94" cy="-168" r="4.5" fill="#3B2416"/><circle cx="-66" cy="-168" r="4.5" fill="#3B2416"/></g>
            <g class="do-shut"><path d="M-100 -166 q6 5 12 0 M-72 -166 q6 5 12 0" stroke="#3B2416" stroke-width="3" fill="none" stroke-linecap="round"/></g>
            <circle cx="-104" cy="-154" r="7" fill="#F29A8A" opacity=".5"/><circle cx="-56" cy="-154" r="7" fill="#F29A8A" opacity=".5"/>
            <path d="M-88 -150 q8 5 16 0" stroke="#B5684A" stroke-width="3" fill="none" stroke-linecap="round"/>
          </g>
          <path d="M-60 -150 Q60 -200 170 -140 L170 -40 L-60 -40Z" fill="#7FB0E0"/>
          <path d="M-60 -150 Q60 -200 170 -140" stroke="#FFFFFF" stroke-width="8" fill="none" opacity=".7"/>
          ${[[0, -120], [60, -100], [110, -128], [40, -70], [120, -76]].map(([x, y]) => `<path d="${starPath(9)}" transform="translate(${x} ${y})" fill="#FFF3C4"/>`).join('')}
        </g>
      </g>
      <rect class="do-dim" width="1000" height="1000" fill="#1B1440"/>
      <defs><radialGradient id="do-light"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".95"/><stop offset=".3" stop-color="#FFD27A" stop-opacity=".5"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient></defs>
      <g class="do-glow"><circle cx="197" cy="576" r="170" fill="url(#do-light)"/></g>
      <g class="do-zzz sc-text" fill="#FFFFFF"><text x="440" y="520" font-size="40">Z</text><text x="478" y="478" font-size="32">z</text><text x="508" y="446" font-size="24">z</text></g>`;
    },
    react(stage, kind) { if (kind !== 'correct') restartClass(stage, 'do-spin'); },
  };

  /* ================= Dansons la capucine ================= */
  W.capucine = {
    color: '#F6B26B',
    area: [160, 170, 840, 400],
    floater: '<path d="M0 -14 C12 -14 16 0 8 10 C2 16 -2 16 -8 10 C-16 0 -12 -14 0 -14Z" fill="#F2803C"/>',
    draw() {
      const r = rng(51);
      const pickets = Array.from({ length: 13 }, (_, i) => `<path d="M${i * 80 + 10} 700 V540 L${i * 80 + 40} 505 L${i * 80 + 70} 540 V700Z" fill="#FFF8EC"/>`).join('');
      let leaves = '';
      for (let i = 0; i < 22; i++) {
        const x = Math.round(30 + r() * 940), y = Math.round(520 + r() * 150), rr = Math.round(26 + r() * 18);
        leaves += `<g transform="translate(${x} ${y})"><circle r="${rr}" fill="${r() < 0.5 ? '#6DB24F' : '#5EA243'}"/>${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${-rr * 0.2} ${rr * 0.1} L${(Math.cos(k * 1.05) * rr * 0.9).toFixed(1)} ${(Math.sin(k * 1.05) * rr * 0.9).toFixed(1)}" stroke="#A9D98C" stroke-width="2"/>`).join('')}</g>`;
      }
      const cols = ['#F2803C', '#E5484D', '#F5C32C'];
      let flowers = '';
      for (let i = 0; i < 12; i++) {
        const x = Math.round(70 + ((i * 137) % 860)), y = Math.round(500 + r() * 170), c = cols[i % 3];
        flowers += `<g class="ca-fl" style="--x:${x}px;--y:${y}px">${[0, 1, 2, 3, 4].map((k) => `<ellipse cx="0" cy="-14" rx="10" ry="15" transform="rotate(${k * 72})" fill="${c}"/>`).join('')}<circle r="6" fill="#B3311C"/></g>`;
      }
      const kid = (x, body, skin, hair, i) => `<g class="ca-kid" style="--i:${i}"><g class="ca-kid-in"><path d="M${x - 24} 860 L${x} 790 L${x + 24} 860Z" fill="${body}"/><circle cx="${x}" cy="772" r="19" fill="${skin}"/><path d="M${x - 16} 768 q16 -24 32 0" fill="${hair}"/><path d="M${x - 22} 806 L${x - 48} 816 M${x + 22} 806 L${x + 48} 816" stroke="${skin}" stroke-width="8" stroke-linecap="round"/><path d="M${x - 10} 860 V888 M${x + 10} 860 V888" stroke="#3B2A22" stroke-width="8" stroke-linecap="round"/></g></g>`;
      return `
      <defs><linearGradient id="ca-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A8"/><stop offset="1" stop-color="#FFF4E0"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#ca-sky)"/>
      <g class="ca-sun"><circle cx="500" cy="330" r="110" fill="#FFC65C" opacity=".5"/><circle cx="500" cy="330" r="78" fill="#FFB43C"/></g>
      <g class="pl" style="--d:.2">${cloud(220, 210, 0.8, '#FFFFFF')}${cloud(800, 250, 0.7, '#FFFFFF')}</g>
      <g class="pl" style="--d:.4" filter="url(#ps)"><path d="M0 560 Q250 500 500 540 T1000 520 V1000 H0Z" fill="#9CCB6A"/>${pickets}<rect x="0" y="560" width="1000" height="16" fill="#F1E3CC"/><rect x="0" y="640" width="1000" height="16" fill="#F1E3CC"/></g>
      <g class="pl" style="--d:.55">${leaves}${flowers}</g>
      <g filter="url(#ps)"><path d="M0 720 Q300 690 600 715 T1000 705 V1000 H0Z" fill="#7DBB55"/></g>
      <g class="ca-ring">${kid(290, '#3E6FD8', '#F6CFA8', '#4A2E1F', 0)}${kid(420, '#E5484D', '#E7B08A', '#2A1B12', 1)}${kid(550, '#8B57C9', '#F6CFA8', '#C26A2E', 2)}${kid(680, '#4CAF5A', '#E7B08A', '#4A2E1F', 3)}
        <path class="ca-hands" d="M338 816 L372 816 M468 816 L502 816 M598 816 L632 816" stroke="#E7B08A" stroke-width="8" stroke-linecap="round"/></g>`;
    },
    update(stage, st, svg) {
      on(svg, '.ca-fl', Math.round(12 * st.p));
      on(svg, '.ca-kid', st.done ? 4 : Math.min(4, st.phrasesDone + 1));
      svg.querySelector('.ca-hands').classList.toggle('on', st.phrasesDone >= 4 || st.done);
    },
  };

  /* ================= Pomme de reinette ================= */
  W.pommes = {
    color: '#A8D46F',
    area: [160, 160, 840, 360],
    floater: '<path d="M-14 6 C-12 -10 4 -15 14 -11 C12 5 -2 12 -14 6Z" fill="#6DB24F"/><path d="M-12 5 L11 -9" stroke="#3F7F2E" stroke-width="2.5"/>',
    draw() {
      const apples = [[380, 270], [470, 230], [570, 250], [640, 320], [330, 360], [430, 340], [530, 350], [610, 420], [380, 440], [480, 450], [690, 380], [300, 300]];
      return `
      <defs><linearGradient id="pm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE6F5"/><stop offset="1" stop-color="#F3FAE6"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#pm-sky)"/>
      <g class="pl" style="--d:.2">${cloud(170, 170, 0.8, '#FFFFFF')}${cloud(860, 220, 0.7, '#FFFFFF')}</g>
      <g class="pl" style="--d:.35" filter="url(#ps)"><path d="M0 600 Q300 540 600 590 T1000 570 V1000 H0Z" fill="#B5DA82"/>
        ${[[120, 560, 60], [880, 560, 70]].map(([x, y, s]) => `<rect x="${x - 8}" y="${y - 10}" width="16" height="70" fill="#7A5236"/><circle cx="${x}" cy="${y - 30}" r="${s}" fill="#8CC062"/>`).join('')}
      </g>
      <g class="pl" style="--d:.6" filter="url(#ps)">
        <path d="M470 800 Q480 620 452 520 L548 520 Q520 620 530 800Z" fill="#7A5236"/>
        <path d="M480 560 Q420 520 380 470 M520 560 Q590 520 630 480" stroke="#7A5236" stroke-width="24" fill="none" stroke-linecap="round"/>
        <circle cx="500" cy="340" r="210" fill="#5FA83E"/><circle cx="360" cy="400" r="120" fill="#6DB24F"/><circle cx="640" cy="400" r="120" fill="#6DB24F"/><circle cx="500" cy="250" r="140" fill="#77BC55"/>
        ${apples.map(([x, y], i) => `<g class="pm-apple" data-k="${i % 2 ? 'api' : 'rei'}" style="--x:${x}px;--y:${y}px"><circle r="22" class="pm-fruit"/><circle cx="-7" cy="-7" r="6" fill="#fff" opacity=".45"/><path d="M0 -20 V-30" stroke="#5A3A22" stroke-width="4" stroke-linecap="round"/></g>`).join('')}
      </g>
      <g filter="url(#ps)"><path d="M0 760 Q300 730 600 755 T1000 745 V1000 H0Z" fill="#8CC062"/>
        <g class="pm-rug-red"><path d="M140 820 H400 L420 900 H120Z" fill="#D9363E"/><path d="M150 830 H392 M140 862 H404" stroke="#F6C76B" stroke-width="5"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${124 + i * 25} 900 v14" stroke="#F6C76B" stroke-width="4"/>`).join('')}</g>
        <g class="pm-rug-grey"><path d="M600 820 H860 L880 900 H580Z" fill="#9AA3AF"/><path d="M610 830 H852 M600 862 H864" stroke="#E3E8EE" stroke-width="5"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${584 + i * 25} 900 v14" stroke="#E3E8EE" stroke-width="4"/>`).join('')}</g>
        <g transform="translate(500 800)"><path d="M-70 0 H70 L56 64 H-56Z" fill="#C8955A"/><path d="M-64 20 H64 M-60 42 H60" stroke="#A8743E" stroke-width="5"/><path d="M-60 0 Q0 -70 60 0" stroke="#A8743E" stroke-width="8" fill="none"/></g>
        <g class="pm-basket-fruit">${[[-30, 4, '#E5484D'], [0, -6, '#F2C14E'], [30, 4, '#E5484D']].map(([x, y, c]) => `<circle cx="${500 + x}" cy="${800 + y}" r="18" fill="${c}"/>`).join('')}</g>
      </g>`;
    },
    update(stage, st, svg) { on(svg, '.pm-apple', Math.round(12 * st.p)); },
    react(stage, kind) { if (kind !== 'correct') restartClass(stage, 'pm-shake'); },
  };

  /* ================= Ainsi font, font, font ================= */
  W.marionnettes = {
    color: '#2B4C9B',
    area: [170, 150, 830, 330],
    floater: `<path d="${sparkle(13)}" fill="#F5C32C"/>`,
    draw() {
      const stripes = Array.from({ length: 12 }, (_, i) => `<rect x="${210 + i * 50}" y="300" width="25" height="580" fill="#F5C32C"/>`).join('');
      const scallops = Array.from({ length: 12 }, (_, i) => `<path d="M${200 + i * 50} 300 q25 40 50 0Z" fill="${i % 2 ? '#E5484D' : '#F5C32C'}"/>`).join('');
      const pup = (x, dress, hair, cls) => `<g class="ma-pup ${cls}" style="--px:${x}px"><g class="ma-pup-in">
        <path d="M-46 160 L-34 40 Q0 20 34 40 L46 160Z" fill="${dress}"/>
        <path d="M-34 60 L-60 30 M34 60 L60 30" stroke="${dress}" stroke-width="16" stroke-linecap="round"/>
        <circle cx="-62" cy="26" r="11" fill="#F6CFA8"/><circle cx="62" cy="26" r="11" fill="#F6CFA8"/>
        <circle cx="0" cy="0" r="40" fill="#F6CFA8"/>
        <path d="M-42 -6 Q-40 -50 0 -46 Q40 -50 42 -6 Q30 -30 0 -28 Q-30 -30 -42 -6Z" fill="${hair}"/>
        <circle cx="-14" cy="4" r="5" fill="#2A1E16"/><circle cx="14" cy="4" r="5" fill="#2A1E16"/>
        <circle cx="-24" cy="16" r="7" fill="#F29A8A" opacity=".6"/><circle cx="24" cy="16" r="7" fill="#F29A8A" opacity=".6"/>
        <path d="M-10 20 Q0 30 10 20" stroke="#8E3B2E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      </g></g>`;
      return `
      <defs><radialGradient id="ma-bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#3E63B8"/><stop offset="1" stop-color="#1D2F6B"/></radialGradient>
        <clipPath id="ma-open" clipPathUnits="userSpaceOnUse"><rect x="300" y="400" width="400" height="250"/></clipPath></defs>
      <rect width="1000" height="1000" fill="url(#ma-bg)"/>
      ${Array.from({ length: 18 }, (_, i) => `<path d="${starPath(6 + (i % 3) * 3)}" transform="translate(${(i * 173) % 1000} ${60 + ((i * 97) % 220)})" fill="#F5D76E" opacity=".7"/>`).join('')}
      <rect x="0" y="880" width="1000" height="120" fill="#16224F"/>
      <g class="pl" style="--d:.3" filter="url(#ps2)">
        <rect x="200" y="300" width="600" height="580" fill="#2B4C9B"/>${stripes}
        <path d="M180 300 H820 V260 Q500 200 180 260Z" fill="#E5484D"/>${scallops}
        <circle cx="500" cy="236" r="26" fill="#F5C32C"/><path d="${starPath(16)}" transform="translate(500 236)" fill="#E5484D"/>
        <rect x="290" y="390" width="420" height="270" rx="14" fill="#F5C32C"/>
        <rect x="300" y="400" width="400" height="250" fill="#14204A"/>
        ${Array.from({ length: 10 }, (_, i) => `<path d="${starPath(5)}" transform="translate(${320 + ((i * 89) % 360)} ${420 + ((i * 53) % 120)})" fill="#F5D76E" opacity=".8"/>`).join('')}
        <g clip-path="url(#ma-open)">
          ${pup(420, '#E5598B', '#C2502E', 'p1')}${pup(580, '#4CAF5A', '#3B2A22', 'p2')}
          <rect x="300" y="620" width="400" height="40" fill="#E5484D"/>
          <g class="ma-cur-l"><path d="M300 400 H500 V650 H300Z" fill="#C2333B"/>${[340, 390, 440].map((x) => `<path d="M${x} 400 V650" stroke="#9E2630" stroke-width="10"/>`).join('')}</g>
          <g class="ma-cur-r"><path d="M500 400 H700 V650 H500Z" fill="#C2333B"/>${[560, 610, 660].map((x) => `<path d="M${x} 400 V650" stroke="#9E2630" stroke-width="10"/>`).join('')}</g>
        </g>
        <rect x="200" y="660" width="600" height="40" fill="#E5484D"/>
      </g>`;
    },
    react(stage, kind) { restartClass(stage, kind === 'correct' ? 'ma-bob' : 'ma-spin'); },
  };

  /* ================= Dans la forêt lointaine ================= */
  W.coucou = {
    color: '#2E4A6B',
    area: [160, 170, 840, 420],
    floater: '<circle r="10" fill="#FFF3A6" opacity=".35"/><circle r="4.5" fill="#FFF7C8"/>',
    draw() {
      const r = rng(61);
      let pines = '';
      for (let i = 0; i < 11; i++) {
        const x = Math.round(i * 100 + r() * 40), h = 240 + Math.round(r() * 160);
        pines += `<path d="M${x} ${700 - h} L${x - 70} 700 H${x + 70}Z" fill="${i % 2 ? '#1F4A4A' : '#245452'}"/>`;
      }
      let flies = '';
      for (let i = 0; i < 14; i++) flies += `<g class="cu-fly" style="--x:${Math.round(120 + r() * 760)}px;--y:${Math.round(520 + r() * 300)}px;--d:-${(r() * 3).toFixed(2)}s"><circle r="12" fill="#FFF3A6" opacity=".3"/><circle r="5" fill="#FFF8CC"/></g>`;
      return `
      <defs><linearGradient id="cu-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2F6B"/><stop offset=".6" stop-color="#3E5D84"/><stop offset="1" stop-color="#6E8FA0"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#cu-sky)"/>
      <g class="cu-moon"><circle cx="210" cy="300" r="64" fill="#F6EFC9"/><circle cx="190" cy="290" r="10" fill="#E3DAB0"/><circle cx="232" cy="318" r="14" fill="#E3DAB0"/></g>
      <g class="pl" style="--d:.25" opacity=".95">${pines}</g>
      <g class="pl" style="--d:.45" filter="url(#ps)"><path d="M0 700 Q300 650 600 690 T1000 680 V1000 H0Z" fill="#1C3D3A"/></g>
      <g class="pl" style="--d:.65" filter="url(#ps)">
        <path d="M420 920 Q440 640 410 380 L590 380 Q560 640 580 920Z" fill="#5B3E2B"/>
        <path d="M600 470 Q700 450 780 420" stroke="#5B3E2B" stroke-width="30" fill="none" stroke-linecap="round"/>
        <path d="M430 520 Q360 500 300 470" stroke="#5B3E2B" stroke-width="24" fill="none" stroke-linecap="round"/>
        <circle cx="500" cy="300" r="190" fill="#2F6B4A"/><circle cx="360" cy="360" r="110" fill="#37774F"/><circle cx="650" cy="350" r="120" fill="#2B6244"/>
        <ellipse cx="500" cy="560" rx="38" ry="48" fill="#24170F"/>
        <g class="cu-bird-pos" transform="translate(500 560)"><g class="cu-bird">
          <ellipse cx="0" cy="0" rx="26" ry="22" fill="#8C8F9E"/><circle cx="12" cy="-12" r="16" fill="#9EA1B0"/>
          <path d="M26 -14 L44 -10 L26 -6Z" fill="#F2A93B"/><circle cx="16" cy="-16" r="3.5" fill="#1B1B22"/>
          <path d="M-18 6 Q-30 20 -40 16" stroke="#6E7180" stroke-width="7" fill="none" stroke-linecap="round"/>
        </g></g>
        <path d="M462 560 A38 48 0 0 1 538 560" stroke="#3F2A1C" stroke-width="10" fill="none"/>
        <g class="cu-owl" transform="translate(760 400)">
          <ellipse cx="0" cy="-36" rx="44" ry="54" fill="#A8794C"/><ellipse cx="0" cy="-24" rx="30" ry="36" fill="#E5C99A"/>
          <path d="M-40 -84 L-30 -110 L-14 -88Z M40 -84 L30 -110 L14 -88Z" fill="#A8794C"/>
          <circle cx="-16" cy="-62" r="16" fill="#FFF8E6"/><circle cx="16" cy="-62" r="16" fill="#FFF8E6"/>
          <g class="cu-eyes"><circle cx="-16" cy="-62" r="7.5" fill="#1B1B22"/><circle cx="16" cy="-62" r="7.5" fill="#1B1B22"/></g>
          <path d="M-6 -48 L0 -38 L6 -48Z" fill="#F2A93B"/>
          <path d="M-14 16 v8 M0 16 v10 M14 16 v8" stroke="#F2A93B" stroke-width="5" stroke-linecap="round"/>
        </g>
      </g>
      <g class="cu-flies">${flies}</g>
      <g class="cu-say sc-text"><text class="cu-t1" x="560" y="520" font-size="40" fill="#FFF3C4">Coucou&#160;!</text><text class="cu-t2" x="700" y="300" font-size="40" fill="#FFF3C4">Hibou&#160;!</text></g>`;
    },
    update(stage, st, svg) { on(svg, '.cu-fly', Math.round(14 * st.p)); },
    react(stage, kind, st) {
      if (kind === 'complete') return;
      restartClass(stage, st.found % 2 ? 'cu-cuckoo' : 'cu-hoot');
    },
  };

  /* ================= Savez-vous planter les choux ================= */
  W.choux = {
    color: '#8FCB6B',
    area: [160, 160, 840, 380],
    floater: '<ellipse rx="9" ry="13" fill="#B5DA7A"/><path d="M0 -12 V12" stroke="#6FA03E" stroke-width="2"/>',
    draw() {
      const cab = (x, y, s, i) => `<g class="ch-cab" style="--x:${x}px;--y:${y}px;--s:${s};--i:${i}"><g class="ch-cab-in">
        <ellipse cx="0" cy="-4" rx="46" ry="30" fill="#6FAE4E"/><circle cx="0" cy="-26" r="34" fill="#9CD27A"/>
        <path d="M-30 -14 Q-40 -50 -6 -60 M30 -14 Q40 -50 6 -60" stroke="#6FAE4E" stroke-width="6" fill="none"/>
        <path d="M0 -6 V-52" stroke="#C9E8A8" stroke-width="4"/>
      </g></g>`;
      const rows = [[600, 0.7], [690, 0.85], [800, 1]];
      let cabs = '', k = 0;
      rows.forEach(([y, s]) => { for (let c = 0; c < 4; c++) cabs += cab(Math.round(500 + (c - 1.5) * 190 * s), y, s, k++); });
      return `
      <defs><linearGradient id="ch-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ED8F2"/><stop offset="1" stop-color="#EAF7EF"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#ch-sky)"/>
      <circle cx="820" cy="220" r="64" fill="#FFD95A"/>
      <g class="pl" style="--d:.2">${cloud(260, 200, 0.85, '#FFFFFF')}${cloud(560, 150, 0.6, '#FFFFFF')}</g>
      <g class="pl" style="--d:.35" filter="url(#ps)"><path d="M0 520 Q300 470 600 505 T1000 495 V1000 H0Z" fill="#A9D67E"/>
        ${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 74 + 8}" y="470" width="14" height="80" rx="4" fill="#C49A6C"/>`).join('')}<rect x="0" y="490" width="1000" height="10" fill="#B38559"/><rect x="0" y="520" width="1000" height="10" fill="#B38559"/>
      </g>
      <g filter="url(#ps)">
        <path d="M0 560 H1000 V1000 H0Z" fill="#7FB55A"/>
        <path d="M110 570 H890 L960 640 H40Z" fill="#8A5A3A"/><path d="M60 650 H940 L1000 740 H0Z" fill="#7A4E32"/><path d="M0 750 H1000 V880 H0Z" fill="#8A5A3A"/>
        <path d="M110 570 H890 M60 650 H940 M0 750 H1000" stroke="#A8744E" stroke-width="6"/>
      </g>
      <g class="ch-cabs">${cabs}</g>
      <g class="ch-bunny" transform="translate(880 900)"><g class="ch-bunny-in">
        <ellipse cx="0" cy="-30" rx="34" ry="30" fill="#F2EEE6"/><circle cx="26" cy="-62" r="22" fill="#F2EEE6"/>
        <ellipse cx="20" cy="-104" rx="8" ry="26" fill="#F2EEE6"/><ellipse cx="36" cy="-100" rx="8" ry="24" fill="#F2EEE6" transform="rotate(14 36 -100)"/>
        <ellipse cx="20" cy="-104" rx="3.5" ry="17" fill="#F4B6C2"/><circle cx="34" cy="-66" r="3.5" fill="#2A1E16"/><circle cx="46" cy="-56" r="4" fill="#F28AA0"/>
        <circle cx="-32" cy="-34" r="10" fill="#FFFFFF"/>
      </g></g>
      <g transform="translate(140 900)" filter="url(#ps)"><path d="M-40 0 H40 L32 -60 H-32Z" fill="#5C8FD0"/><path d="M32 -46 L80 -80" stroke="#5C8FD0" stroke-width="12" stroke-linecap="round"/><path d="M-32 -50 Q-60 -80 -32 -100" stroke="#4A78B5" stroke-width="8" fill="none"/></g>`;
    },
    update(stage, st, svg) {
      svg.querySelectorAll('.ch-cab').forEach((c, i) => c.classList.toggle('on', st.p >= (i + 1) / 12 - 1e-9 || st.done));
    },
    react(stage, kind) { if (kind !== 'complete') restartClass(stage, 'ch-hop'); },
  };

  /* ================= J'ai ramassé des champignons ================= */
  W.champignons = {
    color: '#7FB98A',
    area: [160, 170, 840, 400],
    floater: '<path d="M-12 4 C-10 -9 3 -13 12 -9 C10 4 -2 10 -12 4Z" fill="#9CCB6A"/>',
    draw() {
      const r = rng(71);
      let pines = '';
      for (let i = 0; i < 12; i++) {
        const x = Math.round(i * 90 + r() * 30), h = 200 + Math.round(r() * 140);
        pines += `<rect x="${x - 7}" y="${560}" width="14" height="40" fill="#5A3E2A"/><path d="M${x} ${570 - h} L${x - 60} 570 H${x + 60}Z" fill="${i % 2 ? '#3F7F5A' : '#4A8C63'}"/>`;
      }
      const types = [['#FFFFFF', '#F1ECE2', 0], ['#5C8FD0', '#EAF0FA', 1], ['#F2803C', '#FFF2E2', 1]];
      const spots = [[60, 820, 0.8, 0], [190, 870, 1.1, 1], [320, 800, 0.7, 2], [410, 880, 1.25, 0], [560, 830, 0.85, 1], [660, 890, 1.0, 2], [780, 820, 0.75, 0], [880, 870, 1.15, 1], [250, 760, 0.6, 2], [470, 770, 0.55, 1], [720, 770, 0.6, 0], [950, 790, 0.65, 2]];
      const mush = spots.map(([x, y, s, t], i) => {
        const [cap, stem, dots] = types[t];
        return `<g class="cm-m" style="--x:${x}px;--y:${y}px;--s:${s};--i:${i}"><g class="cm-in">
          <path d="M-14 0 Q-18 -40 -10 -56 H10 Q18 -40 14 0Z" fill="${stem}"/>
          <path d="M-46 -50 Q-44 -104 0 -106 Q44 -104 46 -50 Q0 -40 -46 -50Z" fill="${cap}"/>
          ${dots ? '<circle cx="-18" cy="-78" r="7" fill="#FFFFFF" opacity=".85"/><circle cx="14" cy="-88" r="6" fill="#FFFFFF" opacity=".85"/><circle cx="24" cy="-64" r="5" fill="#FFFFFF" opacity=".85"/>' : '<path d="M-40 -52 Q0 -44 40 -52" stroke="#D8CDB8" stroke-width="3" fill="none"/>'}
        </g></g>`;
      }).join('');
      return `
      <defs><linearGradient id="cm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CDEBD6"/><stop offset="1" stop-color="#F2F8EA"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#cm-sky)"/>
      <g class="pl" style="--d:.2">${cloud(220, 170, 0.75, '#FFFFFF')}${cloud(760, 210, 0.85, '#FFFFFF')}</g>
      <g class="pl" style="--d:.35" filter="url(#ps)">${pines}</g>
      <g class="pl" style="--d:.5" filter="url(#ps)"><path d="M0 600 Q260 560 520 590 T1000 575 V1000 H0Z" fill="#7DB55E"/></g>
      <g filter="url(#ps)"><path d="M0 700 Q300 670 600 690 T1000 680 V1000 H0Z" fill="#68A852"/>${grass(13, 930, 30, 24, '#4F9442')}</g>
      <g class="cm-giant" transform="translate(500 700)"><g class="cm-giant-in">
        <path d="M-40 0 Q-50 -120 -26 -170 H26 Q50 -120 40 0Z" fill="#F4EEE3"/>
        <path d="M-150 -150 Q-140 -300 0 -306 Q140 -300 150 -150 Q0 -120 -150 -150Z" fill="#E5484D"/>
        <circle cx="-60" cy="-230" r="22" fill="#FFFFFF"/><circle cx="40" cy="-262" r="18" fill="#FFFFFF"/><circle cx="90" cy="-196" r="15" fill="#FFFFFF"/><circle cx="-100" cy="-176" r="12" fill="#FFFFFF"/>
      </g></g>
      <g filter="url(#ps)">${mush}</g>
      <g transform="translate(860 700)" filter="url(#ps)"><path d="M-80 0 H80 L64 70 H-64Z" fill="#C8955A"/><path d="M-74 22 H74 M-70 46 H70" stroke="#A8743E" stroke-width="5"/><path d="M-66 0 Q0 -80 66 0" stroke="#A8743E" stroke-width="9" fill="none"/>
        <g class="cm-basket"><circle cx="-30" cy="-6" r="20" fill="#F2803C"/><circle cx="6" cy="-14" r="20" fill="#FFFFFF"/><circle cx="38" cy="-6" r="18" fill="#5C8FD0"/></g></g>`;
    },
    update(stage, st, svg) { on(svg, '.cm-m', Math.round(12 * st.p)); },
  };

  /* ================= Il était une bergère ================= */
  W.bergere = {
    color: '#9BCF7E',
    area: [160, 160, 840, 360],
    floater: '<circle r="6" fill="#FFFFFF"/>' + [0, 1, 2, 3, 4].map((k) => `<circle cx="${(Math.cos(k * 1.256) * 9).toFixed(1)}" cy="${(Math.sin(k * 1.256) * 9).toFixed(1)}" r="6" fill="#FFFFFF"/>`).join('') + '<circle r="4" fill="#F5C32C"/>',
    draw() {
      const sheep = (i) => `<g class="bg-sheep" data-i="${i}"><g class="bg-sheep-in">
        <path d="M-26 6 V26 M-8 8 V28 M10 8 V28 M26 6 V26" stroke="#3B3A42" stroke-width="7" stroke-linecap="round"/>
        ${[[-26, -14], [-6, -24], [16, -22], [30, -6], [10, 0], [-14, 0]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="#FBFAF6"/>`).join('')}
        <ellipse cx="44" cy="-18" rx="15" ry="18" fill="#3B3A42"/><circle cx="48" cy="-22" r="3" fill="#FFFFFF"/>
        <ellipse cx="34" cy="-30" rx="8" ry="5" fill="#3B3A42"/>
      </g></g>`;
      return `
      <defs><linearGradient id="bg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9DBF2"/><stop offset="1" stop-color="#F0F9EE"/></linearGradient></defs>
      <rect class="bg-skyrect" width="1000" height="1000" fill="url(#bg-sky)"/>
      <rect class="bg-dusk" width="1000" height="1000" fill="#F6A36B"/>
      <circle class="bg-sun" cx="780" cy="230" r="62" fill="#FFD95A"/>
      <g class="pl" style="--d:.2" filter="url(#ps)">
        <path d="M0 520 L180 300 L300 420 L460 230 L640 450 L780 320 L1000 520Z" fill="#8FA6C2"/>
        <path d="M180 300 L230 362 L200 352 L160 360Z M460 230 L520 302 L480 292 L430 300Z M780 320 L824 372 L790 364 L750 368Z" fill="#FFFFFF"/>
      </g>
      <g class="pl" style="--d:.4" filter="url(#ps)"><path d="M0 560 Q260 480 520 540 T1000 520 V1000 H0Z" fill="#9BCF7E"/></g>
      <g class="pl" style="--d:.55" filter="url(#ps)">
        <g transform="translate(220 600)"><rect x="-110" y="-120" width="220" height="140" fill="#E9D7B5"/><path d="M-140 -110 L0 -230 L140 -110Z" fill="#D9B45A"/><path d="M-140 -110 L0 -230 L140 -110" stroke="#B8923E" stroke-width="8" fill="none"/>
          <rect x="-26" y="-70" width="52" height="90" rx="6" fill="#8A5A3A"/><rect x="50" y="-90" width="40" height="34" fill="#9CC6E2"/>
          <g class="bg-cat" transform="translate(60 -150)"><ellipse cx="0" cy="0" rx="22" ry="16" fill="#5B5B66"/><circle cx="20" cy="-14" r="13" fill="#5B5B66"/><path d="M12 -24 l3 -10 l6 8Z M24 -26 l4 -10 l4 10Z" fill="#5B5B66"/><path d="M-20 0 Q-36 -18 -26 -30" stroke="#5B5B66" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="23" cy="-15" r="2.5" fill="#F5C32C"/></g>
        </g>
        <g transform="translate(380 650)"><rect x="-50" y="-10" width="100" height="14" rx="5" fill="#8A5A3A"/><path d="M-40 4 V40 M40 4 V40" stroke="#8A5A3A" stroke-width="10"/>
          <g class="bg-cheese"><path d="M-28 -10 L28 -10 L20 -44 Q0 -56 -20 -44Z" fill="#F7D46A"/><circle cx="-6" cy="-28" r="5" fill="#E8B83E"/><circle cx="10" cy="-20" r="4" fill="#E8B83E"/></g></g>
      </g>
      <g filter="url(#ps)"><path d="M0 700 Q300 670 600 690 T1000 680 V1000 H0Z" fill="#86C068"/></g>
      <g class="bg-pen" filter="url(#ps)">
        ${[560, 640, 720, 800, 880, 960].map((x) => `<rect x="${x}" y="690" width="14" height="150" rx="4" fill="#A8744E"/>`).join('')}
        <rect x="550" y="720" width="430" height="12" rx="5" fill="#A8744E"/><rect x="550" y="790" width="430" height="12" rx="5" fill="#A8744E"/>
        <path d="M600 700 Q586 650 604 640" stroke="#8A5A3A" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M604 640 V840" stroke="#8A5A3A" stroke-width="8"/>
        <ellipse cx="640" cy="684" rx="40" ry="10" fill="#E9C46A"/><path d="M612 684 Q640 650 668 684Z" fill="#E9C46A"/><path d="M612 684 Q640 676 668 684" stroke="#E5484D" stroke-width="6" fill="none"/>
      </g>
      <g class="bg-flock">${Array.from({ length: 6 }, (_, i) => sheep(i)).join('')}</g>
      <g filter="url(#ps)">${grass(17, 900, 34, 24, '#6FAE52')}</g>`;
    },
    update(stage, st, svg) {
      const inPen = st.done ? 6 : Math.floor(6 * st.p);
      svg.querySelectorAll('.bg-sheep').forEach((s, i) => s.classList.toggle('in', i < inPen));
    },
    react(stage, kind) { if (kind !== 'complete') restartClass(stage, 'bg-hop'); },
  };

  /* ================= À la pêche aux moules ================= */
  W.moules = {
    color: '#7CCBE0',
    area: [160, 150, 840, 330],
    floater: '<path d="M-14 0 Q0 -24 14 0 Q0 24 -14 0Z" fill="#2E3550"/><path d="M-10 0 Q0 -14 10 0" stroke="#5E6890" stroke-width="2" fill="none"/>',
    draw() {
      const mussel = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-22 0 Q-6 -16 22 -4 Q6 14 -22 0Z" fill="#2E3550"/><path d="M-16 0 Q0 -8 16 -3" stroke="#5E6890" stroke-width="2.5" fill="none"/></g>`;
      let rockMussels = '';
      [[150, 640, -20], [190, 620, 15], [230, 650, -5], [270, 625, 30], [200, 670, 5], [310, 655, -25], [120, 670, 10]].forEach(([x, y, rot]) => { rockMussels += mussel(x, y, rot); });
      const pail = [[-26, -62, -10], [0, -66, 20], [26, -62, -30], [-14, -76, 40], [14, -78, -15], [0, -90, 5], [-26, -84, 25], [26, -86, -35]].map(([x, y, rot]) => `<g class="mo-in">${mussel(x, y, rot, 0.8)}</g>`).join('');
      return `
      <defs><linearGradient id="mo-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ED6F2"/><stop offset="1" stop-color="#E9F8FB"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="url(#mo-sky)"/>
      <circle cx="780" cy="200" r="60" fill="#FFE07A"/>
      <g class="pl" style="--d:.2">${cloud(250, 180, 0.8, '#FFFFFF')}</g>
      <rect x="0" y="420" width="1000" height="200" fill="#2E9BC2"/>
      <path class="mo-wave mo-w1" d="M-60 470 q30 -14 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 V620 H-60Z" fill="#3FB0D4"/>
      <path class="mo-wave mo-w2" d="M-60 530 q30 -14 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 V620 H-60Z" fill="#61C3E0"/>
      <g class="mo-boat pl" style="--d:.3"><path d="M600 440 H700 L684 466 H616Z" fill="#E5484D"/><path d="M650 440 V380 L690 430Z" fill="#FFFFFF"/></g>
      <g filter="url(#ps)">
        <path d="M0 600 Q260 570 520 590 T1000 585 V1000 H0Z" fill="#F2DDA6"/>
        <path d="M0 600 Q260 572 520 592 T1000 587" stroke="#FFFFFF" stroke-width="8" fill="none" opacity=".7"/>
        <path d="M60 700 Q60 590 160 580 Q260 560 330 600 Q380 640 360 700Z" fill="#8F8A86"/><path d="M90 690 Q100 620 170 610" stroke="#A9A49F" stroke-width="10" fill="none" stroke-linecap="round"/>
      </g>
      <g>${rockMussels}</g>
      <g transform="translate(820 800)" filter="url(#ps)"><path d="${starPath(30)}" fill="#F2803C"/></g>
      <g class="mo-pail-pos" transform="translate(560 760)">
        <g class="mo-pail" filter="url(#ps)">
          <path d="M-56 -60 Q0 -150 56 -60" stroke="#3B3A42" stroke-width="5" fill="none"/>
          ${pail}
          <path d="M-50 -60 H50 L40 30 H-40Z" fill="#E5484D"/><path d="M-50 -60 H50" stroke="#B4232B" stroke-width="8" stroke-linecap="round"/>
          <path d="M-40 -20 H40" stroke="#FFFFFF" stroke-width="6" opacity=".6"/>
        </g>
      </g>
      <g class="mo-gull"><g class="mo-gull-in">
        <path d="M-40 0 Q-20 -24 0 -4 Q20 -24 40 0" stroke="#3B3A42" stroke-width="6" fill="#FFFFFF" stroke-linejoin="round"/>
        <ellipse cx="0" cy="2" rx="16" ry="9" fill="#FFFFFF"/><path d="M14 0 L26 4 L14 6Z" fill="#F2A93B"/>
      </g></g>
      <g filter="url(#ps)">${grass(23, 940, 26, 30, '#E6CB8C')}</g>`;
    },
    update(stage, st, svg) { on(svg, '.mo-in', Math.round(8 * st.p)); },
    react(stage, kind) { if (kind !== 'complete') restartClass(stage, 'mo-splash'); },
  };

  /* ================= médaillons de l'accueil ================= */
  Object.assign(EMBLEMS, {
    poule: '<rect x="8" y="70" width="84" height="22" rx="6" fill="#C9BBA6"/><ellipse cx="46" cy="52" rx="26" ry="19" fill="#FFFFFF"/><circle cx="68" cy="34" r="12" fill="#FFFFFF"/><path d="M62 22 q3 -8 7 -2 q3 -8 7 2Z" fill="#E5484D"/><path d="M79 34 l8 3 l-8 3Z" fill="#F2A93B"/><circle cx="71" cy="32" r="2.2" fill="#2A1E16"/><path d="M24 44 Q8 30 16 20 Q22 34 30 38Z" fill="#F3EFE6"/><path d="M40 70 v-4 M52 70 v-4" stroke="#E8A33C" stroke-width="4" stroke-linecap="round"/>',
    escargot: '<path d="M10 80 Q8 70 22 70 H72 Q82 68 88 56 L94 68 Q90 80 78 80Z" fill="#C7A57A"/><circle cx="44" cy="50" r="27" fill="#E2934E"/><path d="M44 50 m0 -4 a4 4 0 1 1 -4 4 a9 9 0 1 1 9 9 a15 15 0 1 1 -15 -15 a21 21 0 1 1 21 21" fill="none" stroke="#B5622B" stroke-width="4.5" stroke-linecap="round"/><path d="M84 58 L80 34 M90 58 L94 36" stroke="#B48F63" stroke-width="3.5" stroke-linecap="round"/><path d="M20 14 l-3 9 M34 10 l-3 9 M62 12 l-3 9" stroke="#7FB8E6" stroke-width="4" stroke-linecap="round"/>',
    dodo: '<path d="M14 74 Q50 88 86 74" stroke="#8C5A3A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M18 70 V38 Q18 30 26 30 H30 V60 H76 V40 H84 V70Z" fill="#D9A36E"/><circle cx="36" cy="48" r="11" fill="#F6CFA8"/><path d="M31 48 q2 2 4 0 M38 48 q2 2 4 0" stroke="#3B2416" stroke-width="1.6" fill="none"/><path d="M42 50 Q60 36 78 48 V60 H42Z" fill="#7FB0E0"/><text x="58" y="26" font-size="20" font-weight="800" fill="#FFFFFF" font-family="Gluten, cursive">z</text>',
    capucine: '<path d="M10 92 V40 L22 28 L34 40 V92Z M66 92 V40 L78 28 L90 40 V92Z" fill="#FFF8EC"/><circle cx="34" cy="62" r="16" fill="#6DB24F"/><circle cx="64" cy="70" r="13" fill="#5EA243"/>' + [0, 1, 2, 3, 4].map((k) => `<ellipse cx="50" cy="34" rx="8" ry="12" transform="rotate(${k * 72} 50 46)" fill="#F2803C"/>`).join('') + '<circle cx="50" cy="46" r="5" fill="#B3311C"/>',
    pommes: '<rect x="45" y="56" width="10" height="34" fill="#7A5236"/><circle cx="50" cy="40" r="32" fill="#5FA83E"/><circle cx="36" cy="36" r="8" fill="#E5484D"/><circle cx="60" cy="30" r="8" fill="#F2C14E"/><circle cx="56" cy="54" r="8" fill="#E5484D"/><circle cx="34" cy="56" r="7" fill="#F2C14E"/>',
    marionnettes: '<rect x="16" y="24" width="68" height="70" fill="#2B4C9B"/><rect x="16" y="24" width="68" height="70" fill="none" stroke="#F5C32C" stroke-width="4"/><path d="M10 26 H90 V16 Q50 2 10 16Z" fill="#E5484D"/><rect x="26" y="34" width="48" height="34" fill="#14204A"/><circle cx="50" cy="52" r="10" fill="#F6CFA8"/><path d="M40 50 Q40 38 50 38 Q60 38 60 50 Q55 44 50 44 Q45 44 40 50Z" fill="#C2502E"/><path d="M42 68 L46 60 H54 L58 68Z" fill="#E5598B"/>',
    coucou: '<rect x="40" y="40" width="22" height="56" fill="#5B3E2B"/><circle cx="51" cy="34" r="30" fill="#2F6B4A"/><ellipse cx="51" cy="62" rx="7" ry="9" fill="#24170F"/><ellipse cx="80" cy="56" rx="12" ry="15" fill="#A8794C"/><circle cx="75" cy="50" r="5" fill="#FFF8E6"/><circle cx="85" cy="50" r="5" fill="#FFF8E6"/><circle cx="75" cy="50" r="2.4" fill="#1B1B22"/><circle cx="85" cy="50" r="2.4" fill="#1B1B22"/><circle cx="18" cy="20" r="9" fill="#F6EFC9"/>',
    choux: '<path d="M8 84 H92 L96 96 H4Z" fill="#8A5A3A"/><ellipse cx="50" cy="66" rx="34" ry="20" fill="#6FAE4E"/><circle cx="50" cy="50" r="24" fill="#9CD27A"/><path d="M30 60 Q24 34 46 28 M70 60 Q76 34 54 28" stroke="#6FAE4E" stroke-width="4" fill="none"/><path d="M50 62 V30" stroke="#C9E8A8" stroke-width="3"/>',
    champignons: '<path d="M30 92 Q26 66 34 56 H48 Q54 66 50 92Z" fill="#F4EEE3"/><path d="M10 58 Q12 26 41 24 Q70 26 72 58 Q41 64 10 58Z" fill="#E5484D"/><circle cx="30" cy="42" r="5" fill="#FFFFFF"/><circle cx="50" cy="34" r="4" fill="#FFFFFF"/><path d="M70 92 Q68 78 72 72 H80 Q84 78 82 92Z" fill="#EAF0FA"/><path d="M62 74 Q64 56 76 55 Q88 56 90 74 Q76 78 62 74Z" fill="#5C8FD0"/>',
    bergere: '<path d="M4 60 L30 30 L46 46 L66 20 L96 60Z" fill="#8FA6C2"/><path d="M30 30 L36 38 L24 38Z M66 20 L74 30 L60 30Z" fill="#FFFFFF"/><rect x="0" y="60" width="100" height="40" fill="#9BCF7E"/>' + [[34, 74], [62, 80]].map(([x, y]) => [[-10, -4], [0, -10], [10, -6], [6, 2], [-6, 2]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="8" fill="#FBFAF6"/>`).join('') + `<ellipse cx="${x + 16}" cy="${y - 6}" rx="6" ry="7" fill="#3B3A42"/>`).join(''),
    moules: '<rect x="0" y="40" width="100" height="22" fill="#2E9BC2"/><path d="M0 60 Q50 52 100 60 V100 H0Z" fill="#F2DDA6"/><path d="M34 62 H66 L60 92 H40Z" fill="#E5484D"/><path d="M34 62 Q50 40 66 62" stroke="#3B3A42" stroke-width="3" fill="none"/><path d="M40 60 Q50 50 60 58 Q50 66 40 60Z" fill="#2E3550"/><path d="M14 20 Q22 12 30 20 Q38 12 46 20" stroke="#3B3A42" stroke-width="3" fill="none"/>',
  });
})();
