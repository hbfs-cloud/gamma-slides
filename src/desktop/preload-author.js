import { contextBridge, ipcRenderer, webUtils } from 'electron';

function subscribe(callback) {
  const handler = (_event, value) => callback(value);
  ipcRenderer.on('presenter:state', handler);
  return () => ipcRenderer.removeListener('presenter:state', handler);
}

contextBridge.exposeInMainWorld('gammaDesktop', {
  getSnapshot: () => ipcRenderer.invoke('presenter:snapshot'),
  updateSource: source => ipcRenderer.send('presenter:update-source', source),
  applyTemplate: id => ipcRenderer.invoke('presenter:apply-template', id),
  patchRichSlide: (index, patch) => ipcRenderer.invoke('presenter:patch-rich-slide', index, patch),
  patchMarkdownSlide: (index, patch) => ipcRenderer.invoke('presenter:patch-markdown-slide', index, patch),
  mutateSlides: (action, index, targetIndex) => ipcRenderer.invoke('presenter:mutate-slides', action, index, targetIndex),
  importMedia: index => ipcRenderer.invoke('presenter:import-media', index),
  importDroppedMedia: (file, index) => {
    const path = webUtils.getPathForFile(file);
    return path ? ipcRenderer.invoke('presenter:import-media-path', path, index) : Promise.reject(new Error('The dropped file path is unavailable.'));
  },
  setTheme: theme => ipcRenderer.invoke('presenter:set-theme', theme),
  openDocument: () => ipcRenderer.invoke('presenter:open-document'),
  saveDocument: () => ipcRenderer.invoke('presenter:save-document'),
  saveDocumentAs: () => ipcRenderer.invoke('presenter:save-document-as'),
  exportPdf: () => ipcRenderer.invoke('presenter:export-pdf'),
  detectCopilots: () => ipcRenderer.invoke('presenter:copilot-detect'),
  runCopilot: (cli, prompt) => ipcRenderer.invoke('presenter:copilot-run', cli, prompt),
  countdown: (action, seconds) => ipcRenderer.invoke('presenter:countdown', action, seconds),
  setCue: (cue, level) => ipcRenderer.invoke('presenter:cue', cue, level),
  clearCue: () => ipcRenderer.invoke('presenter:clear-cue'),
  present: () => ipcRenderer.send('presenter:present'),
  stopPresenting: () => ipcRenderer.send('presenter:stop-presenting'),
  openSpeaker: () => ipcRenderer.send('presenter:open-speaker'),
  moveStage: displayId => ipcRenderer.send('presenter:move-stage', displayId),
  navigate: action => ipcRenderer.send('presenter:navigate', action),
  onState: subscribe,
});
