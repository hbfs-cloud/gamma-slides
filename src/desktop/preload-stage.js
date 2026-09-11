import { contextBridge, ipcRenderer } from 'electron';

function subscribe(callback) {
  const handler = (_event, value) => callback(value);
  ipcRenderer.on('presenter:state', handler);
  return () => ipcRenderer.removeListener('presenter:state', handler);
}

contextBridge.exposeInMainWorld('gammaStage', { openSpeaker: () => ipcRenderer.send('presenter:open-speaker'), onState: subscribe });
contextBridge.exposeInMainWorld('__GAMMA_TERMINAL__', {
  enabled: true,
  electron: true,
  pty: false,
  cwd: 'Presentation folder',
  run: command => ipcRenderer.invoke('presenter:terminal-run', command),
});
window.addEventListener('gamma:stage-change', event => ipcRenderer.send('presenter:stage-change', event.detail));
