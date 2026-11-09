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

const NEXTFIT_SESSION_KEY = 'helpCurupacoNextfitSession';
const NEXTFIT_SUPPORT_KEY = 'helpCurupacoNextfitSupport';
const NEXTFIT_EMAIL_KEY = 'helpCurupacoNextfitAgentEmail';
const NEXTFIT_ADM_API = 'https://apiadm.nextfit.com.br/api';
const NEXTFIT_API = 'https://api.nextfit.com.br/api';
const NEXTFIT_EQUIPMENT_INCLUDES = [
  'TopData', 'IdBlock', 'ActuarSmart', 'ActuarLiteNet2', 'ActuarLiteNet3', 'Henry7X',
  'Henry8X', 'Fake', 'ProveuTupa', 'TecnibraTcaIhm', 'SerialGenerica', 'IdBlockV2',
  'EquipamentoCatraca', 'IdFace', 'FacialTopData', 'HikvisionFacial', 'IntelbrasBioT',
  'RfNextFit', 'DigitalPersonaUAreU', 'FS80H', 'HamsterDx'
];
const NEXTFIT_EQUIPMENT_CONFIG_KEYS = [
  'TopData', 'IdBlock', 'ActuarSmart', 'ActuarLiteNet2', 'ActuarLiteNet3', 'Henry7X',
  'Henry8X', 'Fake', 'ProveuTupa', 'TecnibraTcaIhm', 'SerialGenerica', 'IdBlockV2',
  'EquipamentoCatraca', 'IdFace', 'FacialTopData', 'HikvisionFacial', 'IntelbrasBioT',
  'RfNextFit', 'DigitalPersonaUAreU', 'FS80H', 'HamsterDx'
];

function isExtensionPage(sender) {
  return sender.id === chrome.runtime.id &&
    typeof sender.url === 'string' &&
    sender.url.startsWith(`chrome-extension://${chrome.runtime.id}/`);
}

function assertNextfitMessage(message, sender) {
  if (!isExtensionPage(sender)) {
    throw new Error('Esta operação só pode ser iniciada pela interface da extensão.');
  }
  if (typeof message.type !== 'string' || !message.type.startsWith('help-curupaco:nextfit:')) {
    throw new Error('Operação Next Fit inválida.');
  }
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getNextfitSession() {
  const result = await chrome.storage.session.get(NEXTFIT_SESSION_KEY);
  const session = result[NEXTFIT_SESSION_KEY];
  if (!session) return null;
  if (session.authenticatedOn !== getLocalDateKey()) {
    await chrome.storage.session.remove([NEXTFIT_SESSION_KEY, NEXTFIT_SUPPORT_KEY]);
    return null;
  }
  return session;
}

async function saveNextfitSession(session) {
  await chrome.storage.session.set({ [NEXTFIT_SESSION_KEY]: session });
}

function nextfitErrorMessage(result) {
  const candidates = [
    result?.Message,
    result?.message,
    result?.Mensagem,
    result?.mensagem,
    result?.Error,
    result?.error
  ];
  const message = candidates.find(value => typeof value === 'string' && value.trim());
  if (message) return message.trim().slice(0, 400);
  if (Array.isArray(result?.Errors)) {
    const errors = result.Errors
      .map(error => typeof error === 'string' ? error : error?.Message || error?.message)
      .filter(value => typeof value === 'string' && value.trim());
    if (errors.length) return errors.join(' ').slice(0, 400);
  }
  return '';
}

async function nextfitJson(response, message) {
  if (!response.ok) {
    const errors = {
      400: 'A Next Fit recusou os dados enviados. Confira os campos.',
      401: 'A sessão da Next Fit expirou ou não tem acesso a esta unidade.',
      403: 'A conta não tem permissão para esta operação.',
      404: 'O recurso solicitado não foi encontrado.',
      409: 'A Next Fit detectou um conflito nos dados.',
      422: 'A Next Fit não aceitou um ou mais campos.',
      429: 'Muitas solicitações. Aguarde um momento e tente novamente.'
    };
    const fallback = errors[response.status] || `${message} (HTTP ${response.status}).`;
    let detail = '';
    try {
      detail = nextfitErrorMessage(await response.clone().json());
    } catch (error) {
      if (error?.name !== 'SyntaxError') throw error;
    }
    throw new Error(detail ? `${fallback} Detalhe: ${detail}` : fallback);
  }
  try {
    return await response.json();
  } catch {
    throw new Error('A Next Fit retornou uma resposta inválida.');
  }
}

async function refreshNextfitAgentSession(session) {
  if (!session?.refreshToken) {
    throw new Error('A sessão da Next Fit expirou. Entre novamente.');
  }
  const response = await fetch(`${NEXTFIT_ADM_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken
    })
  });
  if (!response.ok) {
    await chrome.storage.session.remove([NEXTFIT_SESSION_KEY, NEXTFIT_SUPPORT_KEY]);
    throw new Error('A sessão da Next Fit expirou. Entre novamente.');
  }
  const tokens = await nextfitJson(response, 'Não foi possível renovar a sessão');
  const refreshed = {
    ...session,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || session.refreshToken,
    expiresAt: Date.now() + Number(tokens.expires_in || 0) * 1000
  };
  await saveNextfitSession(refreshed);
  return refreshed;
}

async function getAgentAccessToken() {
  let session = await getNextfitSession();
  if (!session?.accessToken) throw new Error('Conecte-se à sua conta Next Fit primeiro.');
  if (session.expiresAt && session.expiresAt <= Date.now() + 30000) {
    session = await refreshNextfitAgentSession(session);
  }
  return session.accessToken;
}

async function requestAgentApi(url, options = {}) {
  let token = await getAgentAccessToken();
  const init = {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(options.unitCode ? { 'codigo-unidade': String(options.unitCode) } : {})
    }
  };
  delete init.unitCode;
  let response = await fetch(url, init);
  if (response.status === 401) {
    const session = await refreshNextfitAgentSession(await getNextfitSession());
    token = session.accessToken;
    response = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` }
    });
  }
  return response;
}

