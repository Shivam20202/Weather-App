# SkyCast — Weather Forecast Application

A clean, responsive weather app built with HTML, Tailwind CSS, vanilla CSS, and JavaScript. It fetches real-time weather data and 5-day forecasts using the OpenWeatherMap API.

---

# GitHub Link

https://github.com/Shivam20202/Weather-App

## Features

- **City search** — find weather for any city worldwide
- **Current location** — one-tap geolocation weather
- **5-day forecast** — daily cards with temperature, wind, and humidity
- **Recent searches** — dropdown of recently searched cities (stored in localStorage)
- **°C / °F toggle** — switch units on today's temperature
- **Dynamic backgrounds** — visuals change based on weather condition (rain, sun, snow, clouds)
- **Heat alert** — banner appears automatically when temperature exceeds 40°C
- **Responsive** — works on desktop, iPad Mini, and iPhone SE
- **No alert() popups** — all errors shown via custom UI dialogs

---

## Setup

### 1. Get an API Key

Sign up for a free account at [OpenWeatherMap](https://openweathermap.org/api) and copy your API key from the dashboard. The free tier includes current weather and 5-day forecasts.

### 2. Add Your API Key

Open `app.js` and replace the placeholder on line 19:

```js
const API_KEY = 'YOUR_API_KEY_HERE';
```

with your actual key:

```js
const API_KEY = 'abc123youractualkey';
```

### 3. Run the App

Since the app uses only HTML, CSS, and JavaScript (no build step), you can open it directly:

**Option A — Open in browser:**
Double-click `index.html` to open it in your browser.

**Option B — Local server (recommended for geolocation to work on some browsers):**

```bash
# Using Python
python3 -m http.server 3000

# Using Node.js (if you have npx)
npx serve .
```

Then visit `http://localhost:3000` in your browser.

> **Note:** Geolocation requires HTTPS or localhost. If you open the file directly via `file://`, the "Use My Current Location" button may be blocked by your browser.

---

## Project Structure

```
weather-app/
├── index.html      # App markup and layout
├── style.css       # Custom styles, animations, responsive rules
├── app.js          # All JavaScript logic, API calls, event handling
└── README.md       # This file
```

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | App structure and semantic markup |
| Tailwind CSS (CDN) | Utility classes for layout and spacing |
| Vanilla CSS | Custom design — glassmorphism, animations, backgrounds |
| Vanilla JavaScript (ES6+) | API calls, DOM updates, localStorage |
| OpenWeatherMap API | Live weather data and forecasts |
| Google Fonts (Syne + DM Sans) | Typography |

---

## API Reference

This app uses two endpoints from the [OpenWeatherMap API](https://openweathermap.org/api):

- `GET /weather` — current weather by city name or coordinates
- `GET /forecast` — 5-day, 3-hour forecast by city name or coordinates

Both endpoints return weather condition IDs used for emoji mapping and dynamic backgrounds.

---

## Git Commit History (suggested)

When tracking this with Git, here is a meaningful commit sequence to follow:

1. `init: set up project folder and files`
2. `html: add base page structure and semantic layout`
3. `html: add search panel, weather card, and forecast sections`
4. `html: add popup dialog and heat alert banner`
5. `css: set up CSS variables, body, and background layers`
6. `css: style search panel and input components`
7. `css: style current weather card and stat chips`
8. `css: style 5-day forecast grid and cards`
9. `css: add responsive breakpoints for iPad Mini and iPhone SE`
10. `css: add animations — fadeUp, cardReveal, spinner, iconPulse`
11. `js: set up API config and fetch functions for city and coordinates`
12. `js: implement render functions for current weather and forecast`
13. `js: add localStorage for recent cities and dropdown`
14. `js: add unit toggle, heat alert, dynamic backgrounds, and error handling`
15. `readme: write setup instructions and usage documentation`

---

## Known Limitations

- The free OpenWeatherMap tier allows up to 60 API calls per minute.
- The Geolocation feature requires HTTPS or localhost (browser security requirement).
- Forecast cards show one reading per day, selected near midday for accuracy.

---

## Author

Built as part of the Internshala Weather Forecast Project assignment.
