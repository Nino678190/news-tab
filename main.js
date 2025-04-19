import pkg from 'electron';
const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain } = pkg;

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { JSONFilePreset } from 'lowdb/node';

const defaultData = {
    tagesschau: [], spiegel: [], zdf: [], t_online: [], zeit: [], sueddeutsche: [], rbb: [],
    heise: [], spiegel_digital: [], t3n: [], golem: [], netzpolitik: [], computerbase: [],
    r_dingore: [], r_schkreckl: [], r_stvo: [], r_berlin: []
};

let db;

async function initDb() {
    try {
        db = await JSONFilePreset('news.json', defaultData);
        console.log('Datenbank erfolgreich initialisiert');
        return true;
    } catch (error) {
        console.error('Fehler beim Initialisieren der Datenbank:', error);
        return false;
    }
}

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        frame: false,
        show: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    mainWindow.loadFile('index.html');

    // Globale Shortcuts
    globalShortcut.register('Super+N', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    // Tray-Icon
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'News-Tab öffnen', click: () => mainWindow.show() },
        { label: 'Beenden', click: () => app.quit() }
    ]);
    tray.setToolTip('News Tab');
    tray.setContextMenu(contextMenu);
}

app.whenReady().then(async () => {
    await initDb();

    createWindow();

    // IPC Event für das Öffnen eines Links
    ipcMain.on('open-reader', (event, url) => {
        openArticleReader(url);
    });

    // IPC Handler für URL-Fetching
    ipcMain.handle('fetch-url', async (event, url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Fehler beim Abrufen der URL:', error);
            throw error;
        }
    });

    // IPC Handler für Readability-Parsing
    ipcMain.handle('parse-article', async (event, url) => {
        try {
            const response = await fetch(url);
            const html = await response.text();

            const dom = new JSDOM(html, { url });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();

            return article ? article.content : null;
        } catch (error) {
            console.error('Fehler beim Parsen des Artikels:', error);
            return null;
        }
    });
});

async function openArticleReader(url) {
    console.log(`Versuche Artikel zu öffnen und zu parsen: ${url}`);
    if (!mainWindow || mainWindow.isDestroyed()) {
        console.error("Hauptfenster ist nicht verfügbar.");
        return;
    }

    // Informiere den Renderer, dass das Laden beginnt (optional)
    mainWindow.webContents.send('article-loading', url);

    try {
        const response = await fetch(url, {
             headers: { // Einige Webseiten benötigen einen User-Agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
             }
        });
        if (!response.ok) {
            throw new Error(`HTTP Fehler: ${response.status}`);
        }
        const html = await response.text();

        // Parse den HTML-Inhalt mit JSDOM und Readability
        const dom = new JSDOM(html, { url }); // Übergabe der URL ist wichtig für relative Links
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (article && article.content) {
            console.log(`Artikel erfolgreich geparst: ${article.title}`);
            // Sende den geparsten Inhalt an das Renderer-Fenster
            mainWindow.webContents.send('display-article', {
                title: article.title,
                content: article.content,
                url: url // Sende auch die Original-URL mit, falls benötigt
            });
            // Stelle sicher, dass das Fenster sichtbar ist und den Fokus hat
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            mainWindow.focus();
        } else {
            console.error('Konnte Artikelinhalt nicht extrahieren.');
            // Sende eine Fehlermeldung an den Renderer (optional)
            mainWindow.webContents.send('article-error', { url: url, message: 'Konnte Artikelinhalt nicht extrahieren.' });
        }
    } catch (error) {
        console.error(`Fehler beim Verarbeiten von ${url}:`, error);
        // Sende eine Fehlermeldung an den Renderer (optional)
        mainWindow.webContents.send('article-error', { url: url, message: `Fehler beim Laden oder Parsen: ${error.message}` });
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('get-news-data', async () => {
    try {
        if (!db) await initDb();
        return db ? db.data : defaultData;
    } catch (error) {
        console.error('Fehler beim Laden der News-Daten:', error);
        return defaultData;
    }
});

ipcMain.handle('save-news-data', async (_, data) => {
    try {
        if (!db) await initDb();

        if (!db) {
            throw new Error('Datenbank konnte nicht initialisiert werden');
        }
        db.data = data;

        try {
            await db.write();
            return true;
        } catch (writeError) {
            console.error('Fehler beim Schreiben der Daten:', writeError);
            return false;
        }
    } catch (error) {
        console.error('Fehler beim Speichern der News-Daten:', error);
        return false;
    }
});