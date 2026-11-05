const panelId = 'help-curupaco-panel';
const toggleId = 'help-curupaco-toggle';
const contentId = 'help-curupaco-content';
const observationsPanelId = 'help-curupaco-observations-panel';
const sidebarSelector = '.user-data.section.slide';
const observationsConfigKey = 'helpCurupacoSupabaseConfig';
let extensionContextActive = true;
let urlObserver;
let sidebarSyncFrame = 0;
let priorityInboxSortApplied = false;
let priorityInboxSortMenuOpened = false;
let observationsConversationId = null;
let observations = [];

function removeLegacyFreshworksTheme() {
  const root = document.documentElement;
  const rootWasThemed = root.hasAttribute('data-help-curupaco-theme');
  const themedElements = [
    ...(rootWasThemed ? [root] : []),
    ...document.querySelectorAll('[data-help-curupaco-theme]')
  ];
  if (themedElements.length === 0) return;

  const legacyVariables = [
    '--background-overlay', '--hc-theme-page', '--hc-theme-surface', '--hc-theme-surface-alt',
    '--hc-theme-text', '--hc-theme-muted', '--hc-theme-border', '--hc-theme-accent',
    '--hc-theme-accent-soft', '--hc-theme-button-text', '--hc-theme-page-overlay',
    '--hc-theme-background-image',
    '--color-fill-base', '--color-fill-base-bold', '--color-fill-container', '--color-fill-neutral',
    '--color-fill-neutral-bold', '--color-fill-neutral-mild', '--color-fill-surface',
    '--color-fill-surface-secondary', '--color-fill-brand', '--color-text-primary',
    '--color-text-secondary', '--color-text-disabled', '--color-text-placeholder',
    '--color-text-inverse', '--color-text-brand', '--color-boundary-border',
    '--color-boundary-border-boldest', '--color-boundary-border-inverse',
    '--color-boundary-border-mild', '--color-boundary-border-milder',
    '--color-boundary-border-mildest', '--color-boundary-divider',
    '--color-boundary-divider-mildest', '--color-icon-primary', '--color-icon-secondary',
    '--color-icon-selected', '--freddy-card-bg-color', '--freddy-left-pane-color',
    '--freddy-wrapper-color', '--freddy-primary-color', '--freddy-link-color',
    '--freddy-border-color', '--freddy-border-gray-color', '--freddy-border-mildest-color',
    '--freddy-normal-border-color', '--freddy-disabled-color', '--freddy-placeholder-color',
    '--freddy-icon-primary', '--freddy-accordion-hover-color', '--freddy-tab-active-color',
    '--freddy-white-color', '--freddy-s25', '--freddy-s50', '--freddy-s75', '--freddy-s100',
    '--freddy-s500', '--freddy-s700', '--freddy-a100', '--freddy-a300', '--freddy-a500',
    '--freddy-a800', '--freddy-p700'
  ];

  themedElements.forEach(element => {
    legacyVariables.forEach(variable => element.style.removeProperty(variable));
    element.removeAttribute('data-help-curupaco-theme');
  });

  if (rootWasThemed || themedElements.includes(document.body)) {
    ['color', 'background-color', 'background-image', 'background-size', 'background-position', 'background-attachment']
      .forEach(property => document.body.style.removeProperty(property));
  }
}

removeLegacyFreshworksTheme();

function stopAfterContextInvalidation(error) {
  if (!error?.message?.includes('Extension context invalidated')) {
    throw error;
  }

  if (extensionContextActive) {
    extensionContextActive = false;
    urlObserver?.disconnect();
    if (sidebarSyncFrame) cancelAnimationFrame(sidebarSyncFrame);
    window.removeEventListener('message', updateFrameHeight);
    window.removeEventListener('popstate', handleUrlNavigation);
    window.removeEventListener('hashchange', handleUrlNavigation);
    console.warn('O contexto da extensão foi invalidado. Atualize esta aba do Freshworks.');
  }
}

function getExtensionUrl(resource) {
  if (!extensionContextActive) return null;

  try {
    return chrome.runtime.getURL(resource);
  } catch (error) {
    stopAfterContextInvalidation(error);
    return null;
  }
}

function isExtensionContextActive() {
  return Boolean(getExtensionUrl(''));
}

