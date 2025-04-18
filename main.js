const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

const { JSONFilePreset } = require('lowdb/node');

const defaultData = { tagesschau: [], spiegel: [], zdf: [], t_online: [], zeit: [], sueddeutsche: [], rbb: [], 
    heise: [], spiegel_digital: [], t3n: [], golem: [], netzpolitik: [], computerbase: [],
    r_dingore: [], r_schkreckl: [], r_stvo: [], r_berlin: [] };

const db = JSONFilePreset('news.json', defaultData)

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        frame: false, // Optional: rahmenlos
        show: true,  // false: Wir zeigen es erst bei Shortcut
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


const saved = {
    lat: 0,
    lon: 0
};

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
        await displayWeather(data);
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

async function updateWeather() {
    const lat = saved.lat;
    const lon = saved.lon;
    try {
        const weatherData = await fetchWeather(lat, lon);
        displayWeather(weatherData);
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
        tagesschau: 'images/tagesschau.png',
        spiegel: 'images/spiegel.png',
        zdf: 'images/zdf.png',
        t_online: 'images/t-online.png',
        zeit: 'images/zeit.png',
        sueddeutsche: 'images/sueddeutsche.png',
        rbb: 'images/rbb.png'
    },
    digital: {
        heise: 'images/heise.png',
        spiegel_digital: 'images/spiegel.png',
        t3n: 'images/t3n.png',
        golem: 'images/golem.png',
        netzpolitik: 'images/netzpolitik.svg',
        computerbase: 'images/computerbase.png'
    },
    wissen: {
        r_dingore: 'images/reddit.png',
        r_schkreckl: 'images/reddit.png',
        r_stvo: 'images/reddit.png',
        r_berlin: 'images/reddit.png',
    }
}

async function fetchNews(url, origin) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`News API Fehler: ${response.status}`);
        }
        switch (origin) {
            case 'tagesschau':
                await itemParser(response);
                return;
            case 'spiegel':
                await itemParser(response);
                return;
            case 'zdf':
                await itemParser(response);
                return;
            case 't-online':
                await itemParser(response);
                return;
            case 'zeit':
                await itemParser(response);
                return;
            case 'sueddeutsche':
                await itemParser(response);
                return;
            case 'rbb':
                await itemParser(response);
                return;
            case 'heise':
                await entryParser(response);
                return;
            case 'spiegel_digital':
                await itemParser(response);
                return;
            case 't3n':
                await itemParser(response);
                return;
            case 'golem':
                await itemParser(response);
                return;
            case 'netzpolitik':
                await itemParser(response);
                return;
            case 'computerbase':
                await entryParser(response);
                return;
            case 'r_dingore':
                await entryParser(response);
                return;
            case 'r_schkreckl':
                await entryParser(response);
                return;
            case 'r_stvo':
                await entryParser(response);
                return;
            case 'r_berlin':
                await entryParser(response);
                return;
            default:
                console.error('Unbekannte Nachrichtenquelle:', origin);
                return;
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Nachrichten:', error);
    }
}

function getNews(){
    const container = document.getElementById('news');
    if (!container) {
        console.error('News-Container nicht gefunden');
        return;
    }
    container.innerHTML = '';

    fetchNews(urls.news.tagesschau, 'tagesschau');
    fetchNews(urls.news.spiegel, 'spiegel');
    fetchNews(urls.news.zdf, 'zdf');
    fetchNews(urls.news.t_online, 't-online');
    fetchNews(urls.news.zeit, 'zeit');

    let tagesschau = db.get('tagesschau');
    let spiegel = db.get('spiegel');
    let zdf = db.get('zdf');
    let t_online = db.get('t_online');
    let zeit = db.get('zeit');
    let sueddeutsche = db.get('sueddeutsche');
    let rbb = db.get('rbb');
    let allNews = [...tagesschau, ...spiegel, ...zdf, ...t_online, ...zeit, ...sueddeutsche, ...rbb];
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    allNews.slice(0, 25).forEach((item) => {
        let itemObject = document.createElement('article');
        itemObject.className = 'news-item';
        itemObject.innerHTML = `
            <section class="news-header>
                <img src="${icons.news[item.origin]}" alt="${item.origin}" class="news-icon">
                <h3 class="news-title">${item.title}</h3>
            </section>
            <section class="news-content">
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
            const text = item.article || item.description;
            container.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="news-image
                <h2 class="news-title">${item.title}</h2>
                <p class="news-description">${text}</p>
                <a href="${item.link}" target="_blank" class="news-link">Mehr erfahren</a>
                <p class="news-date">${new Date(item.pubDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</p>
                `;
        });
        container.appendChild(itemObject);
    })
}