async function requestSupportApi(url, options = {}) {
  const stored = await chrome.storage.session.get(NEXTFIT_SUPPORT_KEY);
  let support = stored[NEXTFIT_SUPPORT_KEY];
  if (!support?.unitCode) {
    throw new Error('Selecione uma base para iniciar o acesso de suporte.');
  }
  if (!support.accessToken) {
    const cadastroId = Number(support.cadastroId);
    let masterUserId = Number(support.masterUserId);
    if (!Number.isSafeInteger(cadastroId) || cadastroId <= 0) {
      throw new Error('Selecione novamente a base antes de consultar os equipamentos.');
    }
    if (!Number.isSafeInteger(masterUserId) || masterUserId <= 0) {
      const users = await getNextfitUsers(cadastroId);
      masterUserId = Number(selectSupportMaster(users)?.Id);
      if (!Number.isSafeInteger(masterUserId) || masterUserId <= 0) {
        throw new Error('Não há usuário ativo na base para iniciar o acesso de suporte.');
      }
    }
    support = await renewSupportAccess({ ...support, cadastroId, masterUserId });
  }
  const init = {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${support.accessToken}`,
      'codigo-unidade': String(support.unitCode)
    }
  };
  let response = await fetch(url, init);
  if (response.status === 401) {
    const refreshed = await renewSupportAccess(support);
    response = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${refreshed.accessToken}` }
    });
  }
  return response;
}

async function createNextfitSupportAccess(support) {
  const agentSession = await getNextfitSession();
  const description = `Acesso pela ferramenta do painel de equipamentos${agentSession?.email ? `\nRealizado por: ${agentSession.email}` : ''}`;
  const response = await requestAgentApi(`${NEXTFIT_ADM_API}/AcessoSuporte`, {
    method: 'POST',
    unitCode: support.unitCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      CodigoCadastro: support.cadastroId,
      CodigoUsuario: support.masterUserId,
      Ticket: null,
      Categoria: 3,
      Descricao: description
    })
  });
  const result = await nextfitJson(response, 'Não foi possível registrar o acesso de suporte');
  const access = apiContent(result, 'A Next Fit não confirmou o registro do acesso de suporte.');
  if (!access?.CodigoCurto) throw new Error('A Next Fit não retornou o código do acesso de suporte.');
  return access;
}

