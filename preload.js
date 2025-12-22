const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  onMaximized: (callback) => ipcRenderer.on('window-maximized', callback),
  onUnmaximized: (callback) => ipcRenderer.on('window-unmaximized', callback),
  removeMaximizedListeners: () => {
    ipcRenderer.removeAllListeners('window-maximized');
    ipcRenderer.removeAllListeners('window-unmaximized');
  },

  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (data) => ipcRenderer.send('save-config', data),
  onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (_, data) => callback(data)),

  updateOverlay: (data) => ipcRenderer.send('overlay-update', data),

  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});