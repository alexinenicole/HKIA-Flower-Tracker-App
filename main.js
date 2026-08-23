// ============================================================
//  main.js — Electron Main Process
//  HKIA Flower Tracker
// ============================================================

const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');

// In dev, disable the HTTP disk cache so CSS/HTML/JS changes always load fresh.
// This must be set before app.whenReady().
if (!app.isPackaged) {
  app.commandLine.appendSwitch('disable-http-cache');
}

// ── Paths ────────────────────────────────────────────────────
// data.json lives next to the .exe in packaged builds (extraResources),
// or next to main.js in development.
const dataPath = app.isPackaged
  ? path.join(process.resourcesPath, 'data.json')
  : path.join(__dirname, 'data.json');

// Tracker state saved in the user's AppData so it survives reinstalls.
const statePath = path.join(app.getPath('userData'), 'tracker-state.json');

// ── Helpers ──────────────────────────────────────────────────
function readData() {
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[main] Failed to read data.json:', err.message);
    // Fallback so app doesn't crash if file is missing / malformed
    return { flowers: [], colors: [] };
  }
}

function readState() {
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (err) {
    console.error('[main] Failed to read tracker-state.json:', err.message);
  }
  return {};
}

// Write state immediately (sync) to avoid any close-before-write race
function writeState(state) {
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[main] Failed to write tracker-state.json:', err.message);
  }
}

// ── Window ───────────────────────────────────────────────────
let mainWindow;
let trackerState = readState();  // load state once at startup

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'HKIA Flower Tracker',
    icon: path.join(__dirname, 'assets', 'app-logo.jpg'),
    backgroundColor: '#0d0f1a',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  mainWindow.loadFile('index.html');

  // Remove default menu bar (keeps Alt-key menu accessible on Windows)
  mainWindow.setMenuBarVisibility(false);

  // Open DevTools in dev mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// ── IPC Handlers ─────────────────────────────────────────────

/** Return current flower/color config */
ipcMain.handle('get-config', () => readData());

/** Return all saved checked states */
ipcMain.handle('get-state', () => trackerState);

/**
 * Update a single checkbox state.
 * key format: "FlowerName::ColorName::variant"
 */
ipcMain.handle('set-state', (_event, key, checked) => {
  if (checked) {
    trackerState[key] = trackerState[key] || Date.now();
  } else {
    delete trackerState[key];
  }
  writeState(trackerState);
  return true;
});

/** Clear all saved states */
ipcMain.handle('reset-all', async () => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Reset Everything', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Reset Tracker',
    message: 'Reset all checks?',
    detail: 'This will clear every checked box. Your data.json flower/color list is not affected.',
  });
  if (response === 0) {
    trackerState = {};
    writeState(trackerState);
    return true;
  }
  return false;
});

/** Open data.json in the system default editor (Notepad on Windows) */
ipcMain.handle('open-config', async () => {
  const err = await shell.openPath(dataPath);
  if (err) {
    dialog.showErrorBox('Cannot open config', err);
    return false;
  }
  return true;
});

/** Show the data.json path so users know where to find it */
ipcMain.handle('get-config-path', () => dataPath);

/** Reload the renderer after user has edited data.json */
ipcMain.handle('reload', () => {
  mainWindow.webContents.reload();
});

/** Import Excel/CSV data */
ipcMain.handle('import-excel', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Legacy Tracker',
      filters: [
        { name: 'Spreadsheets', extensions: ['xlsx', 'csv', 'xls'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { canceled: true };

    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(filePaths[0]);
    const sheets = {};
    for (const sheetName of workbook.SheetNames) {
      sheets[sheetName] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    }
    return { success: true, sheets };
  } catch (err) {
    console.error('[main] Import error:', err);
    return { success: false, error: err.message };
  }
});

// ── App lifecycle ─────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
