// RailReady — personal Windows desktop wrapper for the ORIGINAL Floot web application.
const {app, BrowserWindow, Menu, shell, session, dialog} = require('electron');
const path = require('node:path');

const URL_APP = 'https://railready-ntpc.floot.app/';
const HOST = 'railready-ntpc.floot.app';
let mainWindow;

function allowedAppUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === HOST;
  } catch (_) {
    return false;
  }
}

function safeOpenExternal(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      shell.openExternal(url).catch(() => {});
    }
  } catch (_) {}
}

function showOfflinePage(message) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.loadFile(path.join(__dirname, 'offline.html'), {
    query: {reason: String(message || 'Connection unavailable').slice(0, 120)}
  }).catch(() => {});
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1150, height: 800, minWidth: 760, minHeight: 570,
    backgroundColor: '#f5f6f1',
    title: 'RailReady NTPC',
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      spellcheck: true
    }
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({url}) => {
    safeOpenExternal(url);
    return {action: 'deny'};
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (!allowedAppUrl(url)) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('mailto:')) safeOpenExternal(url);
    } else if (current.startsWith('file:')) {
      // Offline retry button can return to the hosted RailReady app.
    }
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, desc, validatedUrl, isMainFrame) => {
    if (isMainFrame && validatedUrl && validatedUrl.startsWith(URL_APP)) {
      showOfflinePage(desc || 'Network error');
    }
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'RailReady',
      submenu: [
        {label: 'Home', click: () => mainWindow.loadURL(URL_APP).catch(() => showOfflinePage('Unable to connect'))},
        {label: 'Refresh', accelerator: 'CmdOrCtrl+R', click: () => {
          if (mainWindow.webContents.getURL().startsWith('file:')) mainWindow.loadURL(URL_APP).catch(() => showOfflinePage('Unable to connect'));
          else mainWindow.webContents.reload();
        }},
        {type: 'separator'},
        {label: 'Open in Browser', click: () => safeOpenExternal(URL_APP)},
        {type: 'separator'},
        {role: 'quit', label: 'Exit'}
      ]
    },
    {label: 'View', submenu: [
      {label: 'Zoom In', role: 'zoomIn'},
      {label: 'Zoom Out', role: 'zoomOut'},
      {label: 'Reset Zoom', role: 'resetZoom'},
      {role: 'togglefullscreen'}
    ]}
  ]));

  mainWindow.loadURL(URL_APP).catch(() => showOfflinePage('Unable to connect'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
