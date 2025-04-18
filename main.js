const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        frame: false, // Optional: rahmenlos
        show: false,  // Wir zeigen es erst bei Shortcut
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile('index.html');

    // Fenster toggeln (zeigen/verstecken)
    globalShortcut.register('Super+N', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    // Tray-Symbol (Icon oben)
    tray = new Tray(path.join(__dirname, 'icon.png')); // Setze eigenes Icon
    const contextMenu = Menu.buildFromTemplate([
        { label: 'News-Tab öffnen', click: () => mainWindow.show() },
        { label: 'Beenden', click: () => app.quit() }
    ]);
    tray.setToolTip('News Tab');
    tray.setContextMenu(contextMenu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // Auf Linux kannst du das offen lassen, wenn du willst
});


function getWeatherDescription(code) {
    switch (code) {
        case 0:
            return '<img src="images/sun.png" alt="Klarer Himmel" class="wetterIcon">';
        case 1:
            return '<img src="images/partly-cloudy-day.png" alt="Überwiegend klar" class="wetterIcon">';
        case 2:
            return '<img src="images/partly-cloudy-day.png" alt="Teilweise bewölkt" class="wetterIcon">';
        case 3:
            return '<img src="images/clouds.png" alt="Bedeckt" class="wetterIcon">';
        case 45:
            return '<img src="images/fog-day.png" alt="Nebelig" class="wetterIcon">';
        case 48:
            return '<img src="images/fog-day.png" alt="Nebel mit Reifbildung" class="wetterIcon">';
        case 51:
            return '<img src="images/light-rain.png" alt="Leichter Nieselregen" class="wetterIcon">';
        case 53:
            return '<img src="images/moderate-rain.png" alt="Mäßiger Nieselregen" class="wetterIcon">';
        case 55:
            return '<img src="images/heavy-rain.png" alt="Starker Nieselregen" class="wetterIcon">';
        case 56:
            return '<img src="images/sleet.png" alt="Leichter gefrierender Nieselregen" class="wetterIcon">';
        case 57:
            return '<img src="images/sleet.png" alt="Starker gefrierender Nieselregen" class="wetterIcon">';
        case 61:
            return '<img src="images/light-rain.png" alt="Leichter Regen" class="wetterIcon">';
        case 63:
            return '<img src="images/moderate-rain.png" alt="Mäßiger Regen" class="wetterIcon">';
        case 65:
            return '<img src="images/heavy-rain.png" alt="Starker Regen" class="wetterIcon">';
        case 66:
            return '<img src="images/sleet.png" alt="Leichter gefrierender Regen" class="wetterIcon">';
        case 67:
            return '<img src="images/sleet.png" alt="Starker gefrierender Regen" class="wetterIcon">';
        case 71:
            return '<img src="images/light-snow.png" alt="Leichter Schneefall" class="wetterIcon">';
        case 73:
            return '<img src="images/snow.png" alt="Mäßiger Schneefall" class="wetterIcon">';
        case 75:
            return '<img src="images/snow-storm.png" alt="Starker Schneefall" class="wetterIcon">';
        case 77:
            return '<img src="images/snow.png" alt="Schneegriesel" class="wetterIcon">';
        case 80:
            return '<img src="images/light-rain.png" alt="Leichte Regenschauer" class="wetterIcon">';
        case 81:
            return '<img src="images/moderate-rain.png" alt="Mäßige Regenschauer" class="wetterIcon">';
        case 82:
            return '<img src="images/heavy-rain.png" alt="Starke Regenschauer" class="wetterIcon">';
        case 85:
            return '<img src="images/light-snow.png" alt="Leichte Schneeschauer" class="wetterIcon">';
        case 86:
            return '<img src="images/snow-storm.png" alt="Starke Schneeschauer" class="wetterIcon">';
        case 95:
            return '<img src="images/storm.png" alt="Gewitter" class="wetterIcon">';
        case 96:
            return '<img src="images/storm-with-heavy-rain.png" alt="Gewitter mit leichtem Hagel" class="wetterIcon">';
        case 99:
            return '<img src="images/storm-with-heavy-rain.png" alt="Gewitter mit starkem Hagel" class="wetterIcon">';
        default:
            return '<img src="images/question-mark.png" alt="Unbekanntes Wetter" class="wetterIcon">';
    }
}

async function fetchWeather(lat, lon) {
    if (lat === 0 || lon === 0) {
        console.error('Ungültige Koordinaten:', lat, lon);
        return;
    }
    if (saved.lat !== 0 && saved.lon !== 0) {
        lat = saved.lat;
        lon = saved.lon
    }
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,rain,weather_code&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum&timezone=Europe%2FBerlin&forecast_days=1&models=best_match`, {
            headers: {
                'Accept': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`Weather API Fehler: ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.current) {
            throw new Error('Ungültige Wetterdaten erhalten');
        }
        return data;
    } catch (error) {
        console.error('Fehler beim Abrufen der Wetterdaten:', error);
        throw error; // Fehler weiterleiten
    }
}