async function redeemNextfitSupportAccess(support, accessCode) {
  const response = await fetch(`${NEXTFIT_API}/token/AcessoSuporte/Resgatar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'codigo-unidade': String(support.unitCode),
      'front-version': '1.1.5'
    },
    body: JSON.stringify({ Codigo: accessCode, Plataforma: 1 })
  });
  const tokens = await nextfitJson(response, 'Não foi possível resgatar o acesso de suporte');
  if (!tokens?.access_token) throw new Error('A Next Fit não retornou o token do acesso de suporte.');
  const renewed = {
    ...support,
    accessCode,
    accessToken: tokens.access_token
  };
  await chrome.storage.session.set({ [NEXTFIT_SUPPORT_KEY]: renewed });
  return renewed;
}

async function renewSupportAccess(support) {
  const access = await createNextfitSupportAccess(support);
  return redeemNextfitSupportAccess(support, access.CodigoCurto);
}

function apiContent(result, message) {
  if (!result || result.Success === false) {
    const detail = nextfitErrorMessage(result);
    throw new Error(detail ? `${message} ${detail}` : message);
  }
  return result.Content;
}

async function searchNextfitBases(email) {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error('Informe um e-mail de cliente válido.');
  }
  const query = new URLSearchParams({
    Ativacao: 'null',
    DataCancelamentoFinal: 'null',
    DataCancelamentoInicial: 'null',
    DataInicioFinal: 'null',
    DataInicioInicial: 'null',
    DataUltimoAcessoFinal: 'null',
    DataUltimoAcessoInicial: 'null',
    EmAtencao: 'null',
    PesquisaGeral: email.trim(),
    RealizouTreinamento: 'null',
    Status: '[1,3,2,5,6]',
    Trial: 'null',
    Vip: 'null',
    page: '1',
    sort: JSON.stringify([
      { property: 'DataCriacao', direction: 'desc' },
      { property: 'Id', direction: 'desc' }
    ])
  });
  const response = await requestAgentApi(`${NEXTFIT_ADM_API}/Cadastro/ListarView?${query}`);
  const result = await nextfitJson(response, 'Não foi possível buscar os cadastros');
  const bases = apiContent(result, 'A busca de cadastros não foi concluída.');
  if (!Array.isArray(bases)) throw new Error('A Next Fit retornou uma lista de cadastros inválida.');
  return bases;
}

async function getNextfitUsers(cadastroId) {
  const query = new URLSearchParams({
    AcessoBloqueado: 'false',
    CodigoCadastro: String(cadastroId),
    Inativo: 'false',
    limit: '20',
    page: '1',
    sort: JSON.stringify([
      { property: 'Inativo', direction: 'asc' },
      { property: 'TipoPerfil', direction: 'asc' },
      { property: 'Nome', direction: 'asc' }
    ])
  });
  const response = await requestAgentApi(`${NEXTFIT_ADM_API}/Usuario/RecuperarUsuariosCadastro?${query}`);
  const result = await nextfitJson(response, 'Não foi possível consultar os usuários da base');
  const users = apiContent(result, 'Não foi possível consultar os usuários da base.');
  if (!Array.isArray(users)) throw new Error('A Next Fit retornou uma lista de usuários inválida.');
  return users;
}

function selectSupportMaster(users) {
  return users.find(user => user.TipoPerfil === 4) ||
    users.find(user => user.TipoPerfil === 1) ||
    users.find(user => user.TipoPerfil === 5) ||
    users[0] ||
    null;
}

async function startNextfitSupportSession(cadastro, conversationId) {
  const cadastroId = Number(cadastro?.Id);
  const unitCode = Number(cadastro?.CodigoUnidade);
  if (!Number.isSafeInteger(cadastroId) || cadastroId <= 0 ||
      !Number.isSafeInteger(unitCode) || unitCode <= 0) {
    throw new Error('O cadastro retornou um código inválido.');
  }

  await chrome.storage.session.remove(NEXTFIT_SUPPORT_KEY);
  const users = await getNextfitUsers(cadastroId);
  const master = selectSupportMaster(users);
  if (!master?.Id) throw new Error('Não há usuário ativo na base para registrar o acesso de suporte.');
  const support = {
    cadastroId,
    unitCode,
    masterUserId: master.Id,
    baseName: cadastro.Nome || cadastro.RazaoSocial || cadastro.NomeFantasia || `Cadastro ${cadastroId}`,
    conversationId: typeof conversationId === 'string' ? conversationId.slice(0, 120) : ''
  };
  await renewSupportAccess(support);
  const equipment = await listNextfitEquipment();
  return {
    equipment,
    users,
    base: {
      Id: cadastroId,
      CodigoUnidade: unitCode,
      Nome: support.baseName
    }
  };
}

async function selectNextfitBase(cadastro, conversationId) {
  return startNextfitSupportSession(cadastro, conversationId);
}

async function getNextfitSupportUrl() {
  const stored = await chrome.storage.session.get(NEXTFIT_SUPPORT_KEY);
  const support = stored[NEXTFIT_SUPPORT_KEY];
  if (!support?.unitCode || !support?.cadastroId || !support?.masterUserId) {
    throw new Error('Selecione uma base antes de acessar o sistema.');
  }
  const access = await createNextfitSupportAccess(support);
  const url = new URL('https://app.nextfit.com.br/acesso-suporte');
  url.searchParams.set('codigo', access.CodigoCurto);
  url.searchParams.set('codigoUnidade', String(support.unitCode));
  return url.toString();
}

async function openNextfitSupportSystem() {
  const url = await getNextfitSupportUrl();
  try {
    await chrome.windows.create({ url, incognito: true });
  } catch {
    throw new Error('Não foi possível abrir a janela anônima. Ative “Permitir no modo anônimo” nas configurações da extensão e tente novamente.');
  }
  return { opened: true };
}

async function listNextfitEquipment() {
  const stored = await chrome.storage.session.get(NEXTFIT_SUPPORT_KEY);
  const support = stored[NEXTFIT_SUPPORT_KEY];
  const unitCode = Number(support?.unitCode);
  if (!Number.isSafeInteger(unitCode) || unitCode <= 0) {
    throw new Error('Selecione uma unidade válida antes de consultar os equipamentos.');
  }

  const query = new URLSearchParams({
    filter: JSON.stringify([{ property: 'Inativo', operator: 'equal', value: false, and: true }]),
    includes: JSON.stringify(NEXTFIT_EQUIPMENT_INCLUDES),
    page: '1'
  });
  const response = await requestSupportApi(`${NEXTFIT_API}/equipamento?${query}`);
  const result = await nextfitJson(response, 'Não foi possível carregar os equipamentos');
  const equipment = apiContent(result, 'A Next Fit não retornou os equipamentos.');
  if (!Array.isArray(equipment)) throw new Error('A Next Fit retornou uma lista de equipamentos inválida.');
  return equipment;
}

async function listNextfitUsers(cadastroId) {
  const id = Number(cadastroId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Selecione uma base válida antes de consultar os usuários.');
  }
  return getNextfitUsers(id);
}

async function inactivateNextfitEquipment(message) {
  const id = Number(message.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('O equipamento selecionado não tem um código válido.');
  }
  const response = await requestSupportApi(`${NEXTFIT_API}/equipamento/Inativar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Codigo: id })
  });
  if (!response.ok) {
    await nextfitJson(response, 'Não foi possível remover o equipamento');
  }
  return { inactivated: true };
}

