const { contextBridge, ipcRenderer } = require('electron');
const { Readability } = require('@mozilla/readability');

// Stelle Readability im Window-Objekt zur Verfügung
contextBridge.exposeInMainWorld('Readability', Readability);

contextBridge.exposeInMainWorld('electronAPI', {
    showNotification: (title, body) => {
        new Notification(title, { body });
    },
    sendMessage: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    onMessage: (channel, callback) => {
        ipcRenderer.on(channel, (_event, data) => callback(data));
    }
});
