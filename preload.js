const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window-minimize"),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  saveConfig: (data) => ipcRenderer.send("save-config", data),
  onConfigLoaded: (cb) => ipcRenderer.on("config-loaded", cb),
  onConfigSaved: (cb) => ipcRenderer.on("config-saved", cb),
  onKickAuthSuccess: (cb) => ipcRenderer.on("kick-auth-success", cb),
  openOverlay: (port) => ipcRenderer.send("open-overlay", port),
});