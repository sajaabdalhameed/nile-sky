(() => {
  'use strict';

  const kit = (window.NileSkyKit = window.NileSkyKit || {});
  const WIDTH = 1080;
  const HEIGHT = 1350;

  const SKINS = {
    day: { from: '#ffb347', to: '#e8541a', ink: '#ffffff' },
    night: { from: '#0f2a43', to: '#2b1b3d', ink: '#ffffff' },
    cloud: { from: '#8fa6bd', to: '#4c5f78', ink: '#ffffff' },
    rain: { from: '#3d6a8f', to: '#1b2f4a', ink: '#ffffff' },
    storm: { from: '#3a3f5c', to: '#14172b', ink: '#ffffff' },
    dust: { from: '#e6b86a', to: '#a8692a', ink: '#ffffff' },
    snow: { from: '#e3f0fa', to: '#8fb0cf', ink: '#14213d' }
  };

  function skinFor(report) {
    const code = report.weather[0].icon;
    const night = code.endsWith('n');
    switch (code.slice(0, 2)) {
      case '11': return SKINS.storm;
      case '09':
      case '10': return SKINS.rain;
      case '13': return SKINS.snow;
      case '50': return SKINS.dust;
      case '01':
      case '02': return night ? SKINS.night : SKINS.day;
      default: return SKINS.cloud;
    }
  }

  function loadSvgImage(svgText) {
    return new Promise((resolve, reject) => {
      const sized = svgText.replace('width="64" height="64"', 'width="480" height="480"');
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('icon failed to load'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
    });
  }

  function drawPin(ctx, x, y, scale, colour) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-14, -18, -18, -28, -18, -36);
    ctx.arc(0, -36, 18, Math.PI, 0);
    ctx.bezierCurveTo(18, -28, 14, -18, 0, 0);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -36, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.restore();
  }

  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    text.split(/\s+/).forEach((word) => {
      const attempt = line ? line + ' ' + word : word;
      if (ctx.measureText(attempt).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function coordsText(lat, lng) {
    return Math.abs(lat).toFixed(2) + '°' + (lat >= 0 ? 'N' : 'S') + '   ' +
      Math.abs(lng).toFixed(2) + '°' + (lng >= 0 ? 'E' : 'W');
  }

  async function drawPostcard(job) {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load('800 100px Cairo');
      await document.fonts.load('600 40px Cairo');
    }

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    const skin = skinFor(job.report);
    const centreX = WIDTH / 2;

    const backdrop = ctx.createLinearGradient(0, 0, WIDTH * 0.3, HEIGHT);
    backdrop.addColorStop(0, skin.from);
    backdrop.addColorStop(1, skin.to);
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = skin.ink;
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.arc(centreX, 330, 250, 0, Math.PI * 2);
    ctx.fill();
    const icon = await loadSvgImage(kit.iconSvg(job.report));
    ctx.drawImage(icon, centreX - 220, 110, 440, 440);

    ctx.textAlign = 'center';
    ctx.direction = 'ltr';
    ctx.fillStyle = skin.ink;

    let size = 110;
    ctx.font = '800 ' + size + 'px Cairo, sans-serif';
    while (ctx.measureText(job.spot.title).width > WIDTH - 160 && size > 40) {
      size -= 6;
      ctx.font = '800 ' + size + 'px Cairo, sans-serif';
    }
    ctx.fillText(job.spot.title, centreX, 700);

    ctx.font = '600 38px Cairo, sans-serif';
    const coords = coordsText(job.spot.lat, job.spot.lng);
    const coordsWidth = ctx.measureText(coords).width;
    drawPin(ctx, centreX - coordsWidth / 2 - 34, 772, 0.9, '#ff9f1c');
    ctx.fillText(coords, centreX + 6, 765);

    ctx.font = '800 190px Cairo, sans-serif';
    ctx.fillText(Math.round(job.report.main.temp) + '°C', centreX, 940);

    const desc = job.report.weather[0].description;
    ctx.font = '600 46px Cairo, sans-serif';
    ctx.fillText(desc.charAt(0).toUpperCase() + desc.slice(1), centreX, 1010);

    const isArabic = /[\u0600-\u06FF]/.test(job.mood);
    ctx.direction = isArabic ? 'rtl' : 'ltr';
    ctx.font = '600 44px Cairo, sans-serif';
    wrapLines(ctx, job.mood, WIDTH - 220).slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, centreX, 1095 + i * 58);
    });

    ctx.direction = 'ltr';
    ctx.font = '600 34px Cairo, sans-serif';
    ctx.fillText(job.light.goldenLine, centreX, 1262);

    ctx.globalAlpha = 0.8;
    ctx.font = '600 30px Cairo, sans-serif';
    ctx.fillText('Nile Sky  ·  ' + location.host + location.pathname.replace(/index\.html$/, ''), centreX, 1310);
    ctx.globalAlpha = 1;

    return canvas;
  }

  kit.savePostcard = async (job) => {
    const canvas = await drawPostcard(job);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('postcard could not be encoded');

    const safeName = job.spot.title.replace(/[^\w\u0600-\u06FF]+/g, '-');
    const file = new File([blob], 'nile-sky-' + safeName + '.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Nile Sky',
          text: job.spot.title + ': ' + Math.round(job.report.main.temp) + '°C. ' + job.mood
        });
        return 'shared';
      } catch (e) {
        if (e.name === 'AbortError') return 'cancelled';
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  };
})();
