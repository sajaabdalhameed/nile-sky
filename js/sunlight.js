(() => {
  'use strict';

  const kit = (window.NileSkyKit = window.NileSkyKit || {});
  const RAD = Math.PI / 180;
  const ARC_RADIUS_KM = 35;
  let arcLayer = null;

  /* ---------- sun position (standard astronomical formulas) ---------- */
  function solarPosition(when, lat, lng) {
    const days = when.getTime() / 86400000 + 2440587.5 - 2451545.0;
    const anomaly = RAD * (357.5291 + 0.98560028 * days);
    const centre = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
    const eclipticLng = anomaly + centre + RAD * 102.9372 + Math.PI;
    const tilt = RAD * 23.4397;
    const declination = Math.asin(Math.sin(tilt) * Math.sin(eclipticLng));
    const rightAscension = Math.atan2(Math.sin(eclipticLng) * Math.cos(tilt), Math.cos(eclipticLng));
    const sidereal = RAD * (280.16 + 360.9856235 * days) + RAD * lng;
    const hourAngle = sidereal - rightAscension;
    const phi = RAD * lat;

    const altitude = Math.asin(
      Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle)
    );
    // measured clockwise from north
    const azimuth = Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi)
    ) + Math.PI;

    return { altitude: altitude / RAD, azimuth: ((azimuth / RAD) % 360 + 360) % 360 };
  }

  /* ---------- find golden / blue hour windows in the next 24 h ---------- */
  function scanLight(lat, lng, startMs) {
    const stepMs = 3 * 60 * 1000;
    const steps = 480;
    const found = [];
    let open = null;
    let prevAz = 0;

    for (let i = 0; i <= steps; i++) {
      const t = startMs + i * stepMs;
      const sun = solarPosition(new Date(t), lat, lng);
      let kind = null;
      if (sun.altitude >= -4 && sun.altitude < 6) kind = 'golden';
      else if (sun.altitude >= -8 && sun.altitude < -4) kind = 'blue';

      if (open && open.kind !== kind) {
        open.to = t;
        open.azTo = prevAz;
        found.push(open);
        open = null;
      }
      if (!open && kind) open = { kind: kind, from: t, azFrom: sun.azimuth };
      prevAz = sun.azimuth;
    }
    if (open) {
      open.to = startMs + steps * stepMs;
      open.azTo = prevAz;
      found.push(open);
    }
    return found;
  }

  function clock(ms, tzSeconds) {
    const shifted = new Date(ms + tzSeconds * 1000);
    return String(shifted.getUTCHours()).padStart(2, '0') + ':' + String(shifted.getUTCMinutes()).padStart(2, '0');
  }

  function untilText(ms) {
    const mins = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? h + ' h ' + m + ' min' : m + ' min';
  }

  function describe(label, seg, now, tz) {
    if (!seg) return label + ': none in the next 24 h';
    if (seg.from <= now) return label + ' now, until ' + clock(seg.to, tz);
    return label + ' ' + clock(seg.from, tz) + ' – ' + clock(seg.to, tz) + ' (in ' + untilText(seg.from - now) + ')';
  }

  kit.lightInfo = (spot, report) => {
    const now = Date.now();
    const tz = report.timezone || 0;
    const all = scanLight(spot.lat, spot.lng, now);
    const golden = all.find((s) => s.kind === 'golden' && s.to > now);
    const blue = all.find((s) => s.kind === 'blue' && s.to > now);
    return {
      arcs: [golden, blue].filter(Boolean),
      goldenLine: describe('Golden hour', golden, now, tz),
      blueLine: describe('Blue hour', blue, now, tz)
    };
  };

  kit.lightRows = (light) => {
    const box = document.createElement('div');
    box.className = 'skycard__light';
    [['golden', light.goldenLine], ['blue', light.blueLine]].forEach(([kind, text]) => {
      const row = document.createElement('p');
      row.dataset.kind = kind;
      row.textContent = text;
      box.append(row);
    });
    return box;
  };

  /* ---------- map overlay ---------- */
  function stepFrom(lat, lng, bearingDeg, km) {
    const d = km / 6371;
    const b = bearingDeg * RAD;
    const lat1 = lat * RAD;
    const lng1 = lng * RAD;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b));
    const lng2 = lng1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return [lat2 / RAD, lng2 / RAD];
  }

  function sectorPoints(spot, azFrom, azTo) {
    let delta = (((azTo - azFrom) % 360) + 360) % 360;
    if (delta > 180) delta -= 360;
    const mid = azFrom + delta / 2;
    const half = Math.max(Math.abs(delta) / 2, 4); // keep it visible even when narrow
    const points = [[spot.lat, spot.lng]];
    for (let k = 0; k <= 12; k++) {
      points.push(stepFrom(spot.lat, spot.lng, mid - half + (2 * half * k) / 12, ARC_RADIUS_KM));
    }
    return points;
  }

  kit.drawLightArcs = (map, spot, arcs) => {
    if (!arcLayer) arcLayer = L.layerGroup().addTo(map);
    else arcLayer.clearLayers();

    arcs.forEach((seg) => {
      const isGolden = seg.kind === 'golden';
      L.polygon(sectorPoints(spot, seg.azFrom, seg.azTo), {
        color: isGolden ? '#ff9f1c' : '#3d7ea6',
        weight: 2,
        fillColor: isGolden ? '#ffb347' : '#5b8fd1',
        fillOpacity: 0.35
      })
        .bindTooltip(isGolden ? 'Golden hour: where the sun will be' : 'Blue hour: where the sun will be')
        .addTo(arcLayer);
    });

    const sunNow = solarPosition(new Date(), spot.lat, spot.lng);
    if (sunNow.altitude > 0) {
      L.polyline([[spot.lat, spot.lng], stepFrom(spot.lat, spot.lng, sunNow.azimuth, ARC_RADIUS_KM + 10)], {
        color: '#ff9f1c',
        weight: 3,
        dashArray: '6 8'
      })
        .bindTooltip('Sun direction right now')
        .addTo(arcLayer);
    }
  };

  kit.clearArcs = () => {
    if (arcLayer) arcLayer.clearLayers();
  };
})();
