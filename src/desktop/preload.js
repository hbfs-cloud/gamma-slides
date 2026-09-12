import { contextBridge, ipcRenderer } from 'electron';

const listeners = new Map();

function subscribe(channel, callback) {
  const handler = (_event, value) => callback(value);
  ipcRenderer.on(channel, handler);
  listeners.set(callback, { channel, handler });
  return () => {
    const entry = listeners.get(callback);
    if (entry) ipcRenderer.removeListener(entry.channel, entry.handler);
    listeners.delete(callback);
  };
}

contextBridge.exposeInMainWorld('gammaDesktop', {
  getSnapshot: () => ipcRenderer.invoke('presenter:snapshot'),
  updateSource: source => ipcRenderer.send('presenter:update-source', source),
  setTheme: theme => ipcRenderer.send('presenter:set-theme', theme),
  openDocument: () => ipcRenderer.invoke('presenter:open-document'),
  saveDocument: () => ipcRenderer.invoke('presenter:save-document'),
  saveDocumentAs: () => ipcRenderer.invoke('presenter:save-document-as'),
  exportPdf: () => ipcRenderer.invoke('presenter:export-pdf'),
  present: () => ipcRenderer.invoke('presenter:present'),
  stopPresenting: () => ipcRenderer.send('presenter:stop-presenting'),
  openSpeaker: () => ipcRenderer.send('presenter:open-speaker'),
  moveStage: displayId => ipcRenderer.send('presenter:move-stage', displayId),
  navigate: action => ipcRenderer.send('presenter:navigate', action),
  onState: callback => subscribe('presenter:state', callback),
});

window.addEventListener('gamma:stage-change', event => {
  ipcRenderer.send('presenter:stage-change', event.detail);
});
