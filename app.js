/**
 * SkyCast Weather App — app.js
 * Uses OpenWeatherMap API
 * 
 * Features:
 *  - Search by city name
 *  - Geolocation-based weather
 *  - Recently searched cities (localStorage)
 *  - 5-day forecast
 *  - °C / °F toggle (today only)
 *  - Dynamic background based on weather condition
 *  - Extreme heat alerts (>40°C)
 *  - Graceful error handling with custom popup
 */

/* =============================================
   CONFIGURATION
   ============================================= */

// Replace with your OpenWeatherMap API key
// Free key at: https://openweathermap.org/api
const API_KEY = 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const MAX_RECENT = 6; // Maximum recent cities stored

/* =============================================
   STATE
   ============================================= */

let currentTempC = null;   // Stores raw Celsius temp for unit conversion
let feelsLikeC = null;     // Feels-like in Celsius
let currentUnit = 'C';     // Active unit
let recentCities = [];     // Recently searched cities list

/* =============================================
   INITIALIZATION
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Load recently searched cities from storage
  loadRecentCities();

  // Allow Enter key to trigger search
  const input = document.getElementById('city-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Show/hide recent dropdown on input focus
  input.addEventListener('focus', () => {
    if (recentCities.length > 0) showRecentDropdown();
  });

  // Close dropdown if user clicks outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-wrapper')) {
      hideRecentDropdown();
    }
  });
});

/* =============================================
   SEARCH HANDLING
   ============================================= */

/**
 * Handles city name search triggered by button or Enter key.
 */
function handleSearch() {
  const input = document.getElementById('city-input');
  const city = input.value.trim();

  // Validate: non-empty
  if (!city) {
    showPopup('⚠️', 'Please enter a city name before searching.');
    return;
  }

  // Validate: basic format (no numbers only, no special chars)
  if (/^\d+$/.test(city)) {
    showPopup('⚠️', 'City name cannot be just numbers. Please enter a valid city name.');
    return;
  }

  hideRecentDropdown();
  fetchWeatherByCity(city);
}

/**
 * Handles geolocation-based weather fetch.
 */
function handleCurrentLocation() {
  if (!navigator.geolocation) {
    showPopup('❌', 'Your browser does not support geolocation. Please search by city name.');
    return;
  }

  showLoading(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    (error) => {
      showLoading(false);
      let msg = 'Unable to get your location.';
      if (error.code === error.PERMISSION_DENIED) {
        msg = 'Location access was denied. Please allow location permission or search by city name.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Location information is unavailable. Please try searching by city name.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'Location request timed out. Please try again.';
      }
      showPopup('📍', msg);
    },
    { timeout: 10000 }
  );
}

/* =============================================
   API CALLS
   ============================================= */

/**
 * Fetches current weather + 5-day forecast by city name.
 * @param {string} city
 */
async function fetchWeatherByCity(city) {
  showLoading(true);
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
    ]);

    await handleAPIResponse(currentRes, forecastRes);
  } catch (err) {
    showLoading(false);
    handleNetworkError(err);
  }
}

/**
 * Fetches current weather + 5-day forecast by coordinates.
 * @param {number} lat
 * @param {number} lon
 */
async function fetchWeatherByCoords(lat, lon) {
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);

    await handleAPIResponse(currentRes, forecastRes);
  } catch (err) {
    showLoading(false);
    handleNetworkError(err);
  }
}

/**
 * Processes API responses and triggers UI update.
 */
async function handleAPIResponse(currentRes, forecastRes) {
  // Handle current weather response
  if (!currentRes.ok) {
    showLoading(false);
    if (currentRes.status === 404) {
      showPopup('🔍', 'City not found. Please check the spelling and try again.');
    } else if (currentRes.status === 401) {
      showPopup('🔑', 'Invalid API key. Please check your configuration.');
    } else if (currentRes.status === 429) {
      showPopup('⏳', 'Too many requests. Please wait a moment and try again.');
    } else {
      showPopup('❌', `Weather service error (${currentRes.status}). Please try again later.`);
    }
    return;
  }

  // Handle forecast response
  if (!forecastRes.ok) {
    showLoading(false);
    showPopup('❌', 'Could not load forecast data. Please try again later.');
    return;
  }

  const currentData = await currentRes.json();
  const forecastData = await forecastRes.json();

  showLoading(false);
  renderCurrentWeather(currentData);
  renderForecast(forecastData);
  addToRecentCities(currentData.name);
}