async function displayWeather(data) {
    const weatherDisplay = document.getElementById('weather');
    if (!weatherDisplay) {
        console.error('Wetter-Anzeige Element nicht gefunden');
        return;
    }
    weatherDisplay.innerHTML = '';

    try {
        if (!data || !data.current) {
            throw new Error('Keine Wetterdaten verfügbar');
        }
        const current = data.current;

        const container = document.createElement('div');
        container.className = 'weather-container';

        const containerNow = document.createElement('div');
        containerNow.className = 'weather-now';

        try {
            const weatherCode = current.weather_code || 3;
            const iconHTML = getWeatherDescription(weatherCode);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = iconHTML;
            const iconElement = tempDiv.firstElementChild;

            if (iconElement) {
                containerNow.appendChild(iconElement);
            } else {
                console.warn('Ungültiges Wetter-Icon für Code:', weatherCode);
                const fallbackIcon = document.createElement('img');
                fallbackIcon.src = 'images/clouds.png';
                fallbackIcon.alt = 'Wetter';
                fallbackIcon.className = 'wetterIcon';
                containerNow.appendChild(fallbackIcon);
            }
        } catch (error) {
            console.error('Fehler beim Erstellen des Wetter-Icons:', error);
        }

        const temperatureText = document.createElement('p');
        temperatureText.className = 'temperature';
        temperatureText.textContent = `${current.temperature_2m.toFixed(1)}°C`;
        containerNow.appendChild(temperatureText);

        if (current.apparent_temperature !== undefined) {
            const feelsLikeText = document.createElement('p');
            feelsLikeText.className = 'feels-like';
            feelsLikeText.textContent = `Gefühlt: ${current.apparent_temperature.toFixed(1)}°C`;
            containerNow.appendChild(feelsLikeText);
        }

        if (current.rain !== undefined) {
            const rainText = document.createElement('p');
            rainText.className = 'rain';
            rainText.textContent = `Niederschlag: ${current.rain.toFixed(1)} mm/h`;
            containerNow.appendChild(rainText);
        }

        if (current.wind_speed_10m !== undefined) {
            const windText = document.createElement('p');
            windText.className = 'wind';
            windText.textContent = `Wind: ${Math.round(current.wind_speed_10m)} km/h`;
            containerNow.appendChild(windText);
        }
        container.appendChild(containerNow);

        if (data.hourly && data.hourly.time && data.hourly.weather_code) {
            const forecastContainer = document.createElement('div');
            forecastContainer.className = 'forecast-container';

            const forecastTitle = document.createElement('h3');
            const title = document.createElement('div');
            title.className = 'forecast-title';
            forecastTitle.textContent = 'Prognose für die nächsten Stunden';
            title.appendChild(forecastTitle);
            forecastContainer.appendChild(title);

            const prognose = document.createElement('div');
            prognose.className = 'forecast';

            const now = new Date();
            const currentHour = new Date(now.setMinutes(0, 0, 0));

            for (let i = 0; i < 6; i++) { // Zeige Prognose für die nächsten 6 Stunden
                const forecastTime = new Date(currentHour);
                forecastTime.setHours(currentHour.getHours() + i);
                const forecastCode = data.hourly.weather_code[i];
                const forecastTemp = data.hourly.temperature_2m[i];
                const forecastItem = document.createElement('div');
                forecastItem.className = 'forecast-item';
                const timeText = document.createElement('p');
                timeText.className = 'forecast-time';
                timeText.textContent = forecastTime.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                forecastItem.appendChild(timeText);

                const iconHTML = getWeatherDescription(forecastCode);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = iconHTML;
                const iconElement = tempDiv.firstElementChild;
                if (iconElement) {
                    forecastItem.appendChild(iconElement);
                }
                const tempText = document.createElement('p');
                tempText.className = 'forecast-temp';
                tempText.textContent = `${forecastTemp.toFixed(1)}°C`;
                forecastItem.appendChild(tempText);
                prognose.appendChild(forecastItem);
            }
            forecastContainer.appendChild(prognose);
            container.appendChild(forecastContainer);
        }
        weatherDisplay.appendChild(container);
    } catch (error) {
        console.error('Fehler beim Anzeigen der Wetterdaten:', error);
        weatherDisplay.innerHTML = `<p class="error">Fehler beim Laden der Wetterdaten: ${error.message}</p>`;
    }
}