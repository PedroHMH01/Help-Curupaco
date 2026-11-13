const GOJO_HOST_ID = 'help-gojo-whatsapp-host';
const GOJO_STYLE = `
  :host { all: initial; }
  .launcher {
    position: fixed; z-index: 2147483646; right: 24px; bottom: 88px;
    width: 52px; height: 52px; border: 0; border-radius: 50%;
    padding: 0; overflow: hidden; background: #fff; box-shadow: 0 4px 16px #21142c55;
    cursor: pointer;
  }
  .launcher img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .panel {
    position: fixed; z-index: 2147483647; right: 20px; bottom: 150px;
    width: min(520px, calc(100vw - 32px)); height: min(760px, calc(100vh - 180px));
    min-height: 360px; overflow: hidden; border: 1px solid #e6deed;
    border-radius: 14px; background: #f5f2f8;
    box-shadow: 0 12px 40px #21142c45;
  }
  iframe { width: 100%; height: 100%; border: 0; background: #f5f2f8; }
  @media (max-width: 560px) {
    .launcher { right: 14px; bottom: 76px; }
    .panel { right: 8px; bottom: 136px; width: calc(100vw - 16px); height: calc(100vh - 154px); }
  }
`;

let host;
let shadow;
let panel;
let frame;
let lastContextKey = '';
let lastConversationId = '';
let resolvedContextKey = '';
let resolvedContextPhone = '';
let resolvedContextConversationId = '';
let attemptedContextLookupKey = '';
let attemptedDrawerLookupKey = '';
let contextGeneration = 0;
let resolvingContextKey = '';
let cancelContactDrawerWait = null;
let syncScheduled = false;

function getPhoneFromText(value) {
  const candidates = String(value || '').match(/\+?\d[\d\s().-]{8,}\d/g) || [];
  for (const candidate of candidates) {
    let phone = candidate.replace(/\D/g, '');
    if (phone.startsWith('55') && (phone.length === 12 || phone.length === 13)) {
      phone = phone.slice(2);
    }
    if (/^\d{10,11}$/.test(phone)) return phone;
  }
  return '';
}

function getChatHeader() {
  return document.querySelector('#main header') ||
    document.querySelector('[data-testid="conversation-header"]') ||
    null;
}

function normalizedContactText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');
}

function hasPhoneSection(element) {
  const text = normalizedContactText(element?.innerText || element?.textContent);
  return text.includes('recado e numero de telefone') ||
    text.includes('about and phone number');
}

function isVisible(element) {
  if (!element || element.hidden) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' &&
    element.getClientRects().length > 0;
}

function findContactInfoDrawer() {
  const knownDrawer = document.querySelector('[data-testid="contact-info-drawer"]');
  if (isVisible(knownDrawer)) return knownDrawer;
  return Array.from(document.querySelectorAll('[role="dialog"], aside, [data-testid*="drawer"]'))
    .find(element => isVisible(element) &&
      (hasPhoneSection(element) || getPhoneFromText(element.innerText || element.textContent))) || null;
}

function findPhoneSection(drawer) {
  return Array.from(drawer.querySelectorAll('*'))
    .filter(element => hasPhoneSection(element))
    .sort((left, right) =>
      (left.innerText || left.textContent || '').length -
      (right.innerText || right.textContent || '').length
    )[0] || drawer;
}

function getPhoneFromContactDrawer(drawer) {
  let section = findPhoneSection(drawer);
  while (section) {
    const phone = getPhoneFromText(section.innerText || section.textContent);
    if (phone) return phone;
    if (section === drawer) break;
    section = section.parentElement;
  }
  return '';
}

function findContactInfoButton() {
  return getChatHeader()?.querySelector(
    'button[data-testid="conversation-info-header-button"]'
  ) || document.querySelector(
    'button[data-testid="conversation-info-header-button"]'
  );
}