function getFrameUrl() {
  const params = new URLSearchParams({
    embedded: '1',
    contextUrl: location.href
  });
  const popupUrl = getExtensionUrl('popup.html');
  return popupUrl ? `${popupUrl}?${params.toString()}` : null;
}

function updateFrameContext(panel) {
  const content = panel.querySelector(`#${contentId}`);
  const frame = panel.querySelector('iframe');
  const contextUrl = location.href;
  if (!content.hidden && frame.dataset.contextUrl !== contextUrl) {
    const frameUrl = getFrameUrl();
    if (!frameUrl) return;
    frame.dataset.contextUrl = contextUrl;
    frame.src = frameUrl;
  }
}

function updatePanelIcon(panel, dataUrl) {
  const icon = panel.querySelector('.category-icon img');
  if (dataUrl) {
    icon.src = dataUrl;
    return;
  }

  const iconUrl = getExtensionUrl('icon.png');
  if (iconUrl) icon.src = iconUrl;
}

function selectPriorityInboxSort() {
  if (!isExtensionContextActive() || priorityInboxSortApplied) return;

  const sortMenuTrigger = document.querySelector(
    '.sla-enabled [data-test-info-options]'
  );
  const sortMenuOpen = sortMenuTrigger?.getAttribute('aria-expanded') === 'true';
  const priorityOption = document.querySelector('li[data-test-li-name="enablePi"]');
  if (priorityOption) {
    if (priorityOption.classList.contains('selected')) {
      priorityInboxSortApplied = true;
      return;
    }

    if (!sortMenuTrigger || sortMenuOpen) {
      priorityOption.click();
      priorityInboxSortApplied = true;
      return;
    }
  }

  if (
    priorityInboxSortMenuOpened ||
    !sortMenuTrigger ||
    sortMenuOpen
  ) {
    return;
  }

  priorityInboxSortMenuOpened = true;
  sortMenuTrigger.click();
}

function isPriorityInboxSortMutation(record) {
  const sortMenuTriggerSelector = '.sla-enabled [data-test-info-options]';
  const priorityOptionSelector = 'li[data-test-li-name="enablePi"]';

  if (record.type === 'attributes') {
    return record.target.matches(sortMenuTriggerSelector);
  }

  return [...record.addedNodes].some(node => (
    node.nodeType === Node.ELEMENT_NODE &&
    (
      node.matches(`${sortMenuTriggerSelector}, ${priorityOptionSelector}`) ||
      node.querySelector(`${sortMenuTriggerSelector}, ${priorityOptionSelector}`)
    )
  ));
}

function updateFrameHeight(event) {
  const panel = document.getElementById(panelId);
  const frame = panel?.querySelector('iframe');
  const extensionOrigin = getExtensionUrl('/');
  if (
    !extensionOrigin ||
    !frame ||
    event.source !== frame.contentWindow ||
    event.origin !== new URL(extensionOrigin).origin ||
    event.data?.type !== 'help-curupaco:resize' ||
    !Number.isFinite(event.data.height) ||
    event.data.height < 1
  ) {
    return;
  }

  frame.style.height = `${Math.ceil(event.data.height)}px`;
}

