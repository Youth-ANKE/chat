const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

const isDev = !app.isPackaged;
let mainWindow = null;
let apiServer = null;

function startApiServer() {
  return new Promise((resolve) => {
    // In packaged app, use fork (works cross-platform with Electron's Node)
    // In dev, fork also works as it uses the system Node
    const serverPath = path.join(__dirname, '..', 'server.cjs');
    try {
      apiServer = fork(serverPath, [], {
        env: { ...process.env, API_PORT: '3000' },
        silent: true,
        stdio: 'pipe',
      });
    } catch (e) {
      console.warn('Cannot fork server:', e.message);
      resolve();
      return;
    }

    apiServer.stdout && apiServer.stdout.on('data', (data) => {
      console.log('[api]', data.toString());
    });

    apiServer.stderr && apiServer.stderr.on('data', (data) => {
      console.error('[api]', data.toString());
    });

    apiServer.on('error', (err) => {
      console.warn('API server error:', err.message);
      resolve();
    });

    apiServer.on('exit', (code) => {
      if (code !== 0) {
        console.warn('API server exited with code:', code);
      }
    });

    // Resolve after 2 seconds regardless
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
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
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

// Handle uncaught errors so the window doesn't silently vanish
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  dialog.showErrorBox('DeepChat 启动错误', err.message || '未知错误，请查看日志');
});

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
