const panelId = 'help-curupaco-panel';

function getFrameUrl() {
  const params = new URLSearchParams({
    embedded: '1',
    contextUrl: location.href
  });
  return `${chrome.runtime.getURL('popup.html')}?${params.toString()}`;
}

function updateFrameContext(panel) {
  const frame = panel.querySelector('iframe');
  const contextUrl = location.href;
  if (!panel.querySelector('.help-curupaco-content').hidden &&
      frame.dataset.contextUrl !== contextUrl) {
    frame.dataset.contextUrl = contextUrl;
    frame.src = getFrameUrl();
  }
}

function setPanelOpen(panel, open) {
  const toggle = panel.querySelector('.help-curupaco-toggle');
  const content = panel.querySelector('.help-curupaco-content');
  const frame = panel.querySelector('iframe');

  toggle.setAttribute('aria-expanded', String(open));
  content.hidden = !open;
  if (open && frame.dataset.contextUrl !== location.href) {
    frame.dataset.contextUrl = location.href;
    frame.src = getFrameUrl();
  }
}

function updatePanelIcon(panel, dataUrl) {
  const icon = panel.querySelector('.help-curupaco-toggle img');
  icon.src = dataUrl || chrome.runtime.getURL('icon.png');
}

function createPanel() {
  const panel = document.createElement('section');
  panel.id = panelId;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'help-curupaco-toggle';
  toggle.title = 'Abrir Help Curupaco';
  toggle.setAttribute('aria-label', 'Abrir Help Curupaco');
  toggle.setAttribute('aria-expanded', 'false');
  const icon = document.createElement('img');
  icon.alt = '';
  icon.src = chrome.runtime.getURL('icon.png');
  toggle.appendChild(icon);

  const content = document.createElement('div');
  content.className = 'help-curupaco-content';
  content.hidden = true;

  const toolbar = document.createElement('div');
  toolbar.className = 'help-curupaco-toolbar';
  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.textContent = '⚙ Configurar';
  settingsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'open-help-curupaco-settings' });
  });

  const frame = document.createElement('iframe');
  frame.title = 'Gerador de repasse Help Curupaco';
  frame.loading = 'lazy';

  toolbar.appendChild(settingsButton);
  content.append(toolbar, frame);
  panel.append(toggle, content);

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setPanelOpen(panel, !isOpen);
  });

  document.documentElement.appendChild(panel);
  chrome.storage.local.get('helpCurupacoIcon').then(result => {
    if (panel.isConnected) updatePanelIcon(panel, result.helpCurupacoIcon);
  }).catch(error => {
    console.error('Não foi possível carregar o ícone personalizado:', error);
  });
  return panel;
}

function getPanel() {
  return document.getElementById(panelId) || createPanel();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.helpCurupacoIcon) {
    updatePanelIcon(
      getPanel(),
      changes.helpCurupacoIcon.newValue || null
    );
  }
});

let observedUrl = location.href;
let urlCheckScheduled = false;
const urlObserver = new MutationObserver(() => {
  if (urlCheckScheduled) return;
  urlCheckScheduled = true;
  queueMicrotask(() => {
    urlCheckScheduled = false;
    if (observedUrl === location.href) return;
    observedUrl = location.href;
    updateFrameContext(getPanel());
  });
});

urlObserver.observe(document.documentElement, {
  childList: true,
  subtree: true
});
window.addEventListener('popstate', () => updateFrameContext(getPanel()));
window.addEventListener('hashchange', () => updateFrameContext(getPanel()));

getPanel();
