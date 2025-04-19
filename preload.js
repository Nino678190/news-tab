const { contextBridge, ipcRenderer } = require('electron');

// API für den Renderer-Prozess
contextBridge.exposeInMainWorld('api', {
    openReader: (url) => ipcRenderer.send('open-reader', url),
    fetchUrl: async (url) => {
        try {
            return await ipcRenderer.invoke('fetch-url', url);
        } catch (error) {
            console.error('Fehler beim Abrufen der URL:', error);
            return null;
        }
    },
    // Neue Funktionen für die Datenbank-Kommunikation
    getNewsData: async () => {
        try {
            return await ipcRenderer.invoke('get-news-data');
        } catch (error) {
            console.error('Fehler beim Laden der News-Daten:', error);
            return {};
        }
    },
    saveNewsData: async (data) => {
        try {
            return await ipcRenderer.invoke('save-news-data', data);
        } catch (error) {
            console.error('Fehler beim Speichern der News-Daten:', error);
            return false;
        }
    }
});

// Alternative: Stelle Readability direkt zur Verfügung
contextBridge.exposeInMainWorld('ReadabilityData', {
    isAvailable: false,
    // Diese Funktion wird aufgerufen, wenn eine URL geladen werden soll
    parseArticle: async (url) => {
        try {
            return await ipcRenderer.invoke('parse-article', url);
        } catch (error) {
            console.error('Fehler beim Parsen des Artikels:', error);
            return null;
        }
    }
});