function updatePanelPlacement(panel) {
  const sidebar = document.querySelector(sidebarSelector);
  if (!sidebar) {
    panel.hidden = true;
    const observationsPanel = document.getElementById(observationsPanelId);
    if (observationsPanel) observationsPanel.hidden = true;
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

function getCurrentConversationId() {
  return location.pathname.match(/\/conversation\/([^/]+)/)?.[1] || null;
}

function getCurrentAgentName() {
  const nameElement = document.querySelector(
    '.session-user-dropdown [data-test-span-name="user-name"], ' +
    '.user-profile-detail [data-test-span-name="user-name"]'
  );
  return nameElement?.textContent?.trim() || '';
}

function setObservationsStatus(panel, message, isError = false) {
  const status = panel.querySelector('.hc-observations-status');
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

function renderObservations(panel) {
  const list = panel.querySelector('.hc-observations-list');
  list.replaceChildren();

  if (!observations.length) {
    const empty = document.createElement('p');
    empty.className = 'hc-observations-empty';
    empty.textContent = 'Ainda não há observações para esta conversa.';
    list.appendChild(empty);
    return;
  }

  observations.forEach(item => {
    const entry = document.createElement('article');
    entry.className = 'hc-observation-entry';

    const meta = document.createElement('div');
    meta.className = 'hc-observation-meta';
    const agent = document.createElement('strong');
    agent.textContent = item.agent_name;
    const date = document.createElement('time');
    date.dateTime = item.created_at;
    date.textContent = new Date(item.created_at).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
    meta.append(agent, date);

    const text = document.createElement('p');
    text.className = 'hc-observation-text';
    text.textContent = item.observation;
    entry.append(meta, text);
    list.appendChild(entry);
  });
}

async function sendObservationsRequest(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) {
    throw new Error(response?.error || 'Não foi possível acessar as observações.');
  }
  return response.data;
}

async function loadObservations(panel) {
  const conversationId = getCurrentConversationId();
  observationsConversationId = conversationId;
  observations = [];
  renderObservations(panel);

  const form = panel.querySelector('.hc-observations-form');
  const saveButton = form.querySelector('button');
  const textarea = form.querySelector('textarea');
  const isConfigured = await chrome.storage.local.get(observationsConfigKey)
    .then(values => Boolean(values[observationsConfigKey]?.url && values[observationsConfigKey]?.anonKey))
    .catch(error => {
      console.error('Não foi possível verificar a conexão das observações:', error);
      setObservationsStatus(panel, 'Não foi possível ler a configuração do Supabase.', true);
      return false;
    });

  if (!conversationId) {
    textarea.disabled = true;
    saveButton.disabled = true;
    setObservationsStatus(panel, 'Abra uma conversa para consultar ou adicionar observações.');
    return;
  }
  if (!isConfigured) {
    textarea.disabled = true;
    saveButton.disabled = true;
    setObservationsStatus(panel, 'Configure a conexão Supabase nas opções da extensão.');
    return;
  }

  textarea.disabled = false;
  saveButton.disabled = false;
  setObservationsStatus(panel, 'Carregando observações...');
  try {
    const result = await sendObservationsRequest({
      type: 'help-curupaco:observations:list',
      conversationId
    });
    if (conversationId !== getCurrentConversationId()) return;
    observations = Array.isArray(result) ? result : [];
    renderObservations(panel);
    setObservationsStatus(
      panel,
      'As observações são compartilhadas com a equipe e não podem ser editadas ou removidas.'
    );
  } catch (error) {
    console.error('Não foi possível carregar as observações da conversa:', error);
    setObservationsStatus(panel, error.message || 'Falha ao carregar as observações.', true);
  }
}

function updateObservationsPanelPlacement(panel) {
  const sidebar = document.querySelector(sidebarSelector);
  const helpPanel = document.getElementById(panelId);
  if (!sidebar || !helpPanel) {
    if (!panel.hidden) panel.hidden = true;
    return;
  }

  if (panel.hidden) panel.hidden = false;
  if (panel.parentElement !== sidebar || panel.previousElementSibling !== helpPanel) {
    sidebar.insertBefore(panel, helpPanel.nextElementSibling);
  }
}

function createObservationsPanel() {
  const panel = document.createElement('div');
  panel.id = observationsPanelId;
  panel.className = 'section hc-conversation-observations';
  panel.hidden = true;

  const accordion = document.createElement('div');
  accordion.className = 'ui-accordian ember-view';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'header hc-observations-toggle';
  toggle.setAttribute('aria-expanded', 'false');

  const icon = document.createElement('div');
  icon.className = 'category-icon';
  const iconGlyph = document.createElement('i');
  iconGlyph.className = 'fa fa-sticky-note-o';
  iconGlyph.setAttribute('aria-hidden', 'true');
  icon.appendChild(iconGlyph);

  const title = document.createElement('div');
  title.className = 'category-title';
  title.textContent = 'Observações da conversa';

  const collapsibleIcon = document.createElement('div');
  collapsibleIcon.className = 'collapsible-icon';
  const angle = document.createElement('i');
  angle.className = 'fa fa-angle-down';
  angle.setAttribute('aria-hidden', 'true');
  collapsibleIcon.appendChild(angle);
  toggle.append(icon, title, collapsibleIcon);

  const content = document.createElement('div');
  content.className = 'body hc-observations-content';
  content.hidden = true;
  const card = document.createElement('div');
  card.className = 'card card-body hc-observations-card';

  const status = document.createElement('p');
  status.className = 'hc-observations-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const form = document.createElement('form');
  form.className = 'hc-observations-form';
  const textarea = document.createElement('textarea');
  textarea.maxLength = 3000;
  textarea.rows = 4;
  textarea.placeholder = 'Escreva uma observação para esta conversa...';
  textarea.setAttribute('aria-label', 'Nova observação da conversa');
  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.className = 'hc-observations-submit';
  saveButton.textContent = 'Adicionar observação';
  form.append(textarea, saveButton);

  const list = document.createElement('div');
  list.className = 'hc-observations-list';
  card.append(status, form, list);
  content.appendChild(card);
  accordion.append(toggle, content);
  panel.appendChild(accordion);

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    content.hidden = expanded;
    angle.classList.toggle('fa-angle-down', expanded);
    angle.classList.toggle('fa-angle-up', !expanded);
    if (!expanded) loadObservations(panel);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const observation = textarea.value.trim();
    if (!observation) {
      setObservationsStatus(panel, 'Escreva uma observação antes de salvar.', true);
      return;
    }

    const currentConversationId = getCurrentConversationId();
    if (!currentConversationId) {
      setObservationsStatus(panel, 'Abra uma conversa antes de salvar uma observação.', true);
      return;
    }

    saveButton.disabled = true;
    setObservationsStatus(panel, 'Salvando observação...');
    try {
      const result = await sendObservationsRequest({
        type: 'help-curupaco:observations:add',
        conversationId: currentConversationId,
        agentName: getCurrentAgentName(),
        observation
      });
      if (currentConversationId !== getCurrentConversationId()) return;
      if (!Array.isArray(result) || !result[0]) {
        throw new Error('O Supabase não confirmou a gravação da observação.');
      }

      observations.push(result[0]);
      renderObservations(panel);
      textarea.value = '';
      setObservationsStatus(
        panel,
        'Observação salva. Ela não pode ser editada ou removida.'
      );
    } catch (error) {
      console.error('Não foi possível salvar a observação:', error);
      setObservationsStatus(panel, error.message || 'Falha ao salvar a observação.', true);
    } finally {
      saveButton.disabled = false;
    }
  });

  setObservationsStatus(panel, 'Abra uma conversa para consultar ou adicionar observações.');
  renderObservations(panel);
  return panel;
}