async function updateNextfitEquipment(message) {
  const id = Number(message.id);
  const description = typeof message.description === 'string'
    ? message.description.trim()
    : '';
  const configuration = message.configuration;
  if (!Number.isSafeInteger(id) || id <= 0 ||
      !description || description.length > 200 ||
      !configuration || typeof configuration !== 'object' ||
      Array.isArray(configuration) ||
      JSON.stringify(configuration).length > 12000) {
    throw new Error('Os dados para editar o equipamento são inválidos.');
  }
  const safeConfiguration = Object.fromEntries(
    Object.entries(configuration).filter(([key, value]) =>
      NEXTFIT_EQUIPMENT_CONFIG_KEYS.includes(key) &&
      value && typeof value === 'object' && !Array.isArray(value)
    )
  );
  if (Object.keys(safeConfiguration).length > 1) {
    throw new Error('Selecione uma configuração válida do equipamento.');
  }
  const query = new URLSearchParams({
    filter: JSON.stringify([{ property: 'Id', operator: 'equal', value: id, and: true }]),
    includes: JSON.stringify(NEXTFIT_EQUIPMENT_INCLUDES),
    page: '1'
  });
  const getResponse = await requestSupportApi(`${NEXTFIT_API}/equipamento?${query}`);
  const result = await nextfitJson(getResponse, 'Não foi possível carregar o equipamento para edição');
  const equipment = apiContent(result, 'A Next Fit não retornou o equipamento selecionado.');
  if (!Array.isArray(equipment)) throw new Error('A Next Fit retornou dados inválidos do equipamento.');
  const existing = equipment.find(item => Number(item?.Id) === id);
  if (!existing) throw new Error('O equipamento não foi encontrado nesta unidade.');

  existing.Descricao = description;
  const entries = Object.entries(safeConfiguration);
  if (entries.length) {
    const [configKey, changes] = entries[0];
    if (!existing[configKey] || typeof existing[configKey] !== 'object' ||
        Array.isArray(existing[configKey])) {
      throw new Error('A configuração enviada não corresponde ao modelo do equipamento.');
    }
    const updatedConfiguration = { ...existing[configKey] };
    for (const [key, value] of Object.entries(changes)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        throw new Error('A configuração enviada contém uma propriedade inválida.');
      }
      if (!(/senha|password|token|secret/i.test(key) && value === '********')) {
        updatedConfiguration[key] = value;
      }
    }
    existing[configKey] = updatedConfiguration;
  }
  const putResponse = await requestSupportApi(`${NEXTFIT_API}/equipamento`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(existing)
  });
  const updateResult = await nextfitJson(putResponse, 'Não foi possível atualizar o equipamento');
  if (updateResult?.Success === false) {
    throw new Error('A Next Fit não confirmou a atualização do equipamento.');
  }
  return { updated: true };
}

