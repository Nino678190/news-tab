import pkg from 'electron';
const { app, BrowserWindow, globalShortcut, Tray, Menu } = pkg;

import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { JSONFilePreset } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const defaultData = { tagesschau: [], spiegel: [], zdf: [], t_online: [], zeit: [], sueddeutsche: [], rbb: [], 
    heise: [], spiegel_digital: [], t3n: [], golem: [], netzpolitik: [], computerbase: [],
    r_dingore: [], r_schkreckl: [], r_stvo: [], r_berlin: [] };

const db = JSONFilePreset('news.json', defaultData)

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
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
app.disableHardwareAcceleration();

app.on('window-all-closed', () => {
    // Auf Linux kannst du das offen lassen, wenn du willst
});
