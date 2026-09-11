const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gammaDesktop', {
  getSnapshot: () => ipcRenderer.invoke('presenter:snapshot'),
  navigate: action => ipcRenderer.send('presenter:navigate', action),
  stopPresenting: () => ipcRenderer.send('presenter:stop-presenting'),
  onState: callback => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('presenter:state', handler);
    return () => ipcRenderer.removeListener('presenter:state', handler);
  },
});