async function createNextfitUser(message) {
  const name = typeof message.name === 'string' ? message.name.trim() : '';
  const email = typeof message.email === 'string' ? message.email.trim() : '';
  const password = typeof message.password === 'string' ? message.password : '';
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || password.length > 32) {
    throw new Error('Confira o nome, o e-mail e a senha gerada para o usuário.');
  }
  const supportState = await chrome.storage.session.get(NEXTFIT_SUPPORT_KEY);
  const support = supportState[NEXTFIT_SUPPORT_KEY];
  if (!support?.accessToken) throw new Error('Selecione uma base antes de criar o usuário.');

  const profileQuery = new URLSearchParams({
    fields: JSON.stringify(['Id', 'Nome']),
    filter: JSON.stringify([{ property: 'Inativo', operator: 'equal', value: false, and: true }]),
    limit: '50',
    page: '1'
  });
  const profileResponse = await requestSupportApi(`${NEXTFIT_API}/PerfilAcesso?${profileQuery}`);
  const profileResult = await nextfitJson(profileResponse, 'Não foi possível consultar os perfis da unidade');
  const profiles = apiContent(profileResult, 'Não foi possível consultar os perfis da unidade.');
  const instructor = Array.isArray(profiles) && profiles.find(profile =>
    typeof profile.Nome === 'string' && profile.Nome.toLowerCase().includes('instrutor')
  );
  if (!instructor?.Id) throw new Error('Não foi encontrado o perfil Instrutor nesta unidade.');

  const dateOfBirth = new Date();
  dateOfBirth.setDate(dateOfBirth.getDate() - 1);
  const user = {
    Nome: name,
    Email: email,
    TelefoneCompleto: '(99)999999999',
    DddFone: '99',
    Fone: '999999999',
    Senha: password,
    DataNascimento: dateOfBirth.toISOString(),
    TipoCadastro: 1,
    TipoConselho: 1,
    CodigoUnidadePreferencial: String(support.unitCode),
    Unidades: [{
      CodigoUnidade: String(support.unitCode),
      CodigoPerfilAcesso: String(instructor.Id)
    }],
    Usuario: email
  };
  const response = await requestSupportApi(`${NEXTFIT_API}/usuario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  const createResult = await nextfitJson(response, 'Não foi possível criar o usuário');
  if (createResult?.Success === false) {
    throw new Error('A Next Fit não confirmou a criação do usuário. Confira os dados e tente novamente.');
  }
  return { created: true };
}

function equipmentModelsFor(type) {
  return {
    catraca: ['Fake', 'TopData', 'Actuar Smart', 'Actuar LiteNet2', 'Actuar LiteNet3', 'Henry 7x', 'Henry 8x', 'Serial Genérica', 'iD Block Enterprise', 'iD Block Modo Pro', 'Proveu Tupã', 'Tecnibra TCA IHM'],
    biometric: ['Digital Persona V2', 'Futronic', 'Hamster DX'],
    facial: ['Hikvision', 'Facial Next Fit', 'iDFace', 'TopData', 'Intelbras'],
    printer: ['Impressora']
  }[type] || [];
}

function equipmentModelMetadata(type, model) {
  const models = {
    catraca: {
      Fake: [1, 20, 'Fake'],
      TopData: [1, 1, 'TopData'],
      'Actuar Smart': [1, 3, 'ActuarSmart'],
      'Actuar LiteNet2': [1, 19, 'ActuarLiteNet2'],
      'Actuar LiteNet3': [1, 29, 'ActuarLiteNet3'],
      'Henry 7x': [1, 4, 'Henry7X'],
      'Henry 8x': [1, 8, 'Henry8X'],
      'Serial Genérica': [1, 9, 'SerialGenerica'],
      'iD Block Enterprise': [1, 2, 'IdBlock'],
      'iD Block Modo Pro': [1, 26, 'IdBlockV2'],
      'Proveu Tupã': [1, 11, 'ProveuTupa'],
      'Tecnibra TCA IHM': [1, 7, 'TecnibraTcaIhm']
    },
    biometric: {
      'Digital Persona V2': [2, 2, 'DigitalPersonaUAreU'],
      Futronic: [2, 1, 'FS80H'],
      'Hamster DX': [2, 3, 'HamsterDx']
    },
    facial: {
      Hikvision: [5, 3, 'HikvisionFacial'],
      'Facial Next Fit': [5, 1, 'RfNextFit'],
      iDFace: [5, 2, 'IdFace'],
      TopData: [5, 6, 'FacialTopData'],
      Intelbras: [5, 4, 'IntelbrasBioT']
    },
    printer: {
      Impressora: [3, 1, null]
    }
  };
  const metadata = models[type]?.[model];
  if (!metadata) throw new Error('O tipo ou modelo de equipamento não é permitido.');
  return { type: metadata[0], id: metadata[1], configKey: metadata[2] };
}

function assertEquipmentPayloadModel(payload, metadata) {
  const modelProperties = {
    1: 'ModeloCatraca',
    2: 'ModeloLeitorBiometria',
    3: 'ModeloImpressora',
    5: 'ModeloReconhecimentoFacial'
  };
  for (const [type, property] of Object.entries(modelProperties)) {
    if (payload[property] !== (Number(type) === metadata.type ? metadata.id : null)) {
      throw new Error('Os dados do equipamento não correspondem ao modelo selecionado.');
    }
  }
  if (payload.Tipo !== metadata.type ||
      (metadata.configKey && !payload[metadata.configKey]) ||
      payload.ModeloTeclado !== null) {
    throw new Error('Os dados do equipamento não correspondem ao modelo selecionado.');
  }
}

function validateEquipmentPlan(message) {
  const equipmentType = message.equipmentType;
  if (!['catraca', 'biometric', 'facial', 'printer'].includes(equipmentType) ||
      !equipmentModelsFor(equipmentType).includes(message.model)) {
    throw new Error('O tipo ou modelo de equipamento não é permitido.');
  }
  if (!Array.isArray(message.posts) || message.posts.length < 1 || message.posts.length > 2) {
    throw new Error('A sequência de gravações do equipamento é inválida.');
  }
  const types = message.posts.map(post => post?.Tipo);
  const validSequences = {
    catraca: [[1], [2, 1]],
    biometric: [[2]],
    facial: [[5], [5, 1]],
    printer: [[3], [3, 1]]
  }[equipmentType];
  if (!validSequences.some(sequence =>
    sequence.length === types.length && sequence.every((type, index) => type === types[index])
  )) {
    throw new Error('A sequência de gravações não corresponde ao equipamento selecionado.');
  }
  const requiresTwoSteps = equipmentType === 'catraca'
    ? message.model === 'Actuar Smart'
    : equipmentType === 'facial'
      ? message.model === 'iDFace' && types.length === 2
      : equipmentType === 'printer' && types.length === 2;
  if ((equipmentType === 'catraca' && types.length === 2 && !requiresTwoSteps) ||
      (equipmentType === 'facial' && types.length === 2 && !requiresTwoSteps) ||
      (equipmentType === 'printer' && types.length === 2 && !requiresTwoSteps)) {
    throw new Error('A sequência de gravações não corresponde ao modelo selecionado.');
  }
  if (JSON.stringify(message.posts).length > 16000) throw new Error('Os dados do equipamento excedem o limite permitido.');
  for (const post of message.posts) {
    if (!post || typeof post !== 'object' || Array.isArray(post) ||
        typeof post.Descricao !== 'string' || post.Descricao.length > 200 ||
        ![1, 2, 3, 5].includes(post.Tipo)) {
      throw new Error('Os dados do equipamento são inválidos.');
    }
  }
  const primaryIndex = equipmentType === 'catraca' && message.model === 'Actuar Smart' ? 1 : 0;
  assertEquipmentPayloadModel(
    message.posts[primaryIndex],
    equipmentModelMetadata(equipmentType, message.model)
  );
  if (primaryIndex === 1) {
    assertEquipmentPayloadModel(
      message.posts[0],
      equipmentModelMetadata('biometric', 'Digital Persona V2')
    );
    if (message.posts[1].ActuarSmart?.CodigoLeitorBiometricoExternoValidacao !== 'CREATED_BIOMETRIC_ID') {
      throw new Error('A sequência da catraca Actuar Smart está incompleta.');
    }
  }
  if (equipmentType === 'printer' && types.length === 2) {
    const dependency = message.posts[1];
    if (dependency.ModeloCatraca !== 20 || dependency.__afterCreatedPrinter !== true ||
        dependency.Fake?.CodigoImpressoraTreino !== 'CREATED_PRINTER_ID') {
      throw new Error('A sequência da impressora está incompleta.');
    }
  }
  if (equipmentType === 'facial' && types.length === 2) {
    const dependency = message.posts[1];
    if (dependency.ModeloCatraca !== 20 || dependency.__afterCreatedFacial !== true ||
        dependency.EquipamentoCatraca?.CodigoEquipamentoReconhecimentoFacial !== 'CREATED_FACIAL_ID') {
      throw new Error('A sequência do equipamento facial está incompleta.');
    }
  }
}

function resolveEquipmentDependency(payload, dependencyId) {
  const serialized = JSON.stringify(payload);
  if (serialized.includes('CREATED_BIOMETRIC_ID')) {
    payload.ActuarSmart.CodigoLeitorBiometricoExternoValidacao = dependencyId;
  } else if (serialized.includes('CREATED_PRINTER_ID')) {
    payload.Fake.CodigoImpressoraTreino = dependencyId;
    payload.Fake.ImpressoraTreino = {
      Descricao: payload.__printerDescription,
      Tipo: 3,
      ModeloCatraca: null,
      ModeloLeitorBiometria: null,
      ModeloImpressora: 1,
      ModeloReconhecimentoFacial: null,
      ModeloTeclado: null
    };
  } else if (serialized.includes('CREATED_FACIAL_ID')) {
    payload.EquipamentoCatraca.CodigoEquipamentoReconhecimentoFacial = dependencyId;
  }
  delete payload.__afterCreatedPrinter;
  delete payload.__printerDescription;
  delete payload.__afterCreatedFacial;
}

async function createNextfitEquipment(message) {
  validateEquipmentPlan(message);
  const payloads = message.posts.map(post => ({ ...post }));
  let priorCreatedId = null;
  for (let index = 0; index < payloads.length; index += 1) {
    const payload = payloads[index];
    if (index > 0) resolveEquipmentDependency(payload, priorCreatedId);
    const response = await requestSupportApi(`${NEXTFIT_API}/equipamento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    let result;
    try {
      if (!response.ok) {
        await nextfitJson(response, 'Não foi possível criar o equipamento');
      }
      const body = await response.text();
      if (body.trim()) {
        try {
          result = JSON.parse(body);
        } catch (error) {
          if (error?.name !== 'SyntaxError') throw error;
        }
      }
      if (result?.Success === false) {
        apiContent(result, 'A Next Fit não confirmou a criação do equipamento.');
      }
    } catch (error) {
      if (index > 0) {
        throw new Error(`A primeira gravação foi concluída, mas a etapa ${index + 1} falhou: ${error.message} Confira os equipamentos da unidade antes de tentar novamente.`);
      }
      throw error;
    }
    priorCreatedId = result?.Content?.Id || result?.Id || null;
    if (index < payloads.length - 1 &&
        (!Number.isSafeInteger(Number(priorCreatedId)) || Number(priorCreatedId) <= 0)) {
      throw new Error('A primeira gravação foi concluída, mas a Next Fit não retornou o código necessário para continuar o fluxo.');
    }
  }
  return { created: true };
}

