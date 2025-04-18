const { contextBridge, ipcRenderer } = require('electron');

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
