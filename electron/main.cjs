const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const isDev = !app.isPackaged;
let mainWindow = null;
let apiServer = null;

function startApiServer() {
  return new Promise((resolve, reject) => {
    apiServer = spawn('node', [path.join(__dirname, '..', 'server.cjs')], {
      env: { ...process.env, API_PORT: '3000' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    apiServer.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('listening') || msg.includes('running')) {
        resolve();
      }
    });

    apiServer.stderr.on('data', (data) => {
      console.error('[api]', data.toString());
    });

    apiServer.on('error', reject);

    // Fallback: resolve after 2 seconds
    setTimeout(resolve, 2000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'DeepChat',
    icon: path.join(__dirname, '..', 'public', 'favicon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    backgroundColor: '#06061a',
    show: false,
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
  });

  // Remove default menu
  Menu.setApplicationMenu(null);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    // In dev, wait for Vite then load
    const checkServer = () => {
      http.get('http://localhost:5173', (res) => {
        if (res.statusCode === 200) {
          mainWindow.loadURL('http://localhost:5173');
          mainWindow.webContents.openDevTools({ mode: 'detach' });
          return;
        }
        setTimeout(checkServer, 500);
      }).on('error', () => setTimeout(checkServer, 500));
    };
    checkServer();
  } else {
    // Production: serve static files
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startApiServer();
    console.log('API server started');
  } catch (e) {
    console.warn('API server could not start:', e.message);
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (apiServer) {
    apiServer.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