function getTechnik() {
    const container = document.getElementById('news');
    if (!container) {
        console.error('News-Container nicht gefunden');
        return;
    }
    container.innerHTML = '';
    
    fetchNews(urls.digital.heise, 'heise');
    fetchNews(urls.digital.spiegel_digital, 'spiegel_digital');
    fetchNews(urls.digital.t3n, 't3n');
    fetchNews(urls.digital.golem, 'golem');
    fetchNews(urls.digital.netzpolitik, 'netzpolitik');
    fetchNews(urls.digital.computerbase, 'computerbase');

    let heise = db.get('heise');
    let spiegel_digital = db.get('spiegel_digital');
    let t3n = db.get('t3n');
    let golem = db.get('golem');
    let netzpolitik = db.get('netzpolitik');
    let computerbase = db.get('computerbase');
    let allNews = [...heise, ...spiegel_digital, ...t3n, ...golem, ...netzpolitik, ...computerbase];

    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    allNews.slice(0, 25).forEach((item) => {
        let itemObject = document.createElement('article');
        itemObject.className = 'news-item';
        itemObject.innerHTML = `
            <section class="news-header>
                <img src="${icons.news[item.origin]}" alt="${item.origin}" class="news-icon">
                <h3 class="news-title">${item.title}</h3>
            </section>
            <section class="news-content">
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
            const text = item.article || item.description;
            container.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="news-image
                <h2 class="news-title">${item.title}</h2>
                <p class="news-description">${text}</p>
                <a href="${item.link}" target="_blank" class="news-link">Mehr erfahren</a>
                <p class="news-date">${new Date(item.pubDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</p>
                `;
        });
        container.appendChild(itemObject);
    })
}

function getMemes() {
    const container = document.getElementById('news');
    if (!container) {
        console.error('News-Container nicht gefunden');
        return;
    }
    container.innerHTML = '';
    fetchNews(urls.memes.r_dingore, 'r_dingore');
    fetchNews(urls.memes.r_schkreckl, 'r_schkreckl');
    fetchNews(urls.memes.r_stvo, 'r_stvo');
    fetchNews(urls.memes.r_berlin, 'r_berlin');

    let r_dingore = db.get('r_dingore');
    let r_schkreckl = db.get('r_schkreckl');
    let r_stvo = db.get('r_stvo');
    let r_berlin = db.get('r_berlin');
    let allNews = [...r_dingore, ...r_schkreckl, ...r_stvo, ...r_berlin];

    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    allNews.slice(0, 25).forEach((item) => {
        let itemObject = document.createElement('article');
        itemObject.className = 'news-item';
        itemObject.innerHTML = `
            <section class="news-header>
                <img src="${icons.news[item.origin]}" alt="${item.origin}" class="news-icon">
                <h3 class="news-title">${item.title}</h3>
            </section>
            <section class="news-content">
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
            const text = item.article || item.description;
            container.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="news-image
                <h2 class="news-title">${item.title}</h2>
                <p class="news-description">${text}</p>
                <a href="${item.link}" target="_blank" class="news-link">Mehr erfahren</a>
                <p class="news-date">${new Date(item.pubDate).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</p>
                `;
        });
        container.appendChild(itemObject);
    })
}

async function itemParser(origin, response){
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response, 'text/xml');
    for (let i = 0; i < response.length; i++) {
        let items = xmlDoc.getElementsByTagName('item');
        if (items.length === 0) {
            console.error('Keine Einträge gefunden');
            return;
        }

        let title = items[i].getElementsByTagName('title')[i].textContent;
        let link = items[i].getElementsByTagName('link')[i].textContent;
        let description = items[i].getElementsByTagName('description')[i].textContent;
        let pubDate = items[i].getElementsByTagName('pubDate')[i].textContent;
        let image = items[i].getElementsByTagName('media:thumbnail')[i].getAttribute('url');
        let article = items[i].getElementsByTagName('content:encoded')[i].textContent;
        if (image === undefined) {
            let img = items[i].getElementsByTagName('enclosure')[i].getAttribute('url');
            image = img;
        }
        if (image === undefined) {
            let img = items[i].getElementsByTagName('media:content')[i].getAttribute('url');
            image = img;
        }
        if (image === undefined) {
            let img = items[i].getElementsByTagName('image')[i].getAttribute('url');
            image = img;
        }
        if (image === undefined) {
            let img = items[i].getElementsByTagName('media:thumbnail')[i].getAttribute('url');
            image = img;
        }
        if (image === undefined) {
            let img = items[i].getElementsByTagName('media:description')[i].getAttribute('url');
            image = img;
        }
        if (image === undefined) {
            let img = items[i].getElementsByTagName('media:group')[i].getAttribute('url');
            image = img;
        }
        if (origin === 't-online'){
            await db.update(({ t_online }) => t_online.push({ title, link, description, pubDate, image, article, read: false }));
            return;
        }
        if (origin === 'netzpolitik'){
            await db.update(({ netzpolitik }) => netzpolitik.push({ title, link, description, pubDate, image, article, read: false }));
            return;
        }
        await db.update(({ [origin]: items }) => items.push({ title, link, description, pubDate, image, read: false }));
    }
}
async function entryParser(origin, response) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response, 'text/xml');
    for (let i = 0; i < response.length; i++) {
        let entries = xmlDoc.getElementsByTagName('entry');
        if (entries.length === 0) {
            console.error('Keine Einträge gefunden');
            return;
        }
        let title = entries[i].getElementsByTagName('title')[i].textContent;
        let link = entries[i].getElementsByTagName('link')[i].textContent;
        let description = entries[i].getElementsByTagName('summary')[i].textContent;
        let pubDate = entries[i].getElementsByTagName('updated')[i].textContent;
        let image = entries[i].getElementsByTagName('media:thumbnail')[i].getAttribute('url');
        await db.update(({ [origin]: entries }) => entries.push({ title, link, description, pubDate, image, read: false }));
    }
}