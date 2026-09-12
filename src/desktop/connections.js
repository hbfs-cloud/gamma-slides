import { presentationShareKit, publicPresentationUrl } from '../site/sharing.js';

/** Connection setup never authorizes an account or publishes as a side effect of opening the dialog. */
export function initializeConnections({ applyState, flushSource, title }) {
  const dialog = document.querySelector('#connections-dialog');
  const controls = document.querySelector('#connections-controls');
  const status = document.querySelector('#connections-status');
  const backupList = document.querySelector('#drive-backups');
  const publication = document.querySelector('#publication-result');
  const shareUrl = document.querySelector('#share-url');
  let busy = false;

  function message(value, error = false) {
    status.textContent = value;
    status.classList.toggle('is-error', error);
  }
  function showStatus(result) {
    if (result.google) {
      const google = result.google;
      document.querySelector('#drive-status').textContent = google.connected
        ? 'Session stored locally. Access is verified when you back up or list files.'
        : google.configured ? 'Desktop OAuth client ready. Connect your Google account to continue.'
          : 'Not configured. Import your Google Desktop OAuth client JSON first.';
      dialog.querySelector('[data-connection="google-connect"]').disabled = !google.configured;
      for (const action of ['google-backup', 'google-list', 'google-disconnect']) {
        dialog.querySelector(`[data-connection="${action}"]`).disabled = !google.connected;
      }
    }
    if (result.delivery) {
      const describe = (name, value) => `${name}: ${value?.authenticated ? 'CLI session available' : value?.available ? 'sign in with the CLI first' : 'CLI not found'}`;
      document.querySelector('#delivery-status').textContent = `${describe('GitHub', result.delivery.github)} · ${describe('Vercel', result.delivery.vercel)}. Recheck after signing in.`;
      for (const provider of ['github', 'vercel']) dialog.querySelector(`[data-connection="${provider}-publish"]`).disabled = !result.delivery[provider]?.authenticated;
    }
  }
  function showBackups(backups) {
    backupList.replaceChildren();
    if (!backups.length) { backupList.textContent = 'No Gamma Presenter source backups found in this account.'; return; }
    for (const backup of backups) {
      const row = document.createElement('div');
      row.className = 'connection-backup';
      const label = document.createElement('span');
      label.textContent = `${backup.name} · ${backup.modifiedTime ? new Date(backup.modifiedTime).toLocaleString('en') : 'Saved backup'}`;
      const restore = document.createElement('button');
      restore.type = 'button';
      restore.textContent = 'Open as draft';
      restore.setAttribute('aria-label', `Open ${backup.name} as an unsaved draft`);
      restore.addEventListener('click', () => act('google-restore', { id: backup.id }));
      row.append(label, restore);
      backupList.append(row);
    }
  }
  async function act(action, options = {}) {
    if (busy) return;
    busy = true;
    controls.disabled = true;
    dialog.setAttribute('aria-busy', 'true');
    message(action === 'google-connect' ? 'Complete consent in your browser. This request expires after five minutes.' : 'Working…');
    try {
      if (['google-backup', 'google-restore', 'github-publish', 'vercel-publish'].includes(action)) await flushSource();
      const result = await window.gammaDesktop.connection(action, options);
      if (result.snapshot) applyState(result.snapshot, true);
      showStatus(result);
      if (result.backups) showBackups(result.backups);
      if (action === 'google-disconnect' && !result.cancelled) backupList.replaceChildren();
      if (result.publication) {
        shareUrl.value = '';
        publication.textContent = 'Deployment submitted; availability has not been verified. ';
        let url;
        try { if (result.publication.url) url = publicPresentationUrl(result.publication.url); } catch { /* A missing/invalid URL must not disguise a successful remote submission. */ }
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.textContent = 'Open published URL';
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.addEventListener('click', event => {
            event.preventDefault();
            window.gammaDesktop.openPublicUrl(url).catch(error => message(error?.message || 'Could not open the browser. Copy the URL instead.', true));
          });
          publication.append(link);
          shareUrl.value = url;
        } else publication.append('Check the provider dashboard for the deployment URL before sharing.');
      }
      message(result.cancelled ? 'Cancelled. Nothing was published or replaced.' : result.message || 'Connection status updated.');
    } catch (error) {
      message(error?.message || 'The action failed. Nothing is marked as connected or published.', true);
    } finally {
      busy = false;
      controls.disabled = false;
      dialog.removeAttribute('aria-busy');
    }
  }
  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-connection]')?.dataset.connection;
    if (action) act(action, action === 'github-publish' ? {
      repo: document.querySelector('#publish-repo').value.trim(),
      slug: document.querySelector('#publish-slug').value.trim(),
    } : {});
    const share = event.target.closest('[data-share]')?.dataset.share;
    if (share) {
      try {
        const kit = presentationShareKit({ url: shareUrl.value, title: title() });
        navigator.clipboard.writeText(kit[share]).then(() => message('Copied to clipboard.'), () => message('Clipboard unavailable. Select and copy the URL manually.', true));
      } catch (error) { message(error.message, true); }
    }
  });
  document.querySelector('#close-connections').addEventListener('click', () => dialog.close());
  document.querySelector('#backup-google-drive').addEventListener('click', () => {
    if (!dialog.open) dialog.showModal();
    act('status');
  });
}
