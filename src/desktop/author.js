import { formatWriterLine, highlightMarkdownWriter, writerMomentGap } from './writer.js';
import { initializeConnections } from './connections.js';

const source = document.querySelector('#source');
const writerShell = document.querySelector('#writer-shell');
const writerHighlights = document.querySelector('#writer-highlights');
const writerActions = document.querySelector('#writer-actions');
const rawSourceToggle = document.querySelector('#toggle-raw-source');
const slideList = document.querySelector('#thumbnail-list');
const feedback = document.querySelector('#feedback');
const preview = document.querySelector('#renderer-preview');
const rendererStatus = document.querySelector('#renderer-status');
const documentStatus = document.querySelector('#document-status');
const templateDialog = document.querySelector('#template-dialog');
const templateList = document.querySelector('#template-list');
const historyDialog = document.querySelector('#history-dialog');
const historyList = document.querySelector('#history-list');
const richInspector = document.querySelector('#rich-inspector');
const rich = Object.fromEntries(['title', 'subtitle', 'layout', 'media-kind', 'media-src', 'notes', 'configuration'].map(name => [name, document.querySelector(`#rich-${name}`)]));
const markdownGuide = document.querySelector('#markdown-guide');
const markdownTools = document.querySelector('#markdown-tools');
const corporateProfileAutofill = document.querySelector('#corporate-profile-autofill');
const control = { presentation: document.querySelector('#presentation-elapsed'), slide: document.querySelector('#slide-elapsed'), minutes: document.querySelector('#countdown-minutes'), toggle: document.querySelector('#toggle-countdown'), status: document.querySelector('#countdown-status'), cue: document.querySelector('#copilot-cue'), cli: document.querySelector('#copilot-cli'), copilotStatus: document.querySelector('#copilot-status'), output: document.querySelector('#copilot-output'), endpoint: document.querySelector('#mcp-endpoint'), token: document.querySelector('#mcp-token'), scope: document.querySelector('#mcp-scope'), approvalStatus: document.querySelector('#approval-status'), operatorRequests: document.querySelector('#operator-requests') };
let pendingUpdate; let sourceEditPending = false; let selectedSlide = 0; let currentState = {}; let previewRevision = -1; let thumbnailTimer; let draggingSlide = null;
const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const formatTime = milliseconds => { const seconds = Math.max(0, Math.ceil((milliseconds || 0) / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
const starterCorporateProfile = { name: 'Corporate profile', company: '', theme: 'analyst-proof', branding: { logo: '', watermark: '', favicon: '', company_url: '' }, style: { primary_color: '#315DFF', secondary_color: '#111827', accent_color: '#315DFF', font_heading: '', font_body: '', font_mono: '' } };
const corporateProfileFields = {
  name: document.querySelector('#corporate-profile-name'), company: document.querySelector('#corporate-profile-company'), theme: document.querySelector('#corporate-profile-theme'), logo: document.querySelector('#corporate-profile-logo'), watermark: document.querySelector('#corporate-profile-watermark'), companyUrl: document.querySelector('#corporate-profile-url'), primary: document.querySelector('#corporate-profile-primary'), secondary: document.querySelector('#corporate-profile-secondary'), accent: document.querySelector('#corporate-profile-accent'), heading: document.querySelector('#corporate-profile-heading-font'), body: document.querySelector('#corporate-profile-body-font'), mono: document.querySelector('#corporate-profile-mono-font'),
};
function parsedCorporateProfile() {
  return {
    name: corporateProfileFields.name.value, company: corporateProfileFields.company.value, theme: corporateProfileFields.theme.value,
    branding: { logo: corporateProfileFields.logo.value, watermark: corporateProfileFields.watermark.value, company_url: corporateProfileFields.companyUrl.value },
    style: { primary_color: corporateProfileFields.primary.value, secondary_color: corporateProfileFields.secondary.value, accent_color: corporateProfileFields.accent.value, font_heading: corporateProfileFields.heading.value, font_body: corporateProfileFields.body.value, font_mono: corporateProfileFields.mono.value },
    apply_to_new_rich_decks: corporateProfileAutofill.checked,
  };
}
function syncCorporateProfile(profile = starterCorporateProfile, themes = []) {
  const value = { ...starterCorporateProfile, ...(profile || {}), branding: { ...starterCorporateProfile.branding, ...(profile?.branding || {}) }, style: { ...starterCorporateProfile.style, ...(profile?.style || {}) } };
  if (!corporateProfileFields.theme.options.length && themes.length) corporateProfileFields.theme.innerHTML = themes.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.label || item.name)}</option>`).join('');
  const assignments = { name: value.name, company: value.company, theme: value.theme, logo: value.branding.logo, watermark: value.branding.watermark, companyUrl: value.branding.company_url, primary: value.style.primary_color, secondary: value.style.secondary_color, accent: value.style.accent_color, heading: value.style.font_heading, body: value.style.font_body, mono: value.style.font_mono };
  Object.entries(assignments).forEach(([key, fieldValue]) => { const field = corporateProfileFields[key]; if (field && document.activeElement !== field) field.value = fieldValue || (field.type === 'color' ? starterCorporateProfile.style[`${key}_color`] || '#315DFF' : ''); });
  corporateProfileAutofill.checked = Boolean(value.apply_to_new_rich_decks);
}

function markdownSlides(value) { return value.split(/\n\s*(?:---|\n\s*\n)\s*\n/g).filter(Boolean).map((text, index) => ({ start: value.indexOf(text), title: text.match(/^#\s+(.+)$/m)?.[1]?.trim() || `Slide ${index + 1}`, subtitle: text.match(/^##\s+(.+)$/m)?.[1]?.trim() || '', image: text.match(/^!\[[^\]]*\]\(([^\s)]+)\)$/m)?.[1] || '', hasMedia: /^@\[(?:video|audio)(?::[^\]]*)?\]\([^\s)]+\)$/mi.test(text) })); }
const slides = () => currentState.sourceKind && currentState.sourceKind !== 'markdown' ? (currentState.slides || []) : markdownSlides(source.value);
function renderThumbnails() {
  const all = slides(); selectedSlide = Math.min(selectedSlide, Math.max(0, all.length - 1)); const virtual = all.length > 80, row = 120, visible = virtual ? 70 : all.length; const start = virtual ? Math.max(0, Math.min(all.length - visible, Math.floor(slideList.scrollTop / row) - 12)) : 0, end = Math.min(all.length, start + visible);
  slideList.innerHTML = `${virtual ? `<div aria-hidden="true" style="height:${start * row}px"></div>` : ''}${all.slice(start, end).map((slide, local) => { const index = start + local, kind = slide.hasChart ? 'Chart' : slide.hasDiagram ? 'Diagram' : slide.hasMedia ? 'Media' : slide.layout && slide.layout !== 'bullets' ? slide.layout : ''; return `<button class="thumbnail${index === selectedSlide ? ' selected' : ''}" data-index="${index}" draggable="true" aria-current="${index === selectedSlide ? 'true' : 'false'}"><span class="thumbnail-number">${String(index + 1).padStart(2, '0')}</span><span class="thumbnail-canvas">${slide.image ? `<img src="${escapeHtml(slide.image)}" alt="">` : ''}${kind ? `<em>${escapeHtml(kind)}</em>` : ''}<strong>${escapeHtml(slide.title)}</strong>${slide.subtitle ? `<small>${escapeHtml(slide.subtitle)}</small>` : ''}</span><span class="thumbnail-title">${escapeHtml(slide.title)}</span></button>`; }).join('')}${virtual ? `<div aria-hidden="true" style="height:${Math.max(0, all.length - end) * row}px"></div>` : ''}`;
  document.querySelector('#document-meta').textContent = `${all.length} slides`; document.querySelector('#deck-duration').textContent = virtual ? `${all.length} slides · optimized rail` : `Estimated duration: ${Math.max(1, Math.round(source.value.trim().split(/\s+/).filter(Boolean).length / 130))} min`; document.querySelector('#current-slide-label').textContent = `Slide ${selectedSlide + 1} of ${all.length}`;
  document.querySelector('#move-slide-up').disabled = selectedSlide === 0 || currentState.renderState === 'rendering'; document.querySelector('#move-slide-down').disabled = selectedSlide >= all.length - 1 || currentState.renderState === 'rendering'; document.querySelector('#duplicate-slide').disabled = currentState.renderState === 'rendering'; document.querySelector('#delete-slide').disabled = currentState.renderState === 'rendering';
}
const setFeedback = message => { feedback.textContent = message; };
function syncWriterHighlight() {
  if (currentState.sourceKind === 'markdown' || !currentState.sourceKind) writerHighlights.innerHTML = highlightMarkdownWriter(source.value);
  else writerHighlights.textContent = source.value;
  writerHighlights.scrollTop = source.scrollTop;
  writerHighlights.scrollLeft = source.scrollLeft;
}
function selectSlide(index, focus = false) { selectedSlide = index; const range = currentState.sourceKind !== 'markdown' ? currentState.sourceRanges?.[index] : markdownSlides(source.value)[index]; if (range) { source.setSelectionRange(range.start, range.start); source.scrollTop = Math.max(0, source.value.slice(0, range.start).split('\n').length * 20 - source.clientHeight / 3); syncWriterHighlight(); if (focus) source.focus(); } renderThumbnails(); window.gammaDesktop.navigate(index); }
function updateSource() { clearTimeout(pendingUpdate); sourceEditPending = true; syncWriterHighlight(); renderThumbnails(); setFeedback('Local change · render pending…'); pendingUpdate = setTimeout(() => window.gammaDesktop.updateSource(source.value), 300); }
async function flushSource() { clearTimeout(pendingUpdate); const state = await window.gammaDesktop.flushSource(source.value); applyState(state, true); if (state.error || state.renderState !== 'ready') throw new Error(state.error?.message || 'Wait for the presentation to finish rendering.'); return state; }
initializeConnections({ applyState, flushSource, title: () => currentState.title });
function insertAtCursor(value) { source.setRangeText(value, source.selectionStart, source.selectionEnd, 'end'); source.dispatchEvent(new Event('input', { bubbles: true })); source.focus(); }
async function run(message, action) { setFeedback(message); try { const result = await action(); if (result) applyState(result, true); setFeedback(result?.dirty ? 'Local changes' : 'Saved locally'); } catch (error) { setFeedback(`Error: ${error instanceof Error ? error.message : 'action unavailable'}`); } }
let renderedTemplateCatalog = '';
function renderTemplates(templates = currentState.templates || []) {
  const catalog = JSON.stringify(templates);
  if (catalog === renderedTemplateCatalog) return;
  renderedTemplateCatalog = catalog;
  templateList.replaceChildren(...templates.map(template => {
    const option = document.createElement('button'); option.type = 'button'; option.className = 'template-option'; option.dataset.templateId = template.id;
    const copy = document.createElement('div'); const title = document.createElement('strong'); const description = document.createElement('p'); const kind = document.createElement('span');
    title.textContent = template.title; description.textContent = template.description; kind.textContent = `${template.kind} · ${template.theme}`;
    copy.append(title, description); option.append(copy, kind); return option;
  }));
}
function openTemplateDialog() {
  renderTemplates();
  if (!templateDialog.open) templateDialog.showModal();
}
function renderHistory(revisions = currentState.revisions || []) {
  const entries = revisions.map(revision => {
    const option = document.createElement('button'); option.type = 'button'; option.className = 'template-option'; option.dataset.revisionId = revision.id;
    const copy = document.createElement('div'); const title = document.createElement('strong'); const description = document.createElement('p'); const kind = document.createElement('span');
    title.textContent = revision.reason || 'Local revision'; description.textContent = new Date(revision.createdAt).toLocaleString(); kind.textContent = `${revision.sourceKind?.toUpperCase() || 'SOURCE'} · ${revision.theme || 'theme'}`;
    copy.append(title, description); option.append(copy, kind); return option;
  });
  if (!entries.length) { const empty = document.createElement('p'); empty.className = 'template-option'; empty.textContent = 'Your first local revision appears shortly after you edit, and every manual save is recorded.'; historyList.replaceChildren(empty); return; }
  historyList.replaceChildren(...entries);
}
function openHistoryDialog() { renderHistory(); if (!historyDialog.open) historyDialog.showModal(); }
function syncInspectors(state) { const editor = state.currentSlide?.editor, isRich = Boolean(editor), isMarkdown = state.sourceKind === 'markdown'; richInspector.hidden = !isRich; markdownGuide.hidden = !isMarkdown; markdownTools.hidden = !isMarkdown; writerActions.hidden = !isMarkdown; rawSourceToggle.hidden = !isMarkdown; if (!editor) return; rich.layout.innerHTML = (state.richLayouts || []).map(layout => `<option value="${escapeHtml(layout)}">${escapeHtml(layout)}</option>`).join(''); rich.title.value = editor.title; rich.subtitle.value = editor.subtitle; rich.notes.value = editor.notes; rich.layout.value = editor.layout; rich['media-kind'].value = editor.media.kind; rich['media-src'].value = editor.media.src; rich.configuration.value = editor.configuration; }
function renderOperatorRequests(requests = []) {
  const pending = requests.filter(request => request.status === 'pending' || request.status === 'running');
  control.approvalStatus.textContent = pending.length ? `${pending.length} live action${pending.length === 1 ? '' : 's'} awaiting operator approval.` : 'No pending co-pilot actions.';
  control.operatorRequests.replaceChildren(...pending.map(request => {
    const item = document.createElement('article'); item.className = `operator-request ${request.status === 'running' ? 'is-running' : ''}`;
    const heading = document.createElement('strong'); heading.textContent = request.label || request.action || 'Live action';
    const note = document.createElement('p'); note.textContent = request.note || 'No additional note.';
    const actions = document.createElement('div'); actions.className = 'compact-actions';
    const approve = document.createElement('button'); approve.type = 'button'; approve.dataset.operatorRequest = request.id; approve.dataset.operatorDecision = 'approve'; approve.textContent = request.status === 'running' ? 'Running…' : 'Approve & run'; approve.disabled = request.status === 'running';
    const reject = document.createElement('button'); reject.type = 'button'; reject.dataset.operatorRequest = request.id; reject.dataset.operatorDecision = 'reject'; reject.textContent = 'Reject'; reject.disabled = request.status === 'running';
    actions.append(approve, reject); item.append(heading, note, actions); return item;
  }));
}
function syncControlRoom(state) {
  const live = state.timing || {}, cue = state.cue, mcp = state.mcp || {}, copilot = state.copilot || {};
  control.presentation.textContent = formatTime(live.presentationElapsedMs); control.slide.textContent = formatTime(live.slideElapsedMs); control.toggle.textContent = live.countdownRunning ? 'Pause' : 'Start'; control.status.textContent = live.overdue ? 'Time is up.' : live.countdownRemainingMs ? `${live.countdownRunning ? 'Running' : 'Paused'} · ${formatTime(live.countdownRemainingMs)} remaining` : 'No countdown running.';
  control.status.classList.toggle('is-overdue', Boolean(live.overdue)); if (cue && document.activeElement !== control.cue) control.cue.value = cue.text; if (!cue && document.activeElement !== control.cue) control.cue.value = '';
  control.endpoint.value = mcp.endpoint || ''; control.token.value = mcp.token || ''; control.scope.textContent = mcp.scope || 'Local MCP unavailable.'; renderOperatorRequests(state.operatorRequests || []);
  const available = copilot.available || {}; [...control.cli.options].forEach(option => { option.disabled = !available[option.value]; }); if (control.cli.options[control.cli.selectedIndex]?.disabled) control.cli.value = available.codex ? 'codex' : 'claude'; control.copilotStatus.textContent = copilot.status || 'Choose a local CLI to draft a private co-pilot response.'; control.output.hidden = !copilot.output; control.output.textContent = copilot.output || ''; document.querySelector('#run-copilot').disabled = Boolean(copilot.running || (!available.codex && !available.claude)); document.querySelector('#run-copilot').textContent = copilot.running ? 'Local co-pilot is working…' : 'Ask local co-pilot';
}
function syncDocumentStatus(state) {
  const status = state.error ? { label: 'Needs attention', tone: 'error' }
    : state.recoveryRestored ? { label: 'Recovered local draft', tone: 'draft' }
      : state.dirty ? { label: 'Draft · not published', tone: 'draft' }
        : state.sourcePath ? { label: 'Saved locally', tone: 'saved' }
          : { label: 'New local draft', tone: 'draft' };
  documentStatus.textContent = status.label;
  documentStatus.dataset.tone = status.tone;
  documentStatus.title = status.label === 'Draft · not published' ? 'Save the source, then publish intentionally when it is ready.' : 'Publishing is always an intentional operation.';
}
function applyState(state = {}, forceSource = false) {
  currentState = { ...currentState, ...state }; if (state.source === source.value || forceSource) sourceEditPending = false; if (typeof state.source === 'string' && (forceSource || (!sourceEditPending && document.activeElement !== source))) source.value = state.source; if (state.title) document.querySelector('#document-name').textContent = state.title; if (Number.isFinite(state.currentIndex)) selectedSlide = state.currentIndex;
  const theme = document.querySelector('#theme'), display = document.querySelector('#display'); if (Array.isArray(state.themes) && !theme.options.length) theme.innerHTML = state.themes.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.label || item.name)}</option>`).join(''); if (Array.isArray(state.displays) && !display.options.length) display.innerHTML = state.displays.map(item => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join(''); if (state.theme) theme.value = state.theme; if (state.stageDisplayId) display.value = state.stageDisplayId;
  const isRich = state.sourceKind && state.sourceKind !== 'markdown'; source.classList.toggle('deck-source', isRich); writerShell.classList.toggle('rich-source', isRich); source.spellcheck = !isRich; document.querySelector('#source-language').textContent = isRich ? state.sourceLanguage || 'Source' : writerShell.classList.contains('raw-source') ? 'Markdown' : 'Writer'; document.querySelector('#source-help').textContent = isRich ? `${state.sourceLanguage} is the source of truth. The inspector edits the selected slide, while full configuration covers charts, diagrams, media and animations.` : 'Ordinary prose is your private script. Choose Show only when a line belongs on the stage.'; syncInspectors(state); syncWriterHighlight();
  syncCorporateProfile(state.corporateProfile, state.themes || currentState.themes || []);
  if (previewRevision !== state.rendererRevision) { previewRevision = state.rendererRevision; preview.src = `${state.rendererUrl}&gamma-preview=1#/${state.currentIndex || 0}`; } else preview.contentWindow?.postMessage({ type: 'gamma-presenter-navigate', index: state.currentIndex || 0 }, '*'); preview.setAttribute('aria-busy', String(state.renderState === 'rendering'));
  rendererStatus.textContent = state.renderState === 'rendering' ? 'Gamma render in progress…' : state.renderState === 'invalid' ? 'Last valid render preserved' : isRich ? 'Rich Gamma render · source and inspector synchronized' : 'Live Gamma render'; syncDocumentStatus(state); syncControlRoom(state);
  if (templateDialog.open) renderTemplates(); if (historyDialog.open) renderHistory();
  if (state.error) setFeedback(`Error${state.error.line ? ` on line ${state.error.line}${state.error.column ? `:${state.error.column}` : ''}` : ''}: ${state.error.message}`); else if (state.recoveryRestored) setFeedback('Local draft recovered · save it to keep it'); else if (state.renderState === 'ready' && state.dirty) setFeedback('Local changes · render up to date'); renderThumbnails(); document.title = `${state.title || 'Gamma Presenter'} — Gamma Presenter`;
}
function currentLineRange() {
  const start = source.value.lastIndexOf('\n', Math.max(0, source.selectionStart - 1)) + 1;
  const endAt = source.value.indexOf('\n', source.selectionEnd);
  return { start, end: endAt < 0 ? source.value.length : endAt };
}
function formatCurrentLine(prefix) {
  const { start, end } = currentLineRange();
  const line = source.value.slice(start, end);
  const next = formatWriterLine(line, prefix);
  source.setRangeText(next, start, end, 'end');
  source.dispatchEvent(new Event('input', { bubbles: true }));
  source.focus();
}
function startNewMoment() {
  const before = source.value.slice(0, source.selectionStart);
  insertAtCursor(writerMomentGap(before));
}
function insertWriterStructure(kind) {
  const structures = {
    comparison: '\n\n| Before | After |\n| --- | --- |\n| Manual | Automated |\n',
    table: '\n\n| Signal | Owner | Status |\n| --- | --- | --- |\n| Decision | Team | Active |\n',
  };
  insertAtCursor(structures[kind] || '');
}
function writerCommand(command) {
  if (['headline', 'supporting', 'point', 'quote'].includes(command)) formatCurrentLine(command);
  if (command === 'moment') startNewMoment();
}

source.addEventListener('input', updateSource); source.addEventListener('scroll', syncWriterHighlight); slideList.addEventListener('click', event => { const item = event.target.closest('[data-index]'); if (item) selectSlide(Number(item.dataset.index), true); });
slideList.addEventListener('dragstart', event => { const item = event.target.closest('[data-index]'); if (!item) return; draggingSlide = Number(item.dataset.index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(draggingSlide)); item.classList.add('dragging'); });
slideList.addEventListener('dragover', event => { if (draggingSlide === null || !event.target.closest('[data-index]')) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; });
slideList.addEventListener('drop', event => { const item = event.target.closest('[data-index]'); if (!item || draggingSlide === null) return; event.preventDefault(); const destination = Number(item.dataset.index); const origin = draggingSlide; draggingSlide = null; document.querySelectorAll('.thumbnail.dragging').forEach(node => node.classList.remove('dragging')); if (origin !== destination) mutateSlides('move', destination); });
slideList.addEventListener('dragend', () => { draggingSlide = null; document.querySelectorAll('.thumbnail.dragging').forEach(node => node.classList.remove('dragging')); });
slideList.addEventListener('scroll', () => { if (slides().length > 80) { clearTimeout(thumbnailTimer); thumbnailTimer = setTimeout(renderThumbnails, 40); } });
const mutateSlides = (action, targetIndex) => run({ add: 'Adding slide…', duplicate: 'Duplicating slide…', delete: 'Deleting slide…', move: 'Moving slide…' }[action], () => window.gammaDesktop.mutateSlides(action, selectedSlide, targetIndex));
document.querySelector('#add-slide').addEventListener('click', () => mutateSlides('add'));
document.querySelector('#duplicate-slide').addEventListener('click', () => mutateSlides('duplicate'));
document.querySelector('#delete-slide').addEventListener('click', () => mutateSlides('delete'));
document.querySelector('#move-slide-up').addEventListener('click', () => mutateSlides('move', selectedSlide - 1));
document.querySelector('#move-slide-down').addEventListener('click', () => mutateSlides('move', selectedSlide + 1));
writerActions.addEventListener('click', event => { const button = event.target.closest('[data-writer-command]'); if (button) writerCommand(button.dataset.writerCommand); });
document.querySelectorAll('[data-writer-insert]').forEach(button => button.addEventListener('click', () => insertWriterStructure(button.dataset.writerInsert)));
document.querySelector('#import-media').addEventListener('click', () => run('Choosing local media…', () => window.gammaDesktop.importMedia(selectedSlide)));
document.querySelector('#writer-import-media').addEventListener('click', () => run('Choosing local media…', () => window.gammaDesktop.importMedia(selectedSlide)));
rawSourceToggle.addEventListener('click', () => {
  const raw = writerShell.classList.toggle('raw-source');
  source.classList.toggle('raw-source', raw);
  rawSourceToggle.setAttribute('aria-pressed', String(raw));
  rawSourceToggle.textContent = raw ? 'Writer' : 'Markdown';
  rawSourceToggle.title = raw ? 'Return to the document writing view' : 'Show portable Markdown source';
  document.querySelector('#source-language').textContent = raw ? 'Markdown' : 'Writer';
  source.focus();
});
document.querySelector('#open-templates').addEventListener('click', openTemplateDialog);
document.querySelector('#close-templates').addEventListener('click', () => templateDialog.close());
templateDialog.addEventListener('click', event => { if (event.target === templateDialog) templateDialog.close(); });
templateList.addEventListener('click', event => {
  const option = event.target.closest('[data-template-id]'); if (!option) return;
  const template = (currentState.templates || []).find(item => item.id === option.dataset.templateId); if (!template) return;
  if (currentState.dirty && !window.confirm(`Start from “${template.title}”? Unsaved changes in the current presentation will be replaced.`)) return;
  templateDialog.close(); run(`Starting ${template.title}…`, () => window.gammaDesktop.applyTemplate(template.id));
});
document.querySelector('#open-history').addEventListener('click', openHistoryDialog);
document.querySelector('#close-history').addEventListener('click', () => historyDialog.close());
historyDialog.addEventListener('click', event => { if (event.target === historyDialog) historyDialog.close(); });
historyList.addEventListener('click', async event => {
  const option = event.target.closest('[data-revision-id]'); if (!option) return;
  try { await flushSource(); } catch (error) { setFeedback(`Error: ${error instanceof Error ? error.message : 'Wait for the presentation to finish rendering.'}`); return; }
  if (!window.confirm('Restore this revision? Your current draft is preserved in local history first.')) return;
  historyDialog.close(); run('Restoring local revision…', () => window.gammaDesktop.restoreRevision(option.dataset.revisionId));
});
document.addEventListener('dragover', event => { if (!event.dataTransfer?.types.includes('Files')) return; event.preventDefault(); document.body.classList.add('dragging-media'); });
document.addEventListener('dragleave', event => { if (event.relatedTarget) return; document.body.classList.remove('dragging-media'); });
document.addEventListener('drop', event => { if (!event.dataTransfer?.files?.length) return; event.preventDefault(); document.body.classList.remove('dragging-media'); run('Importing dropped media…', () => window.gammaDesktop.importDroppedMedia(event.dataTransfer.files[0], selectedSlide)); });
for (const key of ['title', 'subtitle', 'layout', 'media-kind', 'media-src', 'notes']) rich[key].addEventListener('change', () => run('Updating slide…', () => window.gammaDesktop.patchRichSlide(selectedSlide, { title: rich.title.value, subtitle: rich.subtitle.value, notes: rich.notes.value, layout: rich.layout.value, media: { kind: rich['media-kind'].value, src: rich['media-src'].value } })));
document.querySelector('#apply-rich-configuration').addEventListener('click', () => run('Validating configuration…', () => window.gammaDesktop.patchRichSlide(selectedSlide, { configuration: rich.configuration.value }))); document.querySelector('#theme').addEventListener('change', event => run('Applying theme…', () => window.gammaDesktop.setTheme(event.target.value))); document.querySelector('#display').addEventListener('change', event => { window.gammaDesktop.moveStage(event.target.value); setFeedback('Stage moved'); }); document.querySelector('#open-document').addEventListener('click', () => run('Opening…', () => window.gammaDesktop.openDocument())); document.querySelector('#save-document').addEventListener('click', () => run('Saving…', () => window.gammaDesktop.saveDocument())); document.querySelector('#present').addEventListener('click', async () => { setFeedback('Opening stage…'); try { await flushSource(); await window.gammaDesktop.present(); setFeedback('Stage opened on the selected display'); } catch (error) { setFeedback(`Error: ${error instanceof Error ? error.message : 'Unable to open Stage'}`); } });
document.querySelector('#save-corporate-profile').addEventListener('click', () => run('Saving corporate profile…', () => window.gammaDesktop.setCorporateProfile(parsedCorporateProfile())));
document.querySelector('#apply-corporate-profile').addEventListener('click', () => run('Applying corporate profile…', () => window.gammaDesktop.applyCorporateProfile(parsedCorporateProfile())));
document.querySelector('#set-countdown').addEventListener('click', () => run('Setting countdown…', () => window.gammaDesktop.countdown('set', Number(control.minutes.value)))); document.querySelector('#toggle-countdown').addEventListener('click', () => run('Updating countdown…', () => window.gammaDesktop.countdown(currentState.timing?.countdownRunning ? 'pause' : 'start'))); document.querySelector('#clear-countdown').addEventListener('click', () => run('Clearing countdown…', () => window.gammaDesktop.countdown('clear'))); document.querySelector('#send-cue').addEventListener('click', () => run('Showing speaker cue…', () => window.gammaDesktop.setCue(control.cue.value, 'normal'))); document.querySelector('#send-urgent-cue').addEventListener('click', () => run('Sending urgent cue…', () => window.gammaDesktop.setCue(control.cue.value, 'urgent'))); document.querySelector('#clear-cue').addEventListener('click', () => run('Clearing speaker cue…', () => window.gammaDesktop.clearCue())); document.querySelector('#run-copilot').addEventListener('click', () => run('Starting local co-pilot…', () => window.gammaDesktop.runCopilot(control.cli.value, document.querySelector('#copilot-prompt').value))); document.querySelector('#reveal-mcp-token').addEventListener('click', event => { const reveal = control.token.type === 'password'; control.token.type = reveal ? 'text' : 'password'; event.currentTarget.textContent = reveal ? 'Hide token' : 'Reveal token'; }); document.querySelector('#copy-mcp-config').addEventListener('click', async () => { const config = JSON.stringify({ mcpServers: { 'gamma-presenter': { url: control.endpoint.value, headers: { Authorization: `Bearer ${control.token.value}` } } } }, null, 2); try { await navigator.clipboard.writeText(config); setFeedback('MCP connection copied'); } catch { setFeedback('Clipboard access unavailable'); } });
control.operatorRequests.addEventListener('click', event => { const button = event.target.closest('[data-operator-request]'); if (!button) return; const approved = button.dataset.operatorDecision === 'approve'; run(approved ? 'Approving live action…' : 'Rejecting live action…', () => window.gammaDesktop.resolveOperatorAction(button.dataset.operatorRequest, approved)); });
document.querySelector('#focus-preview').addEventListener('click', event => { const active = document.body.classList.toggle('preview-focus'); event.currentTarget.setAttribute('aria-pressed', String(active)); event.currentTarget.textContent = active ? 'Return to editor' : 'Expand preview'; }); document.addEventListener('keydown', event => { if (!event.metaKey) return; if (event.key.toLowerCase() === 'o') { event.preventDefault(); run('Opening…', () => window.gammaDesktop.openDocument()); } if (event.key.toLowerCase() === 's') { event.preventDefault(); run('Saving…', () => window.gammaDesktop.saveDocument()); } if (event.key.toLowerCase() === 'd') { event.preventDefault(); document.body.classList.toggle('focus-mode'); } if (event.key === 'Enter' && event.shiftKey && currentState.sourceKind === 'markdown') { event.preventDefault(); startNewMoment(); } });
window.gammaDesktop.onState(applyState); applyState(await window.gammaDesktop.getSnapshot());
