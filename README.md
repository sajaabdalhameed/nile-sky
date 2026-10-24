## Name : Saja abdalhameed _ IT (Seventh Semester)

Project 2 (WeatherMap)


# Nile Sky (WeatherMap SPA)

A client-side single page app: type a place (or tap the map) and see its live weather in a popup on the map. Built with pure HTML5, CSS3 and asynchronous vanilla JavaScript. No frameworks, no jQuery.

**Live demo:** https://sajaabdalhameed.github.io/nile-sky/

## APIs used
- **OpenWeatherMap Current Weather** (`/data/2.5/weather`), needs a free API key.
- **Nominatim (OpenStreetMap)** for geocoding, no key needed.
- **Leaflet.js + OpenStreetMap tiles** for the map, no key needed.
- **Official OpenWeatherMap weather icons** (`openweathermap.org/img/wn/`), shown in the popup card, no extra key needed.

## Setup
1. Clone the repository.
2. Create a free account at openweathermap.org and copy your API key (new keys can take a while to activate).
3. Open `js/config.js` and set `owmKey` to your own API key (the file already contains the key I used for development; replace it with yours if it stops working).
4. Open `index.html` with a local server (for example the VS Code Live Server extension), or enable GitHub Pages (Settings > Pages > deploy from `main` branch, root folder).

## Project structure
```
index.html          page structure only
css/style.css       main styling
js/config.js        API key
js/app.js           main flow: map, geocoding, weather fetch, popup, favourites
js/sky-icons.js     custom SVG weather icons (used on the postcard)
js/mood.js          mood weather sentences
js/sunlight.js      golden hour / blue hour calculation and map overlay
js/postcard.js      shareable weather postcard (Canvas API)
```
All event listeners are registered in JavaScript with `addEventListener`. There are no inline scripts or inline styles.

## How it works
1. Map starts centred on Khartoum (15.5007, 32.5599), zoom 6.
2. On submit, the page does not reload. The place name goes to Nominatim to get lat/lng.
3. Those coordinates go to OpenWeatherMap for temperature, wind, humidity, clouds and status.
4. The map flies to the spot, the old marker is removed, and a new marker opens a popup card with the city name, temperature, clouds, humidity, wind, the official OpenWeatherMap icon and a Share button.
5. A loading spinner shows during requests; failures show an alert card (place not found, 401, 404, 429, network).

## Extra features (novelty)
- **Share** button in the popup: Web Share API, with clipboard fallback.
- **Saved places** stored in LocalStorage, shown as quick-access chips.
- **Tap the map** to get the weather for any point.
- **Advice line** in the popup (heat, dust, rain, cold, or a friendly default on normal days) written for Sudan's climate.
- **Weather postcard:** one button draws a ready-made image (city, map pin coordinates, temperature, weather icon and a mood sentence) and downloads it or shares it. Built with the native Canvas API.
- **Golden hour timer:** calculates the next golden hour and blue hour for the searched place from the sun's position (astronomical formulas written in plain JavaScript) and draws where the sun will be as coloured arcs on the map, plus a line for the sun's direction right now.
- **Mood weather:** turns temperature, humidity, wind and conditions into a short human sentence picked from templates with a randomizer.
- **Weather colours:** the page background changes with the weather (clear, cloudy, rain, dust, night).
- **Custom icons on the postcard:** flame for clear days and a shooting star with stars for clear nights, drawn as inline SVG. The popup card itself uses the official OpenWeatherMap icons, as the specification requires.

## Notes on libraries
Only Leaflet is used (map). The postcard and the sun calculations are written with native browser APIs, so no extra libraries are needed.
