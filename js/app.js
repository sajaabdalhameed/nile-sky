(() => {
  'use strict';

  const OWM_KEY = window.NILE_SKY_CONFIG.owmKey;
  const KHARTOUM_VIEW = { lat: 15.5007, lng: 32.5599, zoom: 6 };
  const SHELF_NAME = 'nilesky.savedPlaces';

  const ui = {
    form: document.getElementById('placeForm'),
    box: document.getElementById('placeInput'),
    favBar: document.getElementById('favBar'),
    noticeSlot: document.getElementById('noticeSlot'),
    veil: document.getElementById('busyVeil')
  };

  /* ---------- Phase 1: map init ---------- */
  const radar = L.map('skyMap').setView([KHARTOUM_VIEW.lat, KHARTOUM_VIEW.lng], KHARTOUM_VIEW.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(radar);

  let livePin = null;
  let notifyTimer = null;

  /* ---------- small helpers ---------- */
  function make(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setBusy(isOn) {
    ui.veil.classList.toggle('hidden', !isOn);
  }

  function say(message, mood) {
    clearTimeout(notifyTimer);
    const card = make('div', 'notice notice--' + mood, message);
    // errors are announced right away by screen readers; the rest are polite
    card.setAttribute('role', mood === 'error' ? 'alert' : 'status');
    ui.noticeSlot.replaceChildren(card);
    if (mood === 'ok') {
      notifyTimer = setTimeout(wipeSay, 4000);
    }
  }

  function wipeSay() {
    clearTimeout(notifyTimer);
    ui.noticeSlot.replaceChildren();
  }

  async function pullJson(url) {
    const reply = await fetch(url);
    if (!reply.ok) {
      const failure = new Error('HTTP ' + reply.status);
      failure.httpCode = reply.status;
      throw failure;
    }
    return reply.json();
  }

  function explain(err) {
    if (err.noMatch) return 'We could not find that place. Check the spelling or try a nearby city.';
    if (err.httpCode === 404) return 'The weather service has no data for this spot.';
    if (err.httpCode === 401) return 'The API key was rejected. Check js/config.js (new keys can take a while to activate).';
    if (err.httpCode === 429) return 'Too many requests. Wait a minute and try again.';
    if (err instanceof TypeError && /fetch|network|load failed/i.test(err.message)) {
      return 'Network problem. Check your connection and try again.';
    }
    return 'Something went wrong. Please try again.';
  }

  /* ---------- Phase 2: geocoding (Nominatim) ---------- */
  async function findCoordinates(placeText) {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' +
      encodeURIComponent(placeText) + '&email=sajaabdahamed@gmail.com';
    const hits = await pullJson(url);
    if (!Array.isArray(hits) || hits.length === 0) {
      const miss = new Error('no match');
      miss.noMatch = true;
      throw miss;
    }
    return {
      title: hits[0].display_name.split(',')[0].trim(),
      lat: parseFloat(hits[0].lat),
      lng: parseFloat(hits[0].lon)
    };
  }

  /* ---------- Phase 3: OpenWeatherMap ---------- */
  function fetchSkyReport(lat, lng) {
    const url = 'https://api.openweathermap.org/data/2.5/weather?lat=' + lat +
      '&lon=' + lng + '&appid=' + encodeURIComponent(OWM_KEY) + '&units=metric';
    return pullJson(url);
  }

  function adviceFor(report) {
    const degrees = report.main.temp;
    const family = report.weather[0].main;
    if (family === 'Dust' || family === 'Sand') return 'Dust in the air. Cover your nose and mouth outside.';
    if (degrees >= 43) return 'Dangerous heat. Stay indoors from late morning to late afternoon.';
    if (degrees >= 38) return 'Very hot. Drink water often and avoid the midday sun.';
    if (family === 'Rain' || family === 'Drizzle' || family === 'Thunderstorm') return 'Rain expected. Take an umbrella.';
    if (degrees <= 10) return 'Cold. Wear a warm layer.';
    return 'Pleasant conditions. Enjoy your day.';
  }

  function summaryLine(title, report) {
    const kmh = Math.round(report.wind.speed * 3.6);
    return title + ': ' + Math.round(report.main.temp) + '°C, ' + report.weather[0].description +
      ', humidity ' + report.main.humidity + '%, wind ' + kmh + ' km/h (via Nile Sky)';
  }

  /* ---------- page mood: background colour follows the weather ---------- */
  function skyMoodOf(report) {
    const family = report.weather[0].main;
    const atNight = report.weather[0].icon.endsWith('n');
    if (['Dust', 'Sand', 'Haze', 'Smoke'].includes(family)) return 'dust';
    if (['Rain', 'Drizzle', 'Thunderstorm'].includes(family)) return 'rain';
    if (atNight) return 'night';
    return family === 'Clouds' ? 'cloudy' : 'clear';
  }

  function tintPage(report) {
    document.body.dataset.sky = skyMoodOf(report);
  }

  /* ---------- favourites (LocalStorage) ---------- */
  function readShelf() {
    try {
      return JSON.parse(localStorage.getItem(SHELF_NAME)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeShelf(list) {
    try {
      localStorage.setItem(SHELF_NAME, JSON.stringify(list));
    } catch (e) {
      say('Could not save your places in this browser.', 'warn');
    }
  }

  function saveSpot(spot) {
    const shelf = readShelf();
    if (shelf.some((item) => item.title === spot.title)) {
      say(spot.title + ' is already saved.', 'warn');
      return;
    }
    shelf.push(spot);
    writeShelf(shelf);
    paintShelf();
    say(spot.title + ' saved to your places.', 'ok');
  }

  function dropSpot(title) {
    writeShelf(readShelf().filter((item) => item.title !== title));
    paintShelf();
  }

  function paintShelf() {
    const shelf = readShelf();
    ui.favBar.replaceChildren();
    shelf.forEach((spot) => {
      const chip = make('span', 'chip');
      const go = make('button', 'chip__go', spot.title);
      go.type = 'button';
      go.addEventListener('click', () => runJob(() => showWeatherFor(spot)));
      const drop = make('button', 'chip__drop', '×');
      drop.type = 'button';
      drop.setAttribute('aria-label', 'Remove ' + spot.title);
      drop.addEventListener('click', () => dropSpot(spot.title));
      chip.append(go, drop);
      ui.favBar.append(chip);
    });
  }

  /* ---------- sharing ---------- */
  async function shareLine(line) {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Nile Sky', text: line });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(line);
      say('Weather summary copied. Paste it anywhere to share.', 'ok');
    } catch (e) {
      say('Could not copy automatically: ' + line, 'warn');
    }
  }

  /* ---------- Phase 5: popup card ---------- */
  function buildCard(spot, report) {
    const card = make('div', 'skycard');
    card.append(make('h2', 'skycard__place', spot.title));

    const now = make('div', 'skycard__now');
    // official OpenWeatherMap icon, as the specification requires
    const owmIcon = make('img', 'skycard__icon');
    owmIcon.src = 'https://openweathermap.org/img/wn/' + report.weather[0].icon + '@2x.png';
    owmIcon.alt = report.weather[0].main;
    now.append(
      owmIcon,
      make('span', 'skycard__deg', Math.round(report.main.temp) + '°C')
    );
    card.append(now, make('p', 'skycard__desc', report.weather[0].description));

    const facts = make('dl', 'skycard__facts');
    const rows = [
      ['Clouds', report.clouds.all + '%'],
      ['Humidity', report.main.humidity + '%'],
      ['Wind', Math.round(report.wind.speed * 3.6) + ' km/h']
    ];
    rows.forEach(([label, value]) => {
      const cell = make('div');
      cell.append(make('dt', null, label), make('dd', null, value));
      facts.append(cell);
    });

    const moodText = NileSkyKit.moodLine(report);
    const moodBox = make('p', 'skycard__mood', moodText);
    moodBox.dir = 'auto';
    const light = NileSkyKit.lightInfo(spot, report);

    card.append(
      facts,
      moodBox,
      NileSkyKit.lightRows(light),
      make('p', 'skycard__tip', adviceFor(report))
    );

    const actions = make('div', 'skycard__actions');
    const shareBtn = make('button', 'skycard__btn', 'Share');
    shareBtn.type = 'button';
    shareBtn.addEventListener('click', () => shareLine(summaryLine(spot.title, report)));
    const saveBtn = make('button', 'skycard__btn skycard__btn--alt', 'Save place');
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', () => saveSpot(spot));

    const postcardBtn = make('button', 'skycard__btn skycard__btn--wide', 'Weather postcard');
    postcardBtn.type = 'button';
    postcardBtn.addEventListener('click', async () => {
      postcardBtn.disabled = true;
      try {
        const outcome = await NileSkyKit.savePostcard({ spot, report, mood: moodText, light });
        if (outcome === 'downloaded') say('Postcard saved to your downloads.', 'ok');
      } catch (err) {
        console.error(err);
        say('Could not create the postcard. Please try again.', 'error');
      } finally {
        postcardBtn.disabled = false;
      }
    });

    actions.append(shareBtn, saveBtn, postcardBtn);
    card.append(actions);
    return card;
  }

  /* ---------- Phase 4: centre + marker ---------- */
  function placePin(spot, report) {
    if (livePin) {
      radar.removeLayer(livePin);
      livePin = null;
    }
    livePin = L.marker([spot.lat, spot.lng]).addTo(radar);
    livePin.bindPopup(buildCard(spot, report), {
      minWidth: 240,
      maxHeight: Math.round(radar.getSize().y * 0.75)
    });
    NileSkyKit.drawLightArcs(radar, spot, NileSkyKit.lightInfo(spot, report).arcs);
    tintPage(report);
    radar.once('moveend', () => {
      if (livePin) livePin.openPopup();
    });
    radar.flyTo([spot.lat, spot.lng], 9, { duration: 1.4 });
  }

  async function showWeatherFor(spot) {
    const report = await fetchSkyReport(spot.lat, spot.lng);
    const named = {
      title: spot.title || report.name || 'Pinned spot',
      lat: spot.lat,
      lng: spot.lng
    };
    placePin(named, report);
  }

  async function runJob(job) {
    wipeSay();
    setBusy(true);
    try {
      await job();
    } catch (err) {
      console.error(err);
      say(explain(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  /* ---------- wiring ---------- */
  ui.form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const typed = ui.box.value.trim();
    if (!typed) {
      say('Enter a city or address first.', 'warn');
      return;
    }
    runJob(async () => {
      const spot = await findCoordinates(typed);
      await showWeatherFor(spot);
    });
  });

  radar.on('click', (ev) => {
    runJob(() => showWeatherFor({ title: null, lat: ev.latlng.lat, lng: ev.latlng.lng }));
  });

  paintShelf();
})();