# Nile Sky (WeatherMap SPA)

A client-side single page app: type a place (or tap the map) and see its live weather in a popup on the map. Built with pure HTML5, CSS3 and asynchronous vanilla JavaScript. No frameworks, no jQuery.

**Live demo:** https://YOUR-USERNAME.github.io/YOUR-REPO/

## APIs used
- **OpenWeatherMap Current Weather** (`/data/2.5/weather`), needs a free API key.
- **Nominatim (OpenStreetMap)** for geocoding, no key needed.
- **Leaflet.js + OpenStreetMap tiles** for the map, no key needed.

## Setup
1. Clone the repository.
2. Create a free account at openweathermap.org and copy your API key (new keys can take a while to activate).
3. Open `js/config.js` and replace `PUT_YOUR_OPENWEATHERMAP_KEY_HERE` with your key.
4. Open `index.html` in a browser, or enable GitHub Pages (Settings > Pages > deploy from `main` branch, root folder).

## Project structure
```
index.html        page structure only
css/style.css     all styling
js/config.js      API key
js/app.js         all behaviour (event listeners added in code)
```

## How it works
1. Map starts centred on Khartoum (15.5007, 32.5599), zoom 6.
2. On submit, the page does not reload. The place name goes to Nominatim to get lat/lng.
3. Those coordinates go to OpenWeatherMap for temperature, wind, humidity, clouds and status.
4. The map flies to the spot, the old marker is removed, and a new marker opens a popup card.
5. A loading spinner shows during requests; failures show an alert card (place not found, 401, 404, 429, network).

## Extra features (novelty)
- **Share** button in the popup: Web Share API, with clipboard fallback.
- **Saved places** stored in LocalStorage, shown as quick-access chips.
- **Tap the map** to get the weather for any point.
- **Advice line** in the popup (heat, dust, rain, cold) written for Sudan's climate.