function waitForContactInfoDrawer(generation, timeout = 8000) {
  return new Promise(resolve => {
    let finished = false;
    const observer = new MutationObserver(checkForDrawer);
    const timer = setTimeout(() => finish(findContactInfoDrawer()), timeout);
    function finish(drawer) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      observer.disconnect();
      if (cancelContactDrawerWait === cancel) cancelContactDrawerWait = null;
      resolve(drawer);
    }
    function checkForDrawer() {
      if (generation !== contextGeneration) {
        finish(null);
        return;
      }
      const drawer = findContactInfoDrawer();
      if (drawer && getPhoneFromContactDrawer(drawer)) finish(drawer);
    }
    const cancel = () => finish(null);
    cancelContactDrawerWait = cancel;
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
    checkForDrawer();
  });
}

async function resolveConversationPhone(context, key, generation) {
  if (context.phone) {
    resolvedContextKey = key;
    resolvedContextConversationId = context.conversationId;
    return;
  }
  if (resolvedContextKey === key) return;
  let drawer = findContactInfoDrawer();
  if (!drawer) {
    const infoButton = findContactInfoButton();
    attemptedContextLookupKey = key;
    if (!infoButton) return;
    infoButton.click();
    drawer = await waitForContactInfoDrawer(generation);
    if (generation !== contextGeneration) return;
    if (!drawer) drawer = findContactInfoDrawer();
    if (drawer) {
      attemptedDrawerLookupKey = key;
    }
  } else {
    attemptedDrawerLookupKey = key;
  }

  if (!drawer) return;

  const phone = getPhoneFromContactDrawer(drawer);
  if (!phone || generation !== contextGeneration) return;
  resolvedContextKey = key;
  resolvedContextPhone = phone;
  resolvedContextConversationId = context.conversationId;
  setFrameContext({ phone, conversationId: context.conversationId });
}

function beginContactPhoneLookup(context, key, generation) {
  resolvingContextKey = key;
  resolveConversationPhone(context, key, generation)
    .catch(error => {
      if (generation === contextGeneration) {
        console.warn('Help Gojo não conseguiu ler o telefone do contato.', error);
      }
    })
    .finally(() => {
      if (resolvingContextKey === key) resolvingContextKey = '';
    });
}

function currentConversationContext() {
  const header = getChatHeader();
  const headerText = header?.innerText?.trim() || '';
  const phone = getPhoneFromText(headerText);
  const title = header?.querySelector(
    '[title]:not(button[data-testid="conversation-info-header-button"])'
  )?.getAttribute('title') || '';
  const contactLabel = headerText.split('\n').map(line => line.trim()).find(Boolean) || title;
  const chatId = header?.querySelector('[data-id]')?.getAttribute('data-id') ||
    header?.getAttribute('data-id') || '';
  const contextValue = [chatId, normalizedContactText(contactLabel), phone].filter(Boolean).join(':');
  if (!contextValue) return { phone: '', conversationId: '' };
  const safeId = contextValue.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
  return { phone, conversationId: `wa-${safeId}` };
}

function extensionUrl() {
  return chrome.runtime.getURL('gojo-dashboard.html');
}

function syncConversationContext() {
  if (!frame?.contentWindow) return;
  const context = currentConversationContext();
  if (!context.conversationId) return;
  setFrameContext(context);
}

function setFrameContext(context) {
  if (!frame?.contentWindow || !context.conversationId) return;
  const phone = context.phone ||
    (context.conversationId === resolvedContextConversationId ? resolvedContextPhone : '');
  frame.contentWindow.postMessage({
    type: 'help-gojo:panel:context',
    phone,
    conversationId: context.conversationId
  }, new URL(extensionUrl()).origin);
}

function openPanel() {
  syncConversationContext();
  const context = currentConversationContext();
  const phone = context.phone ||
    (context.conversationId === resolvedContextConversationId ? resolvedContextPhone : '');
  if (!frame.src) {
    const url = new URL(extensionUrl());
    if (phone) url.searchParams.set('clientPhone', phone);
    if (context.conversationId) url.searchParams.set('conversationId', context.conversationId);
    frame.src = url.toString();
  } else {
    setFrameContext({ ...context, phone });
  }
  panel.hidden = false;
  shadow.querySelector('.launcher').setAttribute('aria-expanded', 'true');
}

function closePanel() {
  panel.hidden = true;
  shadow.querySelector('.launcher').setAttribute('aria-expanded', 'false');
}

