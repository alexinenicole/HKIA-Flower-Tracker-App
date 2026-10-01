// ============================================================
//  preload.js — Contextbridge (Renderer ↔ Main IPC)
//  HKIA Flower Tracker
// ============================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('trackerAPI', {
  /** Fetch flower/color config from data.json */
  getConfig:     ()            => ipcRenderer.invoke('get-config'),

  /** Fetch all persisted checkbox states */
  getState:      ()            => ipcRenderer.invoke('get-state'),

  /**
   * Persist a single checkbox change.
   * @param {string}  key     "FlowerName::ColorName::variant"
   * @param {boolean} checked
   */
  setState:      (key, checked) => ipcRenderer.invoke('set-state', key, checked),

  /** Clear all checks (shows confirmation dialog in main) */
  resetAll:      ()            => ipcRenderer.invoke('reset-all'),

  /** Open data.json in Notepad / default editor */
  openConfig:    ()            => ipcRenderer.invoke('open-config'),

  /** Get the filesystem path to data.json */
  getConfigPath: ()            => ipcRenderer.invoke('get-config-path'),

  /** Reload the window (after user saves data.json changes) */
  reload:        ()            => ipcRenderer.invoke('reload'),

  /** Change the data storage directory */
  changeDataLocation: ()       => ipcRenderer.invoke('change-data-location'),

  /** Reset data storage directory to default */
  resetDataLocation:  ()       => ipcRenderer.invoke('reset-data-location'),

  /** Get the current data storage directory */
  getDataLocation:    ()       => ipcRenderer.invoke('get-data-location'),
});