/* =============================================
   RENDER FUNCTIONS
   ============================================= */

/**
 * Renders current weather card.
 * @param {Object} data - OpenWeatherMap current weather data
 */
function renderCurrentWeather(data) {
  const { name, main, weather, wind, visibility } = data;
  const condition = weather[0];

  // Store raw Celsius values for unit toggle
  currentTempC = main.temp;
  feelsLikeC = main.feels_like;
  currentUnit = 'C'; // reset to Celsius

  // Update unit toggle buttons
  document.getElementById('btn-c').classList.add('active');
  document.getElementById('btn-f').classList.remove('active');

  // City & date
  document.getElementById('cw-city').textContent = name;
  document.getElementById('cw-date').textContent = formatDate(new Date());

  // Weather description
  document.getElementById('cw-desc').textContent = capitalise(condition.description);
  document.getElementById('cw-condition').textContent = condition.main;

  // Temperature
  document.getElementById('cw-temp').textContent = `${Math.round(currentTempC)}°C`;

  // Stats
  document.getElementById('cw-humidity').textContent = `${main.humidity}%`;
  document.getElementById('cw-wind').textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`;
  document.getElementById('cw-visibility').textContent = visibility
    ? `${(visibility / 1000).toFixed(1)} km`
    : 'N/A';
  document.getElementById('cw-feels').textContent = `${Math.round(feelsLikeC)}°C`;

  // Icon
  document.getElementById('cw-icon').textContent = getWeatherEmoji(condition.id);

  // Dynamic background based on condition
  applyWeatherBackground(condition.id, condition.main);

  // Show the card
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('current-weather').classList.remove('hidden');

  // Extreme heat alert (>40°C)
  if (currentTempC > 40) {
    showHeatAlert(Math.round(currentTempC));
  } else {
    document.getElementById('heat-alert').classList.add('hidden');
  }
}

/**
 * Renders 5-day forecast grid.
 * @param {Object} data - OpenWeatherMap forecast data
 */
function renderForecast(data) {
  // Group forecast list by day (using noon entries closest to midday)
  const days = {};

  data.list.forEach((entry) => {
    const date = entry.dt_txt.split(' ')[0];
    const hour = parseInt(entry.dt_txt.split(' ')[1].split(':')[0]);

    // Prefer the 12:00 reading per day, or store any if 12:00 not available
    if (!days[date] || Math.abs(hour - 12) < Math.abs(parseInt(days[date].dt_txt.split(' ')[1]) - 12)) {
      days[date] = entry;
    }
  });

  const dayEntries = Object.values(days).slice(0, 5);
  const grid = document.getElementById('forecast-grid');
  grid.innerHTML = '';

  dayEntries.forEach((entry, i) => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.style.animationDelay = `${i * 0.07}s`;

    const date = new Date(entry.dt * 1000);
    const icon = getWeatherEmoji(entry.weather[0].id);
    const temp = Math.round(entry.main.temp);
    const wind = (entry.wind.speed * 3.6).toFixed(1);
    const humidity = entry.main.humidity;

    card.innerHTML = `
      <div class="fc-date">${formatShortDate(date)}</div>
      <div class="fc-icon">${icon}</div>
      <div class="fc-stat">
        <span>🌡️</span>
        <span class="fc-stat-val">${temp}°C</span>
      </div>
      <div class="fc-stat">
        <span>💨</span>
        <span class="fc-stat-val">${wind} km/h</span>
      </div>
      <div class="fc-stat">
        <span>💧</span>
        <span class="fc-stat-val">${humidity}%</span>
      </div>
    `;

    grid.appendChild(card);
  });

  document.getElementById('forecast-section').classList.remove('hidden');
}

/* =============================================
   TEMPERATURE UNIT TOGGLE
   ============================================= */

/**
 * Switches displayed temperature unit.
 * Only affects today's temperature (current weather card).
 * @param {'C'|'F'} unit
 */
function setUnit(unit) {
  if (currentTempC === null) return;
  currentUnit = unit;

  const tempEl = document.getElementById('cw-temp');
  const feelsEl = document.getElementById('cw-feels');

  if (unit === 'C') {
    tempEl.textContent = `${Math.round(currentTempC)}°C`;
    feelsEl.textContent = `${Math.round(feelsLikeC)}°C`;
    document.getElementById('btn-c').classList.add('active');
    document.getElementById('btn-f').classList.remove('active');
  } else {
    const tempF = (currentTempC * 9 / 5) + 32;
    const feelsF = (feelsLikeC * 9 / 5) + 32;
    tempEl.textContent = `${Math.round(tempF)}°F`;
    feelsEl.textContent = `${Math.round(feelsF)}°F`;
    document.getElementById('btn-f').classList.add('active');
    document.getElementById('btn-c').classList.remove('active');
  }
}

/* =============================================
   RECENT CITIES (localStorage)
   ============================================= */

/**
 * Loads recent cities from localStorage.
 */
function loadRecentCities() {
  try {
    const stored = localStorage.getItem('skycast_recent');
    recentCities = stored ? JSON.parse(stored) : [];
  } catch {
    recentCities = [];
  }
}

/**
 * Adds city to recent list and saves to localStorage.
 * @param {string} city
 */
function addToRecentCities(city) {
  // Remove duplicates (case-insensitive)
  recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
  recentCities.unshift(city);

  // Keep only MAX_RECENT entries
  if (recentCities.length > MAX_RECENT) {
    recentCities = recentCities.slice(0, MAX_RECENT);
  }

  try {
    localStorage.setItem('skycast_recent', JSON.stringify(recentCities));
  } catch {
    // Storage unavailable, continue silently
  }

  // Update input value to show normalized city name
  document.getElementById('city-input').value = city;
}

/**
 * Renders and shows the recent cities dropdown.
 */
function showRecentDropdown() {
  if (recentCities.length === 0) return;

  const dropdown = document.getElementById('recent-dropdown');
  dropdown.innerHTML = '';

  recentCities.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.addEventListener('click', () => {
      document.getElementById('city-input').value = city;
      hideRecentDropdown();
      fetchWeatherByCity(city);
    });
    dropdown.appendChild(li);
  });

  dropdown.classList.remove('hidden');
}

/**
 * Hides the recent cities dropdown.
 */
function hideRecentDropdown() {
  document.getElementById('recent-dropdown').classList.add('hidden');
}

/* =============================================
   DYNAMIC BACKGROUNDS
   ============================================= */

/**
 * Applies a weather-based CSS class to <body> for dynamic backgrounds.
 * @param {number} conditionId - OWM weather condition ID
 * @param {string} conditionMain - OWM main condition string
 */
function applyWeatherBackground(conditionId, conditionMain) {
  const body = document.getElementById('app-body');

  // Remove all weather classes
  body.classList.remove('rainy', 'sunny', 'cloudy', 'snowy', 'stormy');

  // Thunderstorm: 200–232
  if (conditionId >= 200 && conditionId < 300) {
    body.classList.add('rainy');
  }
  // Drizzle: 300–321 | Rain: 500–531
  else if ((conditionId >= 300 && conditionId < 400) || (conditionId >= 500 && conditionId < 600)) {
    body.classList.add('rainy');
  }
  // Snow: 600–622
  else if (conditionId >= 600 && conditionId < 700) {
    body.classList.add('snowy');
  }
  // Atmosphere (mist, fog, haze): 700–781
  else if (conditionId >= 700 && conditionId < 800) {
    body.classList.add('cloudy');
  }
  // Clear sky: 800
  else if (conditionId === 800) {
    body.classList.add('sunny');
  }
  // Clouds: 801–804
  else if (conditionId > 800 && conditionId < 900) {
    body.classList.add('cloudy');
  }
}

/* =============================================
   WEATHER EMOJI MAPPING
   ============================================= */

/**
 * Maps OpenWeatherMap condition IDs to emoji icons.
 * @param {number} id - OWM condition ID
 * @returns {string} emoji
 */
function getWeatherEmoji(id) {
  if (id >= 200 && id < 300) return '⛈️';         // Thunderstorm
  if (id >= 300 && id < 400) return '🌦️';         // Drizzle
  if (id >= 500 && id < 510) return '🌧️';         // Rain
  if (id >= 510 && id < 600) return '🌨️';         // Freezing rain
  if (id >= 600 && id < 620) return '❄️';         // Snow
  if (id >= 620 && id < 700) return '🌨️';         // Sleet
  if (id === 701) return '🌫️';                    // Mist
  if (id === 711) return '🌫️';                    // Smoke
  if (id === 721) return '🌫️';                    // Haze
  if (id === 731 || id === 761) return '🌪️';      // Dust
  if (id === 741) return '🌁';                    // Fog
  if (id === 751) return '🌬️';                    // Sand
  if (id === 762) return '🌋';                    // Volcanic ash
  if (id === 771) return '💨';                    // Squalls
  if (id === 781) return '🌪️';                    // Tornado
  if (id === 800) return '☀️';                    // Clear
  if (id === 801) return '🌤️';                    // Few clouds
  if (id === 802) return '⛅';                    // Scattered clouds
  if (id === 803 || id === 804) return '☁️';       // Overcast
  return '🌡️';                                    // Default
}

/* =============================================
   ALERTS
   ============================================= */

/**
 * Shows the heat alert banner.
 * @param {number} temp - Temperature in Celsius
 */
function showHeatAlert(temp) {
  const alert = document.getElementById('heat-alert');
  document.getElementById('heat-alert-text').textContent =
    `🔥 Extreme heat warning! Temperature is ${temp}°C — stay hydrated and avoid direct sun exposure.`;
  alert.classList.remove('hidden');
}

/* =============================================
   POPUP (Error / Info)
   ============================================= */

/**
 * Shows the custom popup dialog.
 * @param {string} icon - Emoji icon
 * @param {string} message - Message text
 */
function showPopup(icon, message) {
  document.getElementById('popup-icon').textContent = icon;
  document.getElementById('popup-message').textContent = message;
  document.getElementById('popup-container').classList.remove('hidden');
}

/**
 * Closes the custom popup dialog.
 */
function closePopup() {
  document.getElementById('popup-container').classList.add('hidden');
}

/* =============================================
   LOADING STATE
   ============================================= */

/**
 * Shows or hides the loading spinner.
 * @param {boolean} show
 */
function showLoading(show) {
  const loader = document.getElementById('loading-state');
  const empty = document.getElementById('empty-state');
  const current = document.getElementById('current-weather');
  const forecast = document.getElementById('forecast-section');

  if (show) {
    loader.classList.remove('hidden');
    empty.classList.add('hidden');
    current.classList.add('hidden');
    forecast.classList.add('hidden');
  } else {
    loader.classList.add('hidden');
  }
}

/* =============================================
   NETWORK ERROR HANDLING
   ============================================= */

/**
 * Handles unexpected network/fetch errors.
 * @param {Error} err
 */
function handleNetworkError(err) {
  console.error('Network error:', err);
  if (!navigator.onLine) {
    showPopup('📡', 'You appear to be offline. Please check your internet connection and try again.');
  } else {
    showPopup('❌', 'Could not connect to the weather service. Please try again in a moment.');
  }
}

/* =============================================
   DATE FORMATTING UTILITIES
   ============================================= */

/**
 * Formats a Date object to a readable long date string.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a Date object to a short date string for forecast cards.
 * @param {Date} date
 * @returns {string}
 */
function formatShortDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Capitalises the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