function getObservationsPanel() {
  return document.getElementById(observationsPanelId) || createObservationsPanel();
}

function createPanel() {
  const iconUrl = getExtensionUrl('icon.png');
  if (!iconUrl) return null;

  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'ember-view';
  panel.hidden = true;

  const section = document.createElement('div');
  section.className = 'section';

  const accordion = document.createElement('div');
  accordion.className = 'ui-accordian ember-view';

  const toggle = document.createElement('div');
  toggle.id = toggleId;
  toggle.className = 'header';
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('tabindex', '0');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-controls', contentId);

  const categoryIcon = document.createElement('div');
  categoryIcon.className = 'category-icon';
  const iconWrap = document.createElement('span');
  iconWrap.className = 'ui-icon size-medium';
  const image = document.createElement('img');
  image.className = 'ui-svg-icon';
  image.alt = '';
  image.src = iconUrl;
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
  content.hidden = false;

  const setExpanded = expanded => {
    toggle.setAttribute('aria-expanded', String(expanded));
    content.hidden = !expanded;
    angle.classList.toggle('fa-angle-up', expanded);
    angle.classList.toggle('fa-angle-down', !expanded);
    if (expanded) updateFrameContext(panel);
  };

  toggle.addEventListener('click', () => {
    setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
  });
  toggle.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
  });

  const card = document.createElement('div');
  card.className = 'card card-body';

  const toolbar = document.createElement('div');
  toolbar.className = 'help-curupaco-toolbar';
  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.textContent = '⚙ Configurar';
  settingsButton.addEventListener('click', () => {
    if (!isExtensionContextActive()) return;
    chrome.runtime.sendMessage({ type: 'open-help-curupaco-settings' });
  });

  const frame = document.createElement('iframe');
  frame.title = 'Gerador de repasse Help Curupaco';

  toolbar.appendChild(settingsButton);
  card.append(toolbar, frame);
  content.appendChild(card);
  accordion.append(toggle, content);
  section.appendChild(accordion);
  panel.appendChild(section);

  document.documentElement.appendChild(panel);
  updatePanelPlacement(panel);
  updateFrameContext(panel);
  if (!isExtensionContextActive()) return panel;
  chrome.storage.local.get('helpCurupacoIcon').then(result => {
    if (panel.isConnected) updatePanelIcon(panel, result.helpCurupacoIcon);
  }).catch(error => {
    if (error?.message?.includes('Extension context invalidated')) {
      stopAfterContextInvalidation(error);
      return;
    }
    console.error('Não foi possível carregar o ícone personalizado:', error);
  });
  return panel;
}