async function handleNextfitMessage(message, sender) {
  assertNextfitMessage(message, sender);
  if (![
    'help-curupaco:nextfit:status',
    'help-curupaco:nextfit:login',
    'help-curupaco:nextfit:logout'
  ].includes(message.type)) {
    const session = await getNextfitSession();
    if (!session?.accessToken) {
      throw new Error('Conecte-se à sua conta Next Fit primeiro.');
    }
  }
  switch (message.type) {
    case 'help-curupaco:nextfit:status': {
      const session = await getNextfitSession();
      const savedEmail = await chrome.storage.local.get(NEXTFIT_EMAIL_KEY);
      const supportState = await chrome.storage.session.get(NEXTFIT_SUPPORT_KEY);
      const support = supportState[NEXTFIT_SUPPORT_KEY];
      return {
        authenticated: Boolean(session?.accessToken),
        email: savedEmail[NEXTFIT_EMAIL_KEY] || '',
        base: support?.cadastroId && support?.unitCode &&
          typeof message.conversationId === 'string' &&
          message.conversationId === support.conversationId
          ? {
            Id: support.cadastroId,
            CodigoUnidade: support.unitCode,
            Nome: support.baseName || `Cadastro ${support.cadastroId}`
          }
          : null
      };
    }
    case 'help-curupaco:nextfit:login': {
      const email = typeof message.email === 'string' ? message.email.trim() : '';
      const password = typeof message.password === 'string' ? message.password : '';
      const code = typeof message.code === 'string' ? message.code.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || !code) {
        throw new Error('Preencha e-mail, senha e código de acesso.');
      }
      const response = await fetch(`${NEXTFIT_ADM_API}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: email,
          password,
          grant_type: 'password',
          code
        })
      });
      if (!response.ok) throw new Error('Não foi possível entrar. Confira e-mail, senha e código de acesso.');
      const tokens = await nextfitJson(response, 'Não foi possível concluir o login');
      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error('A Next Fit não retornou os dados necessários para a sessão.');
      }
      await saveNextfitSession({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + Number(tokens.expires_in || 0) * 1000,
        authenticatedOn: getLocalDateKey(),
        email
      });
      return { authenticated: true };
    }
    case 'help-curupaco:nextfit:logout':
      await chrome.storage.session.remove([NEXTFIT_SESSION_KEY, NEXTFIT_SUPPORT_KEY]);
      return { loggedOut: true };
    case 'help-curupaco:nextfit:base:search':
      return searchNextfitBases(message.email);
    case 'help-curupaco:nextfit:base:select':
      return selectNextfitBase(message.cadastro, message.conversationId);
    case 'help-curupaco:nextfit:equipment:list':
      return listNextfitEquipment();
    case 'help-curupaco:nextfit:user:list':
      return listNextfitUsers(message.cadastroId);
    case 'help-curupaco:nextfit:user:create':
      return createNextfitUser(message);
    case 'help-curupaco:nextfit:equipment:create':
      return createNextfitEquipment(message);
    case 'help-curupaco:nextfit:equipment:update':
      return updateNextfitEquipment(message);
    case 'help-curupaco:nextfit:equipment:inactivate':
      return inactivateNextfitEquipment(message);
    case 'help-curupaco:nextfit:access:open':
      return openNextfitSupportSystem();
    case 'help-curupaco:nextfit:access:link':
      return { url: await getNextfitSupportUrl() };
    default:
      throw new Error('Operação Next Fit não reconhecida.');
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (typeof message?.type !== 'string' || !message.type.startsWith('help-curupaco:nextfit:')) {
    return false;
  }
  handleNextfitMessage(message, sender).then(
    data => sendResponse({ ok: true, data }),
    error => sendResponse({ ok: false, error: error.message || 'Falha ao acessar a Next Fit.' })
  );
  return true;
});
