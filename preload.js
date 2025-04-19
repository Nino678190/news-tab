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