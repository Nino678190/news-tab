const saved = {
    lat: 0,
    lon: 0
};

function getWeatherDescription(code) {
    switch (code) {
        case 0:
            return '<img src="icons/weather/sun.png" alt="Klarer Himmel" class="wetterIcon">';
        case 1:
            return '<img src="icons/weather/partly-cloudy-day.png" alt="Überwiegend klar" class="wetterIcon">';
        case 2:
            return '<img src="icons/weather/partly-cloudy-day.png" alt="Teilweise bewölkt" class="wetterIcon">';
        case 3:
            return '<img src="icons/weather/clouds.png" alt="Bedeckt" class="wetterIcon">';
        case 45:
            return '<img src="icons/weather/fog-day.png" alt="Nebelig" class="wetterIcon">';
        case 48:
            return '<img src="icons/weather/fog-day.png" alt="Nebel mit Reifbildung" class="wetterIcon">';
        case 51:
            return '<img src="icons/weather/light-rain.png" alt="Leichter Nieselregen" class="wetterIcon">';
        case 53:
            return '<img src="icons/weather/moderate-rain.png" alt="Mäßiger Nieselregen" class="wetterIcon">';
        case 55:
            return '<img src="icons/weather/heavy-rain.png" alt="Starker Nieselregen" class="wetterIcon">';
        case 56:
            return '<img src="icons/weather/sleet.png" alt="Leichter gefrierender Nieselregen" class="wetterIcon">';
        case 57:
            return '<img src="icons/weather/sleet.png" alt="Starker gefrierender Nieselregen" class="wetterIcon">';
        case 61:
            return '<img src="icons/weather/light-rain.png" alt="Leichter Regen" class="wetterIcon">';
        case 63:
            return '<img src="icons/weather/moderate-rain.png" alt="Mäßiger Regen" class="wetterIcon">';
        case 65:
            return '<img src="icons/weather/heavy-rain.png" alt="Starker Regen" class="wetterIcon">';
        case 66:
            return '<img src="icons/weather/sleet.png" alt="Leichter gefrierender Regen" class="wetterIcon">';
        case 67:
            return '<img src="icons/weather/sleet.png" alt="Starker gefrierender Regen" class="wetterIcon">';
        case 71:
            return '<img src="icons/weather/light-snow.png" alt="Leichter Schneefall" class="wetterIcon">';
        case 73:
            return '<img src="icons/weather/snow.png" alt="Mäßiger Schneefall" class="wetterIcon">';
        case 75:
            return '<img src="icons/weather/snow-storm.png" alt="Starker Schneefall" class="wetterIcon">';
        case 77:
            return '<img src="icons/weather/snow.png" alt="Schneegriesel" class="wetterIcon">';
        case 80:
            return '<img src="icons/weather/light-rain.png" alt="Leichte Regenschauer" class="wetterIcon">';
        case 81:
            return '<img src="icons/weather/moderate-rain.png" alt="Mäßige Regenschauer" class="wetterIcon">';
        case 82:
            return '<img src="icons/weather/heavy-rain.png" alt="Starke Regenschauer" class="wetterIcon">';
        case 85:
            return '<img src="icons/weather/light-snow.png" alt="Leichte Schneeschauer" class="wetterIcon">';
        case 86:
            return '<img src="icons/weather/snow-storm.png" alt="Starke Schneeschauer" class="wetterIcon">';
        case 95:
            return '<img src="icons/weather/storm.png" alt="Gewitter" class="wetterIcon">';
        case 96:
            return '<img src="icons/weather/storm-with-heavy-rain.png" alt="Gewitter mit leichtem Hagel" class="wetterIcon">';
        case 99:
            return '<img src="icons/weather/storm-with-heavy-rain.png" alt="Gewitter mit starkem Hagel" class="wetterIcon">';
        default:
            return '<img src="icons/weather/question-mark.png" alt="Unbekanntes Wetter" class="wetterIcon">';
    }
}

