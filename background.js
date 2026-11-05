chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'open-help-curupaco-settings') {
    chrome.runtime.openOptionsPage();
  }
});

const OBSERVATIONS_CONFIG_KEY = 'helpCurupacoSupabaseConfig';
const FRESHWORKS_DOMAIN = 'sistemanextfit.myfreshworks.com';
const OBSERVATIONS_TABLE = 'conversation_observations';

function isFreshworksSender(sender) {
  try {
    return new URL(sender.url).hostname === FRESHWORKS_DOMAIN;
  } catch {
    return false;
  }
}

function validateObservationConfig(config) {
  if (!config || typeof config.url !== 'string' || typeof config.anonKey !== 'string') {
    throw new Error('Configure a URL e a chave pública do Supabase nas opções da extensão.');
  }

  const projectUrl = new URL(config.url);
  if (
    projectUrl.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.supabase\.co$/i.test(projectUrl.hostname) ||
    projectUrl.pathname !== '/'
  ) {
    throw new Error('A URL configurada não é um projeto Supabase válido.');
  }
  const anonKey = config.anonKey.trim();
  let usesPrivilegedKey = /service_role|^sb_secret_/i.test(anonKey);
  const encodedPayload = anonKey.split('.')[1];
  if (!usesPrivilegedKey && encodedPayload) {
    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      const payload = JSON.parse(decoded);
      usesPrivilegedKey = payload.role === 'service_role';
    } catch {
      usesPrivilegedKey = false;
    }
  }
  if (!anonKey || usesPrivilegedKey) {
    throw new Error('Use somente a chave pública anon/publishable; nunca use service_role.');
  }

  return { projectUrl: projectUrl.origin, anonKey };
}

function validateConversationId(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(value)) {
    throw new Error('Não foi possível identificar a conversa atual.');
  }
  return value;
}

async function requestObservationApi(message) {
  const values = await chrome.storage.local.get(OBSERVATIONS_CONFIG_KEY);
  const { projectUrl, anonKey } = validateObservationConfig(
    values[OBSERVATIONS_CONFIG_KEY]
  );
  const conversationId = validateConversationId(message.conversationId);
  const url = new URL(`/rest/v1/${OBSERVATIONS_TABLE}`, projectUrl);
  url.searchParams.set('select', 'id,conversation_id,agent_name,observation,created_at');
  const headers = { apikey: anonKey };
  if (anonKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${anonKey}`;
  }
  let response;
  if (message.type === 'help-curupaco:observations:list') {
    url.searchParams.set('freshworks_domain', `eq.${FRESHWORKS_DOMAIN}`);
    url.searchParams.set('conversation_id', `eq.${conversationId}`);
    url.searchParams.set('order', 'created_at.asc,id.asc');
    response = await fetch(url, { headers });
  } else if (message.type === 'help-curupaco:observations:add') {
    const agentName = typeof message.agentName === 'string'
      ? message.agentName.trim().slice(0, 120)
      : '';
    const observation = typeof message.observation === 'string'
      ? message.observation.trim()
      : '';
    if (!agentName) throw new Error('Não foi possível identificar o agente no Freshworks.');
    if (!observation || observation.length > 3000) {
      throw new Error('A observação deve ter entre 1 e 3000 caracteres.');
    }

    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        freshworks_domain: FRESHWORKS_DOMAIN,
        conversation_id: conversationId,
        agent_name: agentName,
        observation
      })
    });
  } else {
    throw new Error('Operação de observações não reconhecida.');
  }

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Supabase respondeu ${response.status}: ${details || response.statusText}`);
  }
  return response.json();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    typeof message?.type !== 'string' ||
    !message.type.startsWith('help-curupaco:observations:') ||
    !isFreshworksSender(sender)
  ) {
    return false;
  }

  requestObservationApi(message).then(
    data => sendResponse({ ok: true, data }),
    error => {
      console.error('Falha ao acessar as observações da conversa:', error);
      sendResponse({ ok: false, error: error.message || 'Falha ao acessar o Supabase.' });
    }
  );
  return true;
});