window.addEventListener('message', updateFrameHeight);

function getPanel() {
  return document.getElementById(panelId) || createPanel();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (!isExtensionContextActive()) return;
  if (areaName === 'local' && changes[THEME_KEY]) {
    applyFreshworksHelpCurupacoTheme(changes[THEME_KEY].newValue);
  }
  if (areaName === 'local' && changes.helpCurupacoIcon) {
    updatePanelIcon(
      getPanel(),
      changes.helpCurupacoIcon.newValue || null
    );
  }
});

chrome.storage.local.get(THEME_KEY).then(values => {
  if (isExtensionContextActive()) {
    applyFreshworksHelpCurupacoTheme(values[THEME_KEY]);
  }
}).catch(error => {
  if (error?.message?.includes('Extension context invalidated')) {
    stopAfterContextInvalidation(error);
    return;
  }
  console.error('Não foi possível carregar o tema do Freshworks:', error);
});

let observedUrl = location.href;
function syncSidebarAndNavigation() {
  sidebarSyncFrame = 0;
  if (!isExtensionContextActive()) return;
  selectPriorityInboxSort();
  const panel = getPanel();
  if (!panel) return;
  updatePanelPlacement(panel);
  const observationsPanel = getObservationsPanel();
  updateObservationsPanelPlacement(observationsPanel);
  if (observedUrl === location.href) return;
  observedUrl = location.href;
  updateFrameContext(panel);
  const currentConversationId = getCurrentConversationId();
  if (
    observationsPanel.querySelector('.hc-observations-toggle')
      .getAttribute('aria-expanded') === 'true' &&
    observationsConversationId !== currentConversationId
  ) {
    loadObservations(observationsPanel);
  }
}

function scheduleSidebarSync() {
  if (sidebarSyncFrame) return;
  sidebarSyncFrame = requestAnimationFrame(syncSidebarAndNavigation);
}

function containsSidebarNode(nodes) {
  for (const node of nodes) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node.matches(sidebarSelector) || node.querySelector(sidebarSelector))
    ) {
      return true;
    }
  }
  return false;
}

function isSidebarMutation(record, sidebar) {
  if (record.target === sidebar) return true;
  const isSidebarParentChange = sidebar && record.target === sidebar.parentElement;
  const isDocumentRootChange =
    record.target === document.documentElement || record.target === document.body;
  if (!isSidebarParentChange && !isDocumentRootChange) return false;

  return containsSidebarNode(record.addedNodes) || containsSidebarNode(record.removedNodes);
}

urlObserver = new MutationObserver(records => {
  const navigationChanged = observedUrl !== location.href;
  if (navigationChanged) {
    selectPriorityInboxSort();
    scheduleSidebarSync();
    return;
  }

  if (records.some(isPriorityInboxSortMutation)) {
    selectPriorityInboxSort();
  }

  const sidebar = document.querySelector(sidebarSelector);
  let sidebarChanged = false;
  for (const record of records) {
    if (isSidebarMutation(record, sidebar)) {
      sidebarChanged = true;
      break;
    }
  }
  if (sidebarChanged) scheduleSidebarSync();
});

urlObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['aria-expanded']
});
selectPriorityInboxSort();
function handleUrlNavigation() {
  scheduleSidebarSync();
}
window.addEventListener('popstate', handleUrlNavigation);
window.addEventListener('hashchange', handleUrlNavigation);

getPanel();
const observationsPanel = getObservationsPanel();
updateObservationsPanelPlacement(observationsPanel);
