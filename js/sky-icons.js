(() => {
  'use strict';

  const kit = (window.NileSkyKit = window.NileSkyKit || {});
  const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">';

  // Clear day: a flame instead of a sun
  const FLAME =
    '<defs><linearGradient id="nsFlameOuter" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#ff7a1a"/><stop offset="1" stop-color="#d7261e"/></linearGradient></defs>' +
    '<path d="M32 6 C40 18 50 26 50 38 A18 18 0 0 1 14 38 C14 30 20 26 22 18 C26 22 28 24 29 28 C31 20 30 12 32 6 Z" fill="url(#nsFlameOuter)"/>' +
    '<path d="M32 26 C37 33 42 37 42 44 A10 10 0 0 1 22 44 C22 39 27 36 28 31 C30 34 31 30 32 26 Z" fill="#ffb02e"/>' +
    '<path d="M32 38 C35 42 37 45 37 49 A5 5 0 0 1 27 49 C27 46 30 44 32 38 Z" fill="#fff0a8"/>';

  const sparkle = (x, y, scale) =>
    '<path transform="translate(' + x + ' ' + y + ') scale(' + scale + ')" ' +
    'd="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z" fill="#ffe08a"/>';

  // Clear night: stars and a shooting star instead of a moon
  const NIGHT =
    '<defs><linearGradient id="nsMeteorTail" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#ffe08a" stop-opacity="0"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>' +
    '<circle cx="32" cy="32" r="30" fill="#0f1b33"/>' +
    sparkle(46, 16, 1.2) + sparkle(14, 42, 0.9) + sparkle(52, 44, 0.7) + sparkle(24, 12, 0.6) +
    '<path d="M12 18 L38 40" stroke="url(#nsMeteorTail)" stroke-width="3" stroke-linecap="round" fill="none"/>' +
    '<circle cx="40" cy="41.5" r="3.4" fill="#ffffff"/>';

  const cloud = (fill, shiftY) =>
    '<path transform="translate(0 ' + shiftY + ')" ' +
    'd="M18 46 a10 10 0 0 1 0 -20 a14 14 0 0 1 27 -3 a9 9 0 0 1 1 23 Z" ' +
    'fill="' + fill + '" stroke="#9fb0c4" stroke-width="1.5"/>';

  const DROPS =
    '<path d="M24 50 l-3 8 M34 50 l-3 8 M44 50 l-3 8" stroke="#4aa3df" stroke-width="3" stroke-linecap="round" fill="none"/>';

  const BOLT = '<path d="M34 40 L26 54 L33 54 L30 62 L42 47 L35 47 L38 40 Z" fill="#ffc933"/>';

  const FLAKES =
    '<g fill="#ffffff" stroke="#9fb0c4" stroke-width="1">' +
    '<circle cx="24" cy="52" r="2.6"/><circle cx="34" cy="57" r="2.6"/><circle cx="44" cy="52" r="2.6"/></g>';

  const DUST =
    '<g fill="none" stroke="#d9a45b" stroke-width="4" stroke-linecap="round">' +
    '<path d="M10 22 q11 -9 22 0 t22 0"/><path d="M8 34 q12 -9 24 0 t24 0"/><path d="M12 46 q10 -8 20 0 t20 0"/></g>';

  function pickSvg(report) {
    const code = report.weather[0].icon; // e.g. "01d"
    const night = code.endsWith('n');
    let body;
    switch (code.slice(0, 2)) {
      case '01':
        body = night ? NIGHT : FLAME;
        break;
      case '02':
        body = night
          ? NIGHT + cloud('#d5dde8', 6)
          : '<g transform="translate(8 -4) scale(0.75)">' + FLAME + '</g>' + cloud('#e6ecf3', 6);
        break;
      case '03':
      case '04':
        body = cloud('#cfd8e3', 0);
        break;
      case '09':
      case '10':
        body = cloud('#aab8c9', -6) + DROPS;
        break;
      case '11':
        body = cloud('#7d8aa0', -6) + BOLT;
        break;
      case '13':
        body = cloud('#dfe8f2', -6) + FLAKES;
        break;
      default:
        body = DUST;
    }
    return SVG_OPEN + body + '</svg>';
  }

  kit.iconSvg = pickSvg;

  kit.makeIcon = (report) => {
    const holder = document.createElement('span');
    holder.className = 'skycard__icon';
    holder.setAttribute('role', 'img');
    holder.setAttribute('aria-label', report.weather[0].main);
    holder.innerHTML = pickSvg(report); // static trusted markup, no user data
    return holder;
  };
})();
