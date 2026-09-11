const display = {
  position: document.querySelector('#position'),
  preview: document.querySelector('#speaker-preview'),
  previewCounter: document.querySelector('#preview-counter'),
  notes: document.querySelector('#notes'),
  queue: document.querySelector('#slide-queue'),
  railLabel: document.querySelector('#rail-label'),
  timer: document.querySelector('#timer'),
  slideTimer: document.querySelector('#slide-timer'),
  countdown: document.querySelector('#speaker-countdown'),
  cue: document.querySelector('#speaker-cue'),
};
let previewRevision = -1;

function setText(node, value, fallback = '') { node.textContent = value || fallback; }
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function queueCard(index, slide, active) {
  const item = document.createElement('button');
  item.className = `queue-card${active ? ' active' : ''}`;
  item.dataset.index = String(index);
  item.setAttribute('aria-current', active ? 'true' : 'false');
  const heading = document.createElement('span');
  heading.textContent = `Slide ${String(index + 1).padStart(2, '0')}`;
  const titleElement = document.createElement('strong');
  titleElement.textContent = slide?.title || `Slide ${index + 1}`;
  const noteElement = document.createElement('p');
  noteElement.textContent = slide?.subtitle || slide?.notes?.split('\n')[0] || '';
  item.append(heading, titleElement, noteElement);
  return item;
}

function applyState(state = {}) {
  const total = state.slideCount || 1;
  const current = Number(state.currentIndex || 0) + 1;
  setText(display.position, `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`);
  if (previewRevision !== state.rendererRevision) {
    previewRevision = state.rendererRevision;
    display.preview.src = `${state.rendererUrl}#/${state.currentIndex || 0}`;
  } else display.preview.contentWindow?.postMessage({ type: 'gamma-presenter-navigate', index: state.currentIndex || 0 }, '*');
  setText(display.previewCounter, `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`);
  setText(display.notes, state.currentSlide?.notes, 'No note for this slide. Look at the room, then advance.');
  const allSlides = Array.isArray(state.slides) && state.slides.length ? state.slides : [state.currentSlide];
  display.railLabel.textContent = document.body.classList.contains('thumbnails-mode') ? 'All slides' : 'Run of show';
  display.queue.replaceChildren(...allSlides.map((slide, index) => queueCard(index, slide, index === state.currentIndex)));
  const timing = state.timing || {}; display.timer.textContent = formatTime(timing.presentationElapsedMs); display.slideTimer.textContent = formatTime(timing.slideElapsedMs); display.countdown.hidden = !timing.countdownRemainingMs; display.countdown.classList.toggle('is-overdue', Boolean(timing.overdue)); display.countdown.querySelector('strong').textContent = timing.overdue ? 'TIME UP' : formatTime(timing.countdownRemainingMs);
  const cue = state.cue; display.cue.hidden = !cue; display.cue.classList.toggle('urgent', cue?.level === 'urgent'); display.cue.textContent = cue?.text || '';
}

document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => window.gammaDesktop.navigate(button.dataset.nav)));
display.queue.addEventListener('click', event => {
  const slide = event.target.closest('[data-index]');
  if (slide) window.gammaDesktop.navigate(Number(slide.dataset.index));
});
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-mode]').forEach(candidate => {
    const active = candidate === button;
    candidate.classList.toggle('active', active);
    candidate.setAttribute('aria-pressed', String(active));
  });
  document.body.classList.toggle('notes-mode', button.dataset.mode === 'notes');
  document.body.classList.toggle('thumbnails-mode', button.dataset.mode === 'thumbnails');
  display.railLabel.textContent = button.dataset.mode === 'thumbnails' ? 'All slides' : 'Run of show';
}));
document.querySelector('#stop').addEventListener('click', () => window.gammaDesktop.stopPresenting());
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.target.closest('button,input,textarea,select,[contenteditable]')) return;
  if (event.key === 'ArrowLeft') window.gammaDesktop.navigate('previous');
  if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); window.gammaDesktop.navigate('next'); }
  if (event.key === 'Escape') window.gammaDesktop.stopPresenting();
});
window.gammaDesktop.onState(applyState);
applyState(await window.gammaDesktop.getSnapshot());
