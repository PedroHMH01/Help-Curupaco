const panelId = 'help-curupaco-panel';
const toggleId = 'help-curupaco-toggle';
const contentId = 'help-curupaco-content';
const sidebarSelector = '.user-data.section.slide';

function getFrameUrl() {
  const params = new URLSearchParams({
    embedded: '1',
    contextUrl: location.href
  });
  return `${chrome.runtime.getURL('popup.html')}?${params.toString()}`;
}

function updateFrameContext(panel) {
  const content = panel.querySelector(`#${contentId}`);
  const frame = panel.querySelector('iframe');
  const contextUrl = location.href;
  if (!content.hidden && frame.dataset.contextUrl !== contextUrl) {
    frame.dataset.contextUrl = contextUrl;
    frame.src = getFrameUrl();
  }
}

function setPanelOpen(panel, open) {
  const toggle = panel.querySelector(`#${toggleId}`);
  const content = panel.querySelector(`#${contentId}`);
  const icon = toggle.querySelector('.collapsible-icon i');
  const frame = panel.querySelector('iframe');

  toggle.classList.toggle('collapsed', !open);
  toggle.setAttribute('aria-expanded', String(open));
  content.hidden = !open;
  icon.className = open ? 'fa fa-angle-down' : 'fa fa-angle-up';
  if (open && frame.dataset.contextUrl !== location.href) {
    frame.dataset.contextUrl = location.href;
    frame.src = getFrameUrl();
  }
}

function updatePanelIcon(panel, dataUrl) {
  const icon = panel.querySelector('.category-icon img');
  icon.src = dataUrl || chrome.runtime.getURL('icon.png');
}

function updatePanelPlacement(panel) {
  const sidebar = document.querySelector(sidebarSelector);
  if (!sidebar) {
    panel.hidden = true;
    if (panel.parentElement !== document.documentElement) {
      document.documentElement.appendChild(panel);
    }
    return;
  }

  panel.hidden = false;
  const firstItem = Array.from(sidebar.children).find(child => child !== panel);
  if (firstItem) {
    if (panel.parentElement !== sidebar || panel.previousElementSibling !== firstItem) {
      sidebar.insertBefore(panel, firstItem.nextElementSibling);
    }
  } else if (panel.parentElement !== sidebar) {
    sidebar.appendChild(panel);
  }
}

function createPanel() {
  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'ember-view';
  panel.hidden = true;

  const section = document.createElement('div');
  section.className = 'section';

  const accordion = document.createElement('div');
  accordion.className = 'ui-accordian ember-view';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = toggleId;
  toggle.className = 'header collapsed';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', contentId);

  const categoryIcon = document.createElement('div');
  categoryIcon.className = 'category-icon';
  const iconWrap = document.createElement('span');
  iconWrap.className = 'ui-icon size-medium';
  const image = document.createElement('img');
  image.className = 'ui-svg-icon';
  image.alt = '';
  image.src = chrome.runtime.getURL('icon.png');
  iconWrap.appendChild(image);
  categoryIcon.appendChild(iconWrap);

  const title = document.createElement('div');
  title.className = 'category-title';
  title.textContent = 'Help Curupaco';

  const collapsibleIcon = document.createElement('div');
  collapsibleIcon.className = 'collapsible-icon';
  const angle = document.createElement('i');
  angle.className = 'fa fa-angle-up';
  angle.setAttribute('aria-hidden', 'true');
  collapsibleIcon.appendChild(angle);

  toggle.append(categoryIcon, title, collapsibleIcon);

  const content = document.createElement('div');
  content.id = contentId;
  content.className = 'body help-curupaco-content';
  content.hidden = true;

  const card = document.createElement('div');
  card.className = 'card card-body';

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
  card.append(toolbar, frame);
  content.appendChild(card);
  accordion.append(toggle, content);
  section.appendChild(accordion);
  panel.appendChild(section);

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setPanelOpen(panel, !isOpen);
  });

  document.documentElement.appendChild(panel);
  updatePanelPlacement(panel);
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
  const panel = getPanel();
  updatePanelPlacement(panel);
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