function ensurePanel() {
  if (host?.isConnected) return;
  host = document.createElement('div');
  host.id = GOJO_HOST_ID;
  shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = GOJO_STYLE;
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'launcher';
  const launcherIcon = document.createElement('img');
  launcherIcon.src = chrome.runtime.getURL('icon.png');
  launcherIcon.alt = '';
  launcher.appendChild(launcherIcon);
  launcher.title = 'Abrir Help Gojo';
  launcher.setAttribute('aria-label', 'Abrir Help Gojo');
  launcher.setAttribute('aria-expanded', 'false');
  panel = document.createElement('section');
  panel.className = 'panel';
  panel.hidden = true;
  const label = document.createElement('span');
  label.hidden = true;
  label.textContent = 'Help Gojo';
  frame = document.createElement('iframe');
  frame.title = 'Help Gojo — dados do cliente';
  frame.addEventListener('load', () => {
    const context = currentConversationContext();
    setFrameContext({
      ...context,
      phone: context.phone ||
        (context.conversationId === resolvedContextConversationId ? resolvedContextPhone : '')
    });
  });
  panel.append(label, frame);
  launcher.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  shadow.append(style, launcher, panel);
  document.documentElement.appendChild(host);
}

function scheduleContextSync() {
  if (syncScheduled) return;
  syncScheduled = true;
  requestAnimationFrame(() => {
    syncScheduled = false;
    if (!host?.isConnected) ensurePanel();
    const context = currentConversationContext();
    if (!context.conversationId) return;
    const conversationChanged = context.conversationId !== lastConversationId;
    if (conversationChanged) {
      lastConversationId = context.conversationId;
      lastContextKey = '';
      resolvedContextPhone = '';
      resolvedContextConversationId = '';
      resolvedContextKey = '';
      attemptedContextLookupKey = '';
      attemptedDrawerLookupKey = '';
      resolvingContextKey = '';
      if (cancelContactDrawerWait) cancelContactDrawerWait();
      contextGeneration += 1;
    }
    const contactDrawer = findContactInfoDrawer();
    if (!contactDrawer && !resolvingContextKey) {
      attemptedDrawerLookupKey = '';
    }
    if (!context.phone && contactDrawer) {
      const drawerPhone = getPhoneFromContactDrawer(contactDrawer);
      if (drawerPhone) {
        resolvedContextPhone = drawerPhone;
        resolvedContextConversationId = context.conversationId;
        resolvedContextKey = `${context.conversationId}:${drawerPhone}`;
      }
    }
    const currentPhone = context.phone ||
      (context.conversationId === resolvedContextConversationId ? resolvedContextPhone : '');
    const key = `${context.conversationId}:${currentPhone}`;
    if (key === lastContextKey) {
      const shouldRetry = contactDrawer
        ? attemptedDrawerLookupKey !== key
        : attemptedContextLookupKey !== key;
      if (resolvedContextKey !== key && resolvingContextKey !== key && shouldRetry) {
        beginContactPhoneLookup(context, key, contextGeneration);
      }
      return;
    }
    lastContextKey = key;
    resolvedContextKey = currentPhone ? key : '';
    resolvedContextPhone = currentPhone;
    resolvedContextConversationId = currentPhone ? context.conversationId : '';
    attemptedContextLookupKey = currentPhone ? key : '';
    attemptedDrawerLookupKey = '';
    if (!conversationChanged) contextGeneration += 1;
    const generation = contextGeneration;
    if (!conversationChanged) {
      if (cancelContactDrawerWait) cancelContactDrawerWait();
    }
    setFrameContext({ ...context, phone: currentPhone });
    if (!currentPhone) beginContactPhoneLookup(context, key, generation);
  });
}

window.addEventListener('message', event => {
  if (
    event.source !== frame?.contentWindow ||
    event.origin !== new URL(extensionUrl()).origin ||
    event.data?.type !== 'help-gojo:panel:close'
  ) {
    return;
  }
  closePanel();
});

const observer = new MutationObserver(scheduleContextSync);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['title', 'aria-label', 'data-id']
});
window.addEventListener('popstate', scheduleContextSync);
window.addEventListener('hashchange', scheduleContextSync);
ensurePanel();
scheduleContextSync();