async function fetchWeather(lat, lon) {
    if (lat === 0 || lon === 0) {
        if (saved.lat === 0 || saved.lon === 0) {
            console.error('Ungültige Koordinaten:', lat, lon);
            return;
        }
        lat = saved.lat;
        lon = saved.lon;
    } else {
        // Speichere die gültigen Koordinaten
        saved.lat = lat;
        saved.lon = lon;
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
        displayWeather(data);
    } catch (error) {
        console.error('Fehler beim Abrufen der Wetterdaten:', error);
        throw error;
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
                fallbackIcon.src = 'icons/weather/clouds.png';
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

            for (let i = 0; i < 8; i++) { // Zeige Prognose für die nächsten 8 Stunden
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
    }
}

async function updateWeather(lat, lon) {
    try {
        await fetchWeather(lat, lon);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Wetterdaten:', error);
    }
}


setInterval(updateWeather, 3600000); // Update alle 60 Minuten


const urls = {
    // Nachrichtenquellen
    news: {
        tagesschau: 'https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml',
        spiegel: 'https://www.spiegel.de/schlagzeilen/tops/index.rss',
        zdf: "https://www.zdf.de/rss/zdf/nachrichten",
        t_online: "https://feeds.t-online.de/rss/nachrichten",
        zeit: "https://newsfeed.zeit.de/index",
        sueddeutsche: "https://rss.sueddeutsche.de/rss/Topthemen",
        rbb: "https://www.rbb24.de/aktuell/index.xml/feed=rss.xml"
    },
    
    // Digitales und Tech
    digital: {
        heise: 'https://www.heise.de/rss/heise-atom.xml',
        spiegel_digital: 'https://www.spiegel.de/netzwelt/index.rss',
        t3n: "https://t3n.de/rss.xml",
        golem: "https://rss.golem.de/rss.php?feed=RSS2.0",
        netzpolitik: "https://netzpolitik.org/feed/",
        computerbase: "https://www.computerbase.de/rss/news.xml"
    },
    
    // Wissen & Bildung
    memes: {
        r_dingore: "https://www.reddit.com/r/dingore/.rss",
        r_schkreckl: "https://www.reddit.com/r/schkreckl/.rss",
        r_stvo: "https://www.reddit.com/r/stvo/.rss",
        r_berlin: "https://www.reddit.com/r/berlin/.rss",
    }
}

const icons = {
    news: {
        tagesschau: 'icons/tagesschau.png',
        spiegel: 'icons/spiegel.png',
        zdf: 'icons/zdf.png',
        t_online: 'icons/t_online.svg',
        zeit: 'icons/zeit.png',
        sueddeutsche: 'icons/sueddeutsche.png',
        rbb: 'icons/rbb.png'
    },
    digital: {
        heise: 'icons/heise.png',
        spiegel_digital: 'icons/spiegel.png',
        t3n: 'icons/t3n.png',
        golem: 'icons/golem.png',
        netzpolitik: 'icons/netzpolitik.svg',
        computerbase: 'icons/computerbase.png'
    },
    wissen: {
        r_dingore: 'icons/reddit.png',
        r_schkreckl: 'icons/reddit.png',
        r_stvo: 'icons/reddit.png',
        r_berlin: 'icons/reddit.png',
    }
}

// Simulierte Datenbank für die Frontend-Entwicklung
// Persistente Datenbank für die News-Tab-Anwendung
const db = {
    data: {
        tagesschau: [], spiegel: [], zdf: [], t_online: [], zeit: [], sueddeutsche: [], rbb: [],
        heise: [], spiegel_digital: [], t3n: [], golem: [], netzpolitik: [], computerbase: [],
        r_dingore: [], r_schkreckl: [], r_stvo: [], r_berlin: []
    },
    initialized: false,

    // Initialisierung der Datenbank beim Start
    init: async function () {
        if (this.initialized) return;

        try {
            if (window.api && window.api.getNewsData) {
                const loadedData = await window.api.getNewsData();
                if (loadedData) {
                    this.data = loadedData;
                    console.log("Datenbank wurde erfolgreich initialisiert");
                }
                this.initialized = true;
            } else {
                console.warn("API für Datenbankzugriff nicht verfügbar, verwende lokale Daten");
                // Wir behalten die bereits initialisierten leeren Arrays
                this.initialized = true;
            }
        } catch (error) {
            console.error("Fehler beim Initialisieren der Datenbank:", error);
            // Fehlgeschlagen, aber trotzdem als initialisiert markieren
            this.initialized = true;
        }
    },

    // Daten abrufen
    get: async function (key) {
        if (!this.initialized) await this.init();
        return this.data[key] || [];
    },

    // Daten aktualisieren
    update: async function (updateFn) {
        if (!this.initialized) await this.init();

        // Lokalen Cache aktualisieren
        const result = updateFn(this.data);
        if (result) {
            Object.assign(this.data, result);
        }

        // Änderungen an den Hauptprozess senden
        if (window.api && window.api.saveNewsData) {
            try {
                await window.api.saveNewsData(this.data);
                return true;
            } catch (error) {
                console.error("Fehler beim Speichern der Datenbank:", error);
            }
        }

        return Promise.resolve(true);
    }
};

async function fetchNews(url, origin) {
    try {
        // Prüfen, ob wir bereits Daten für diese Quelle haben
        const existingData = await db.get(origin);
        const lastUpdate = localStorage.getItem(`last_update_${origin}`);
        const now = new Date().getTime();

        // Wenn Daten vorhanden sind und die letzte Aktualisierung weniger als 30 Minuten zurückliegt
        if (existingData.length > 0 && lastUpdate && (now - parseInt(lastUpdate)) < 5 * 60 * 1000) {
            console.log(`Verwende zwischengespeicherte Daten für ${origin} (letzte Aktualisierung vor ${Math.round((now - parseInt(lastUpdate)) / 60000)} Minuten)`);
            return;
        }

        // Ansonsten neue Daten laden
        console.log(`Lade neue Daten für ${origin}...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`News API Fehler: ${response.status}`);
        }
        const text = await response.text();

        // Parsen nach Quelltyp
        switch (origin) {
            case 'heise':
            case 'computerbase':
            case 'r_dingore':
            case 'r_schkreckl':
            case 'r_stvo':
            case 'r_berlin':
                await entryParser(origin, text);
                break;
            default:
                await itemParser(origin, text);
                break;
        }

        // Zeitstempel der letzten Aktualisierung speichern
        localStorage.setItem(`last_update_${origin}`, now.toString());
    } catch (error) {
        console.error(`Fehler beim Abrufen der Nachrichten von ${origin}:`, error);
    }
}

// Periodically check and update news sources in the background
setInterval(() => {
    const now = new Date().getTime();
    const updateInterval = 15 * 60 * 1000; // 30 minutes

    console.log("Checking for background updates...");

    // Iterate through all categories (news, digital, memes)
    for (const category in urls) {
        // Iterate through sources within each category
        for (const key in urls[category]) {
            const lastUpdate = localStorage.getItem(`last_update_${key}`);
            // Check if update is needed (no last update timestamp or cache is older than interval)
            if (!lastUpdate || (now - parseInt(lastUpdate)) > updateInterval) {
                console.log(`Background update triggered for ${key}...`);
                // Fetch news without waiting for it to complete (async background task)
                fetchNews(urls[category][key], key).catch(error => {
                    console.error(`Background update failed for ${key}:`, error);
                });
            }
        }
    }
}, 15 * 60 * 1000); // Check every 15 minutes

async function getNews() {
    const container = document.getElementById('news');
    if (!container) {
        console.error('News-Container nicht gefunden');
        return;
    }

    // UI-Update für die Auswahl
    updateSelectionUI('all');

    container.innerHTML = '<p>Loading articles</p>';

    // Datenbank initialisieren, falls noch nicht geschehen
    await db.init();

    // Paralleles Laden der News-Quellen für bessere Performance
    await Promise.all([
        fetchNews(urls.news.tagesschau, 'tagesschau'),
        fetchNews(urls.news.spiegel, 'spiegel'),
        fetchNews(urls.news.zdf, 'zdf'),
        fetchNews(urls.news.t_online, 't_online'),
        fetchNews(urls.news.zeit, 'zeit'),
        fetchNews(urls.news.sueddeutsche, 'sueddeutsche'),
        fetchNews(urls.news.rbb, 'rbb')
    ]);

    // Daten nach dem Laden abrufen
    const tagesschau = await db.get('tagesschau');
    const spiegel = await db.get('spiegel');
    const zdf = await db.get('zdf');
    const t_online = await db.get('t_online');
    const zeit = await db.get('zeit');
    const sueddeutsche = await db.get('sueddeutsche');
    const rbb = await db.get('rbb');

    const allNews = [...tagesschau, ...spiegel, ...zdf, ...t_online, ...zeit, ...sueddeutsche, ...rbb];
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    renderNewsList(allNews, container);
}

async function getTechnik() {
    const container = document.getElementById('news');
    if (!container) {
        console.error('News-Container nicht gefunden');
        return;
    }

    // UI-Update für die Auswahl
    updateSelectionUI('technic');

    container.innerHTML = '<p>Loading articles</p>';

    // Datenbank initialisieren, falls noch nicht geschehen
    await db.init();
    
    await Promise.all([
        fetchNews(urls.digital.heise, 'heise'),
        fetchNews(urls.digital.spiegel_digital, 'spiegel_digital'),
        fetchNews(urls.digital.t3n, 't3n'),
        fetchNews(urls.digital.golem, 'golem'),
        fetchNews(urls.digital.netzpolitik, 'netzpolitik'),
        fetchNews(urls.digital.computerbase, 'computerbase')
    ]);

    let heise = await db.get('heise');
    let spiegel_digital = await db.get('spiegel_digital');
    let t3n = await db.get('t3n');
    let golem = await db.get('golem');
    let netzpolitik = await db.get('netzpolitik');
    let computerbase = await db.get('computerbase');
    let allNews = [...heise, ...spiegel_digital, ...t3n, ...golem, ...netzpolitik, ...computerbase];

    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    renderNewsList(allNews, container);
}

async function getMemes() {
    const container = document.getElementById('news');
    if (!container) {
        console.error('News-Container nicht gefunden');
        return;
    }

    // UI-Update für die Auswahl
    updateSelectionUI('memes');

    container.innerHTML = '<p>Loading articles</p>';

    // Datenbank initialisieren, falls noch nicht geschehen
    await db.init();

    await Promise.all([
        fetchNews(urls.memes.r_dingore, 'r_dingore'),
        fetchNews(urls.memes.r_schkreckl, 'r_schkreckl'),
        fetchNews(urls.memes.r_stvo, 'r_stvo'),
        fetchNews(urls.memes.r_berlin, 'r_berlin')
    ]);

    let r_dingore = await db.get('r_dingore');
    let r_schkreckl = await db.get('r_schkreckl');
    let r_stvo = await db.get('r_stvo');
    let r_berlin = await db.get('r_berlin');
    let allNews = [...r_dingore, ...r_schkreckl, ...r_stvo, ...r_berlin];

    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    renderNewsList(allNews, container);
}

function updateSelectionUI(selectedId) {
    const allSelections = document.querySelectorAll('.selection');
    allSelections.forEach(item => {
        if (item.id === selectedId) {
            item.classList.remove('none');
        } else {
            item.classList.add('none');
        }
    });
}

async function showMoreText(contentHTML) {
    const descriptionElement = document.querySelector('.news-description');
    if (!descriptionElement) return;

    if (contentHTML) {
        descriptionElement.innerHTML = contentHTML;
    } else {
        descriptionElement.innerHTML += '<p><em>Inhalt konnte nicht geladen werden.</em></p>';
    }
}

document.querySelectorAll(".news-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const url = link.getAttribute("href");
        window.api.openReader(url);
    });
});

function renderNewsList(allNews, container) {
    container.innerHTML = '';
    allNews.slice(0, 25).forEach((item) => {
        let itemObject = document.createElement('article');
        itemObject.className = 'news-item';
        if (item.read) {
            itemObject.classList.add('read');
        }
        let origin = item.origin;
        if (origin.includes('r_')){
            origin = "reddit";
        }
        itemObject.innerHTML = `
            <section class="news-header">
                <img src="${getIconForItem(item)}" alt="${item.origin}" class="news-icon ${origin}">
                <h3 class="news-title">${item.title}</h3>
            </section>
            <section class="news-content ${origin}_article ">
                <p class="news-description">${item.description}</p>
                <a href="${item.link}" target="_blank" class="news-link">Mehr erfahren</a>
            </section>
            <section class="news-footer">
                <p class="news-date">${new Date(item.pubDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</p>
            </section>`;
        
        itemObject.addEventListener('click', () => {
            db.update(({ [item.origin]: items }) => {
                const index = items.findIndex(i => i.link === item.link);
                if (index !== -1) {
                    items[index].read = true;
                }
                return { [item.origin]: items };
            });
            itemObject.classList.add('read');
            container.innerHTML = '';
            let text = item.article || item.description;
            if (text === null) {
                text = item.description;
            }
            if (item.read){
                itemObject.classList.add('read');
            }
            container.innerHTML = `
            <section class="news-big-header">
                <button class="back-button" onclick="getNews()">Zurück</button>
                <img src="${item.image}" alt="${item.title}" class="news-image">
            </section>
            <section class="news-big-content">
                <h2 class="news-title">${item.title}</h2>
                <p class="news-description">${text}</p>
            </section>
            <section class="news-big-footer">
                <button class="news-read-more" id="readMoreButton">Mehr lesen</button>
                <a href="${item.link}" target="_blank" class="news-link">Artikel öffnen</a>
                <p class="news-date">${new Date(item.pubDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</p>
            </section>
        `;

            // Füge den Event-Listener nach dem Rendern hinzu
            document.getElementById('readMoreButton').addEventListener('click', async function () {
                let moreContent = await getMoreInfo(item.link);
                if (moreContent) {
                    if (origin === 't_online') {
                        moreContent = item.article;
                    }
                    if (origin === 'zeit'){
                        // Entferne alle Bilder mit srcset-Attributen
                        moreContent = moreContent.replace(/<img[^>]*srcset="[^"]*"[^>]*>/g, '');
                        // Entferne alle Bilder ohne srcset (Fallback)
                        moreContent = moreContent.replace(/<img[^>]+src="([^">]+)"[^>]*>/g, '');
                    }
                    if (origin === 'zdf') {
                        // Bilder mit srcset-Attributen entfernen (vollständige img-Tags)
                        moreContent = moreContent.replace(/<img[^>]*srcset="[^"]*"[^>]*>/g, '');

                        // Entferne alle normalen Bilder ohne srcset (Fallback)
                        moreContent = moreContent.replace(/<img[^>]+src="([^">]+)"[^>]*>/g, '');

                        // Vereinfache verschachtelte div-Strukturen
                        moreContent = moreContent.replace(/<div[^>]*><div[^>]*>(.*?)<\/div><\/div>/g, '$1');   //Das verschachtelte div>div entfernen

                        // Entferne den kompletten WhatsApp-Werbeblock (mehrere Muster)
                        moreContent = moreContent.replace(/Sie wollen auf dem Laufenden bleiben[\s\S]*?ZDFheute-WhatsApp-Channel\./g, '');
                        moreContent = moreContent.replace(/Zur Anmeldung: ZDFheute-WhatsApp-Channel\./g, '');
                        moreContent = moreContent.replace(/WhatsApp-Channel[\s\S]*?ZDFheute-WhatsApp-Channel\./g, '');

                        // Entferne den Quellen-Block
                        moreContent = moreContent.replace(/Quelle: (?:dpa|AFP|Reuters|epd)(?:[,\s]*(?:dpa|AFP|Reuters|epd))*/g, '');

                        // Extrahiere nur den relevanten Inhalt, wenn möglich
                        const mainContentMatch = moreContent.match(/<div class="r1nj4qn5">([\s\S]*?)<\/div>/g);
                        if (mainContentMatch) {
                            moreContent = mainContentMatch.join('\n');
                            // Wrapper-Element-Tags entfernen
                            moreContent = moreContent.replace(/<div class="r1nj4qn5">/g, '').replace(/<\/div>/g, '');
                        }
                    }
                    document.querySelector('.news-description').innerHTML = moreContent;
                } else {
                    document.querySelector('.news-description').innerHTML += '<p><em>Inhalt konnte nicht geladen werden.</em></p>';
                }
            });
        });
        container.appendChild(itemObject);
        // Check if the news item has an image embedded in the description
        if (item.description.length > 500) {
            const readMoreButton = document.getElementById('readMoreButton');
            if (readMoreButton && readMoreButton.parentNode) {
                readMoreButton.parentNode.removeChild(readMoreButton);
            }
        }
    });
}

// Füge diesen Code am Anfang deiner Datei ein
console.log("Readability verfügbar:", typeof Readability !== 'undefined');

async function getMoreInfo(link) {
    try {
        // Verwende die IPC-Bridge für die Kommunikation mit dem Main-Prozess
        if (window.ReadabilityData) {
            // Verwende die IPC-Kommunikation
            const content = await window.ReadabilityData.parseArticle(link);
            return content;
        } else if (window.api && window.api.fetchUrl) {
            // Alternative: Hole den HTML-Inhalt und parse ihn im Renderer
            const html = await window.api.fetchUrl(link);

            if (!html) {
                throw new Error('Keine HTML-Daten erhalten');
            }

            // Versuche, den Inhalt zu parsen (falls Readability im Browser verfügbar ist)
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Prüfe, ob Readability verfügbar ist
                if (typeof Readability !== 'undefined') {
                    const reader = new Readability(doc);
                    const article = reader.parse();
                    return article ? article.content : null;
                } else {
                    console.error("Readability ist nicht verfügbar");
                    return `<div class="fallback-content">
                        <p>Readability ist nicht verfügbar. Hier ist der Rohinhalt:</p>
                        <div>${extractSimpleContent(html)}</div>
                    </div>`;
                }
            } catch (parseError) {
                console.error("Fehler beim Parsen:", parseError);
                return `<p>Fehler beim Parsen: ${parseError.message}</p>`;
            }
        } else {
            // Fallback-Meldung, wenn keine API verfügbar ist
            console.error("Keine API für externes Fetching verfügbar");
            return "<p>Diese Funktion benötigt die Electron-API.</p>";
        }
    } catch (error) {
        console.error(`Fehler beim Abrufen oder Parsen des Artikels von ${link}:`, error);
        return `<p><em>Fehler beim Laden des Inhalts: ${error.message}</em></p>`;
    }
}

// Hilfsfunktion, um einen lesbaren Text aus HTML zu extrahieren
function extractSimpleContent(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Entferne Skripts, Styles und andere nicht-relevante Elemente
    const scriptsAndStyles = tempDiv.querySelectorAll('script, style, iframe, nav, footer, header');
    scriptsAndStyles.forEach(element => element.remove());

    // Versuche, den Hauptinhalt zu finden
    const possibleContent = tempDiv.querySelector('article, main, .content, #content');

    if (possibleContent) {
        return possibleContent.innerHTML;
    }

    // Fallback: Gib den Body-Inhalt zurück
    return tempDiv.querySelector('body')?.innerHTML || 'Kein Inhalt gefunden';
}

function getIconForItem(item) {
    // Bestimmt die richtige Icon-Quelle basierend auf dem Ursprung des Elements
    const origin = item.origin;

    // Überprüfe in allen Icon-Kategorien
    for (const category in icons) {
        // Zusätzliche Prüfung, ob die Kategorie existiert
        if (icons[category] && icons[category][origin]) {
            return icons[category][origin];
        }
    }

    // Fallback-Icon, wenn kein spezifisches Icon gefunden wird
    console.warn(`Kein Icon für Quelle gefunden: ${origin}. Verwende Standard.`); // Optionale Warnung
    return 'icons/default.png';
}

async function itemParser(origin, responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');
    
    if (items.length === 0) {
        console.error('Keine Einträge gefunden für', origin);
        return;
    }

    for (let i = 0; i < items.length; i++) {
        try {
            const item = items[i];
            const title = item.querySelector('title')?.textContent || 'Kein Titel';
            const link = item.querySelector('link')?.textContent || '#';
            const description = item.querySelector('description')?.textContent || 'Keine Beschreibung gefunden';
            const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
            
            // Suche nach Bildern in verschiedenen Formaten
            let image = null;
            
            const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
            if (mediaThumbnail) {
                image = mediaThumbnail.getAttribute('url');
            }
            
            if (!image) {
                const enclosure = item.querySelector('enclosure');
                if (enclosure) {
                    image = enclosure.getAttribute('url');
                }
            }
            
            if (!image) {
                const mediaContent = item.querySelector('media\\:content, content');
                if (mediaContent) {
                    image = mediaContent.getAttribute('url');
                }
            }
            
            // Weitere Optionen für Bilder
            if (!image) {
                const imgTag = description.match(/<img[^>]+src="([^">]+)"/);
                if (imgTag) {
                    image = imgTag[1];
                }
            }
            
            const article = item.querySelector('content\\:encoded, encoded')?.textContent || '';
            
            // Speichere das Element in der entsprechenden Kategorie
            const newsItem = {
                title,
                link,
                description,
                pubDate,
                image,
                article,
                read: false,
                origin
            };
            
            await db.update(data => {
                if (Array.isArray(data[origin])) {
                    // Prüfe, ob der Artikel bereits existiert
                    const exists = data[origin].some(item => item.link === link);
                    if (!exists) {
                        data[origin].push(newsItem);
                    }
                }
                return data;
            });
            
        } catch (error) {
            console.error(`Fehler beim Parsen eines Items aus ${origin}:`, error);
        }
    }
}

async function entryParser(origin, responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    const entries = xmlDoc.getElementsByTagName('entry');

    if (entries.length === 0) {
        console.error('Keine Einträge gefunden für', origin);
        return;
    }

    for (let i = 0; i < entries.length; i++) {
        try {
            const entry = entries[i];
            const title = entry.querySelector('title')?.textContent || 'Kein Titel';

            // Links können unterschiedlich formatiert sein
            let link;
            const linkElement = entry.querySelector('link');
            if (linkElement) {
                link = linkElement.getAttribute('href') || linkElement.textContent || '#';
            } else {
                link = '#';
            }

            let description = entry.querySelector('summary, content')?.textContent || '';
            const pubDate = entry.querySelector('updated, published')?.textContent || new Date().toISOString();

            // Suche nach Bildern
            let image = null;
            const mediaThumbnail = entry.querySelector('media\\:thumbnail, thumbnail');
            if (mediaThumbnail) {
                image = mediaThumbnail.getAttribute('url');
            }

            if (origin === 'computerbase') {
                const summaryAttr = entry.getAttribute('summary');
                if (summaryAttr) {
                    const srcParts = summaryAttr.split('src=');
                    if (srcParts.length > 1) {
                        const quoteParts = srcParts[1].split('"');
                        if (quoteParts.length > 1) {
                            image = quoteParts[1];
                        }
                    }
                }
                description = description.replace(/<img[^>]+src="([^">]+)"/, '');
                description = description.replace('>', '').trim();
            }

            if (origin === 'netzpolitik') {
                const contentToSearch = description || entry.querySelector('content')?.textContent || '';

                const imgMatch = contentToSearch.match(/<img[^>]+src="([^">]+)"[^>]*class="[^"]*wp-post-image[^"]*"[^>]*>/);

                if (imgMatch && imgMatch[1]) {
                    image = imgMatch[1];
                } else {
                    const simpleImgMatch = contentToSearch.match(/<img[^>]+src="([^">]+)"/);
                    image = simpleImgMatch ? simpleImgMatch[1] : null;
                }

                description = description
                    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
                    .replace(/<img[^>]+src="([^">]+)"[^>]*>/gi, '');
            }

            const newsItem = {
                title,
                link,
                description,
                pubDate,
                image,
                read: false,
                origin
            };

            await db.update(data => {
                if (Array.isArray(data[origin])) {
                    // Prüfe, ob der Artikel bereits existiert
                    const exists = data[origin].some(item => item.link === link);
                    if (!exists) {
                        data[origin].push(newsItem);
                    }
                }
                return data;
            });

        } catch (error) {
            console.error(`Fehler beim Parsen eines Entry aus ${origin}:`, error);
        }
    }
}