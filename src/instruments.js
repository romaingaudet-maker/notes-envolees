/* ------------------------------------------------------------------
   Les dessins des instruments, pour les choisir (première visite,
   réglages d'une comptine, rappel sur l'accueil). Dessins originaux,
   à plat, sur une grille de 64 × 64.
------------------------------------------------------------------- */
const INST_ICON = (() => {
  const K = '#1D2350', GOLD = '#F2B53A', GOLD2 = '#FFD46B', SILVER = '#DCE1EA', WOOD = '#C8743A';
  const svg = (body) => `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;
  // un tube de cuivre : contour sombre, puis la couleur par-dessus
  const tube = (d, w, c = GOLD) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + 3.2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // la famille du violon : caisse, éclisses en C, ouïes, touche, chevalet, cordier
  const fiddle = (wood, tf, extra = '') => `<g transform="${tf}">
    <path d="M32 21C38.5 21 42 23.5 41.5 28.5C41 31.5 37.5 32 37.5 35C37.5 37.5 42.5 38.5 43 44C43.5 52 38 57 32 57C26 57 20.5 52 21 44C21.5 38.5 26.5 37.5 26.5 35C26.5 32 23 31.5 22.5 28.5C22 23.5 25.5 21 32 21Z" fill="${wood}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M26.8 39q-1.6 3.2 0 6.4M37.2 39q1.6 3.2 0 6.4" fill="none" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M30.5 5.5h3l.7 35.5h-4.4z" fill="${K}"/>
    <path d="M30.6 6.5v-2.5a1.4 1.4 0 0 1 2.8 0v2.5z" fill="${K}"/><circle cx="32" cy="2.9" r="2.1" fill="${K}"/>
    <path d="M28.3 45.6h7.4" stroke="${K}" stroke-width="2" stroke-linecap="round"/>
    <path d="M30.3 47.6h3.4l-.7 7.4h-2z" fill="${K}"/>
    <path d="M31.4 7.5V47M32.6 7.5V47" stroke="#F6E7C8" stroke-width=".7"/>${extra}
  </g>`;
  const note = (x, y, c, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-2.6" cy="9.6" rx="3.4" ry="2.6" transform="rotate(-20 -2.6 9.6)" fill="${c}" stroke="${K}" stroke-width="1.4"/><path d="M.4 9.2V-2.2c2.6 1.6 5.2 2.4 5.2 6" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return {
    flute: svg(`<g transform="rotate(-35 32 32)">
      <rect x="3" y="28" width="58" height="8" rx="4" fill="${SILVER}" stroke="${K}" stroke-width="2.2"/>
      <path d="M6 30.4H58" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
      <rect x="17" y="27.5" width="2.2" height="9" rx="1" fill="${K}"/><rect x="52.5" y="27.5" width="2.2" height="9" rx="1" fill="${K}" opacity=".55"/>
      <ellipse cx="10.5" cy="32" rx="2.6" ry="1.7" fill="${K}"/>
      <circle cx="26" cy="32" r="2.1" fill="${K}"/><circle cx="32" cy="32" r="2.1" fill="${K}"/><circle cx="38" cy="32" r="2.1" fill="${K}"/><circle cx="44" cy="32" r="2.1" fill="${K}"/>
    </g>`),
    clarinette: svg(`<g transform="rotate(-32 32 32)">
      <path d="M29.6 2.5h4.8l.7 6.5h-6.2z" fill="${K}"/>
      <rect x="28.3" y="8.5" width="7.4" height="5.5" rx="1.6" fill="#33354F" stroke="${K}" stroke-width="2"/>
      <rect x="28.8" y="13.5" width="6.4" height="35" rx="1.4" fill="#33354F" stroke="${K}" stroke-width="2"/>
      <path d="M28.8 47L23.8 58.6Q32 62 40.2 58.6L35.2 47Z" fill="#33354F" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="27.6" y="29.6" width="8.8" height="2.4" rx="1.2" fill="${SILVER}" stroke="${K}" stroke-width="1"/>
      <circle cx="32" cy="19" r="1.7" fill="${SILVER}"/><circle cx="32" cy="24.2" r="1.7" fill="${SILVER}"/><circle cx="32" cy="36.4" r="1.7" fill="${SILVER}"/><circle cx="32" cy="41.6" r="1.7" fill="${SILVER}"/>
    </g>`),
    saxalto: svg(`${tube('M13 10C18 7.2 23.5 8.5 26 13.5', 3)}
      ${tube('M26 13.5L27 44C27 55.5 43.5 56.5 43.5 45L43.5 37', 7)}
      <path d="M38.8 38.5C38.4 33.6 36.6 29.6 34 26.6L53 26.6C50.4 29.6 48.6 33.6 48.2 38.5Z" fill="${GOLD}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
      <ellipse cx="43.5" cy="26.6" rx="9.5" ry="2.8" fill="${GOLD2}" stroke="${K}" stroke-width="2.2"/>
      <path d="M8.6 12.4L13.4 9.8" stroke="${K}" stroke-width="4.2" stroke-linecap="round"/>
      <circle cx="27.2" cy="22" r="1.9" fill="${K}"/><circle cx="27.4" cy="28" r="1.9" fill="${K}"/><circle cx="27.6" cy="34" r="1.9" fill="${K}"/><circle cx="27.8" cy="40" r="1.9" fill="${K}"/>`),
    trompette: svg(`${tube('M20 30V38Q20 43.5 25.5 43.5H38.5Q44 43.5 44 38V30', 3.4)}
      ${tube('M7.5 30H44', 3.4)}
      <rect x="23.6" y="20.5" width="4.4" height="13.5" rx="1.2" fill="${GOLD}" stroke="${K}" stroke-width="1.8"/>
      <rect x="29.8" y="20.5" width="4.4" height="13.5" rx="1.2" fill="${GOLD}" stroke="${K}" stroke-width="1.8"/>
      <rect x="36" y="20.5" width="4.4" height="13.5" rx="1.2" fill="${GOLD}" stroke="${K}" stroke-width="1.8"/>
      <rect x="22.8" y="17.4" width="6" height="3.4" rx="1.4" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/>
      <rect x="29" y="17.4" width="6" height="3.4" rx="1.4" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/>
      <rect x="35.2" y="17.4" width="6" height="3.4" rx="1.4" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/>
      <path d="M43.5 26.4C49.6 26 54 22 58.5 16.5L58.5 43.5C54 38 49.6 34 43.5 33.6Z" fill="${GOLD}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M3 30H8" stroke="${K}" stroke-width="3.8" stroke-linecap="round"/>`),
    trombone: svg(`${tube('M42 37H13Q8 37 8 42Q8 47 13 47H42', 3)}
      ${tube('M42 37H51Q56 37 56 32V29Q56 24 51 24H27', 3)}
      <path d="M28 21.4C22.6 21 17.4 16.8 12 11L12 37C17.4 31.2 22.6 27 28 26.6Z" fill="${GOLD}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="38.5" y="34.2" width="3.4" height="15.6" rx="1.4" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/>
      <path d="M42 47H49" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>`),
    cor: svg(`${tube('M27 15A16.5 16.5 0 1 1 26.9 15', 5.6)}
      ${tube('M27 23.5A8.5 8.5 0 1 1 26.9 23.5', 3.2)}
      <path d="M36.5 43C42.5 47.5 45.5 51.5 47 57.5L59.5 49C53.8 47.6 49.4 44.5 44.4 38.8Z" fill="${GOLD}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
      ${tube('M13.5 21.5L7.5 15.5', 2.4)}
      <circle cx="22.5" cy="15.5" r="2.6" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/><circle cx="28.5" cy="14.6" r="2.6" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/><circle cx="34.5" cy="15.8" r="2.6" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/>`),
    violon: svg(fiddle(WOOD, 'rotate(28 32 32) translate(32 32) scale(.86) translate(-32 -30)')),
    alto: svg(fiddle('#A9592C', 'rotate(28 32 32) translate(32 32) scale(1) translate(-32 -30)')),
    // le violoncelle : debout sur sa pique, la caisse plus grande par rapport au manche
    violoncelle: svg(fiddle('#9A4E27', 'translate(32 .6) scale(1.04) translate(-32 -.8)', '<path d="M32 57v4" stroke="#1D2350" stroke-width="2.2" stroke-linecap="round"/>')),
    // la guitare classique : caisse en huit (table claire, rosace), chevalet, manche, tête ajourée et ses six mécaniques
    guitare: svg(`<g transform="rotate(32 32 32) translate(32 32) scale(.9) translate(-32 -32)">
      <path d="M32 30C37.6 30 42.4 32.6 42.4 37.6C42.4 41.2 39.8 42.4 39.8 45C39.8 47.6 45.8 49 45.8 55.2C45.8 60.8 39.8 63.6 32 63.6C24.2 63.6 18.2 60.8 18.2 55.2C18.2 49 24.2 47.6 24.2 45C24.2 42.4 21.6 41.2 21.6 37.6C21.6 32.6 26.4 30 32 30Z" fill="#F0BE72" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="32" cy="43.6" r="5.4" fill="none" stroke="#B4662E" stroke-width="1.6"/>
      <circle cx="32" cy="43.6" r="3.6" fill="${K}"/>
      <rect x="26" y="53.6" width="12" height="3.4" rx="1.2" fill="#7A3E1C" stroke="${K}" stroke-width="1.3"/>
      <path d="M30 9.5h4l.6 30h-5.2z" fill="#3A2A2A" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>
      <rect x="28.4" y=".8" width="7.2" height="9.6" rx="1.6" fill="#B4662E" stroke="${K}" stroke-width="1.6"/>
      <rect x="30.1" y="2.6" width="1.3" height="6" rx=".6" fill="${K}"/><rect x="32.6" y="2.6" width="1.3" height="6" rx=".6" fill="${K}"/>
      <path d="M28.4 3.4h-2.2M28.4 5.7h-2.2M28.4 8h-2.2M35.6 3.4h2.2M35.6 5.7h2.2M35.6 8h2.2" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M31 9.5V54M32 9.5V54M33 9.5V54" stroke="#F6E7C8" stroke-width=".6"/>
    </g>`),
    // la guitare électrique : corps plein à deux cornes (rouge), plaque blanche, trois micros, boutons, manche d'érable
    guitareelec: svg(`<g transform="rotate(32 32 32) translate(32 32) scale(.9) translate(-32 -32)">
      <path d="M27.4 33.6C26.2 29.4 22.8 26.6 20.4 28.4C18.6 29.8 19.8 33.4 20.4 36C21 39.6 17.6 43 17.6 50C17.6 57.8 23.8 63.2 32 63.2C40.2 63.2 46.4 57.8 46.4 50C46.4 44.4 43.4 41.4 43.4 37.8C43.4 35.4 45 33.2 44 31.6C42.6 29.4 39.2 30.8 36.6 33.6Z" fill="#E5484D" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M27.6 35.2H36.6C39.8 38.6 41 43 40 47.6L38.8 53.6C35.6 57 29.4 57.6 25.8 54.4C23.6 50 24.4 43 27.6 35.2Z" fill="#FBF3E4" stroke="${K}" stroke-width="1.3" stroke-linejoin="round"/>
      <rect x="28.4" y="39.2" width="7.2" height="2.4" rx="1.2" fill="${K}"/><rect x="28.4" y="43.8" width="7.2" height="2.4" rx="1.2" fill="${K}"/><rect x="28.4" y="48.4" width="7.2" height="2.4" rx="1.2" fill="${K}"/>
      <rect x="27.6" y="53.2" width="8.8" height="2.2" rx="1" fill="${SILVER}" stroke="${K}" stroke-width="1"/>
      <circle cx="41.2" cy="52.6" r="1.8" fill="${GOLD2}" stroke="${K}" stroke-width="1"/><circle cx="38.6" cy="56.8" r="1.8" fill="${GOLD2}" stroke="${K}" stroke-width="1"/>
      <path d="M30 9.2h4l.4 26.4h-4.8z" fill="#F2C987" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M30.2 14.5h3.8M30.1 19.5h4M30 24.5h4.2M30 29.5h4.3" stroke="#9A6A34" stroke-width=".9"/>
      <path d="M30 9.6V2.4C30 1 31.6.3 32.8.8L36.6 2.4C38 3 38.2 4.8 37 5.6L34 9.6Z" fill="#F2C987" stroke="${K}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M30 2.6h-2.2M30 4.9h-2.2M30 7.2h-2.2" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M31.2 9.6V54M32 9.6V54M32.8 9.6V54" stroke="${K}" stroke-width=".45" opacity=".6"/>
    </g>`),
    piano: svg(`<rect x="5" y="13" width="54" height="37" rx="5" fill="${K}"/>
      <rect x="9" y="17" width="46" height="4" rx="2" fill="${GOLD}"/>
      <rect x="8.5" y="24" width="47" height="22.5" rx="2" fill="#fff"/>
      <path d="M15.2 24V46.5M21.9 24V46.5M28.6 24V46.5M35.4 24V46.5M42.1 24V46.5M48.8 24V46.5" stroke="${K}" stroke-width="1.3"/>
      <rect x="13.1" y="24" width="4.2" height="13.5" rx="1" fill="${K}"/><rect x="19.8" y="24" width="4.2" height="13.5" rx="1" fill="${K}"/>
      <rect x="33.3" y="24" width="4.2" height="13.5" rx="1" fill="${K}"/><rect x="40" y="24" width="4.2" height="13.5" rx="1" fill="${K}"/><rect x="46.7" y="24" width="4.2" height="13.5" rx="1" fill="${K}"/>`),
    xylophone: svg(`<path d="M7 25L57 31.5M7 47L57 40.5" stroke="#8A5A3C" stroke-width="3" stroke-linecap="round"/>
      ${['#E5484D', '#F2803C', '#F5C32C', '#4CAF5A', '#1FA7A0', '#3E6FD8', '#8B57C9'].map((c, k) => `<rect x="${(8.6 + k * 6.9).toFixed(1)}" y="${(19 + k * 1.9).toFixed(1)}" width="5.4" height="${(34 - k * 3.8).toFixed(1)}" rx="1.6" fill="${c}" stroke="${K}" stroke-width="1.5"/>`).join('')}
      <path d="M42 58.5L55 45M33 60L49 47.5" stroke="#8A5A3C" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="55.6" cy="44.4" r="3.6" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/><circle cx="49.6" cy="46.9" r="3.6" fill="${GOLD2}" stroke="${K}" stroke-width="1.6"/>`),
    voix: svg(`<circle cx="27" cy="36" r="17" fill="#FFD7AE" stroke="${K}" stroke-width="2.2"/>
      <path d="M10.6 32C11.6 21.4 19.4 17.4 27.6 17.6C35.6 18 41.8 22.4 43 30.6C38.2 25.6 31.2 23.6 24.2 25.4C19 26.6 14.8 28.8 10.6 32Z" fill="#8A5A3C" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M18.4 34.4q2.6-2.6 5.2 0M30.4 34.4q2.6-2.6 5.2 0" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="17.6" cy="41" r="2.6" fill="#F59AA0"/><circle cx="36.4" cy="41" r="2.6" fill="#F59AA0"/>
      <ellipse cx="27" cy="45" rx="3.8" ry="4.6" fill="${K}"/><ellipse cx="27" cy="47.4" rx="2.3" ry="1.6" fill="#E5484D"/>
      ${note(50, 9, '#3E6FD8')}${note(57, 26, '#E5484D', 0.8)}`),
    none: svg(`<ellipse cx="22" cy="46" rx="8.4" ry="6.2" transform="rotate(-20 22 46)" fill="${K}"/>
      <rect x="28" y="11" width="3.4" height="35" rx="1.2" fill="${K}"/>
      <path d="M31.4 11C34.2 17.4 42.6 19.6 40.6 30C39.6 25 35.6 22 31.4 21Z" fill="${K}"/>
      <circle cx="47" cy="41" r="11" fill="#E5484D" stroke="${K}" stroke-width="2"/>
      <path d="M43 38.2q0-4.2 4-4.2t4 3.6c0 3-3.6 3.2-3.6 6.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47.4" cy="47.6" r="1.7" fill="#fff"/>`),
  };
})();
