const MESSAGE_PREFIX = 'help-curupaco:nextfit:';
const AGENT_EMAIL_KEY = 'helpCurupacoNextfitAgentEmail';
const LOGIN_CREDENTIALS_KEY = 'helpCurupacoNextfitLoginCredentials';
const NEXTFIT_SESSION_KEY = 'helpCurupacoNextfitSession';
const WHATSAPP_ORIGIN = 'https://web.whatsapp.com';
const GOOGLE_CALENDAR_URL_KEY = 'helpGojoGoogleCalendarUrl';
const OBSERVATION_PRESETS = {
  Perda: '📈 EXPANSÃO CS - @expansaosemsucesso\n\nMotivo:',
  Ganha: '📈 EXPANSÃO CS - @expansaofinalizada\n\nNecessidade do cliente:\n\nTroca de plano: [Plano anterior] → [Novo plano]'
};

if (window.parent !== window) document.body.classList.add('embedded');

const statusElement = document.getElementById('status');
const loginView = document.getElementById('login-view');
const workspaceView = document.getElementById('workspace-view');
const matchesElement = document.getElementById('matches');
const phoneInput = document.getElementById('client-phone');
let customerPhone = '';
let conversationId = '';
let selectedBase = null;
let searchSequence = 0;
let selectionSequence = 0;
let indicatorsRequestSequence = 0;
let observationRequestSequence = 0;
let observationReadyCadastroId = null;
let googleCalendarUrl = '';
let agendaLoaded = false;

function showStatus(message, kind = '') {
  statusElement.textContent = message;
  statusElement.className = `status${kind ? ` ${kind}` : ''}`;
  statusElement.hidden = false;
}

function clearStatus() {
  statusElement.hidden = true;
  statusElement.textContent = '';
}

function setBusy(form, busy, busyText) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
  }
  button.disabled = busy;
}

async function send(messageType, data = {}) {
  const response = await chrome.runtime.sendMessage({
    type: `${MESSAGE_PREFIX}${messageType}`,
    ...data
  });
  if (!response?.ok) {
    const error = response?.error || 'Não foi possível concluir a operação.';
    if (/conecte-se à sua conta next fit primeiro|a sessão da next fit expirou\. entre novamente/i.test(error)) {
      await requireAuthentication(error);
    }
    throw new Error(error);
  }
  return response.data;
}

async function requireAuthentication(message = 'Sua sessão foi desconectada. Entre novamente.') {
  const emailInput = document.querySelector('#login-form [name="email"]');
  if (emailInput && !emailInput.value) {
    const saved = await chrome.storage.local.get(AGENT_EMAIL_KEY);
    emailInput.value = saved[AGENT_EMAIL_KEY] || '';
  }
  selectedBase = null;
  selectionSequence += 1;
  searchSequence += 1;
  indicatorsRequestSequence += 1;
  observationRequestSequence += 1;
  resetObservationForm();
  resetBusinessIndicators('Conecte-se novamente');
  document.getElementById('selected-view').hidden = true;
  workspaceView.hidden = true;
  loginView.hidden = false;
  showStatus(message, 'error');
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (
    areaName === 'session' &&
    changes[NEXTFIT_SESSION_KEY]?.oldValue &&
    !changes[NEXTFIT_SESSION_KEY]?.newValue
  ) {
    requireAuthentication().catch(error => showStatus(error.message, 'error'));
  }
});

function normalizedPhone(value) {
  let phone = String(value || '').replace(/\D/g, '');
  if (phone.startsWith('55') && (phone.length === 12 || phone.length === 13)) {
    phone = phone.slice(2);
  }
  return phone;
}

function apiName(item) {
  return item?.Nome || item?.RazaoSocial || item?.NomeFantasia || 'Cadastro Next Fit';
}

function yesNoUnknown(value) {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return 'Não informado';
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function pickNestedValue(source, ...paths) {
  for (const path of paths) {
    if (typeof path !== 'string' || !path.trim()) continue;
    let current = source;
    for (const segment of path.split('.')) {
      if (current === null || current === undefined || typeof current !== 'object' || !(segment in current)) {
        current = undefined;
        break;
      }
      current = current[segment];
    }
    if (current !== undefined && current !== null && current !== '') return current;
  }
  return undefined;
}

function deepFindValue(source, aliases) {
  if (!source || typeof source !== 'object') return undefined;
  const normalizedAliases = aliases.map(alias => String(alias).toLowerCase());
  const queue = [source];
  while (queue.length) {
    const current = queue.pop();
    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }
    if (!current || typeof current !== 'object') continue;
    for (const [key, value] of Object.entries(current)) {
      const keyName = String(key).toLowerCase();
      if (normalizedAliases.some(alias => keyName === alias || keyName.includes(alias))) {
        return value;
      }
      if (value && typeof value === 'object') queue.push(value);
    }
  }
  return undefined;
}

function normalizeBaseRecord(base) {
  if (!base || typeof base !== 'object') return base;
  const normalized = { ...base };
  normalized.ModalidadeDescricao = firstDefined(
    base.ModalidadeDescricao,
    pickNestedValue(base, 'Modalidade.Descricao', 'Modalidade.Nome', 'CadastroModalidade.Descricao', 'CadastroModalidade.Nome'),
    base.Modalidade,
    deepFindValue(base, ['modalidade', 'modalidadedescricao'])
  );
  normalized.ModeloOperacaoDescricao = firstDefined(
    base.ModeloOperacaoDescricao,
    pickNestedValue(base, 'ModeloOperacao.Descricao', 'ModeloOperacao.Nome', 'CadastroModeloOperacao.Descricao', 'CadastroModeloOperacao.Nome'),
    base.ModeloOperacao,
    deepFindValue(base, ['modelooperacao', 'modelooperacaodescricao'])
  );
  normalized.UtilizaMultiUnidade = firstDefined(
    base.UtilizaMultiUnidade,
    base.Tenant?.UtilizaMultiUnidade,
    base.Configuracao?.UtilizaMultiUnidade,
    pickNestedValue(base, 'Tenant.UtilizaMultiUnidade', 'Configuracao.UtilizaMultiUnidade'),
    deepFindValue(base, ['utilizamultiunidade'])
  );
  normalized.EmAtencao = firstDefined(
    base.EmAtencao,
    base.Atencao,
    deepFindValue(base, ['ematencao', 'atencao'])
  );
  normalized.StatusAtivacao = firstDefined(
    base.StatusAtivacao,
    base.Ativacao,
    base.Status?.Ativacao,
    pickNestedValue(base, 'StatusAtivacao.Descricao', 'StatusAtivacao.Nome', 'Status.Ativacao.Descricao', 'Status.Ativacao.Nome'),
    base.Status,
    deepFindValue(base, ['statusativacao'])
  );
  normalized.RealizouTreinamento = firstDefined(
    base.RealizouTreinamento,
    base.Treinamento?.RealizouTreinamento,
    base.Treinamento?.Realizado,
    pickNestedValue(base, 'Treinamento.RealizouTreinamento', 'Treinamento.Realizado'),
    deepFindValue(base, ['realizotreinamento'])
  );
  return normalized;
}

function displayApiValue(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return yesNoUnknown(value);
  if (value && typeof value === 'object') {
    const description = value.Descricao || value.Nome || value.DescricaoStatus;
    if (typeof description === 'string') return description;
    return JSON.stringify(value);
  }
  return 'Não informado';
}

function formatBaseTenure(value) {
  if (!value) return 'Não informado';
  let start;
  if (typeof value === 'string') {
    const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const brazilianDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (isoDate) {
      start = new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
    } else if (brazilianDate) {
      start = new Date(Number(brazilianDate[3]), Number(brazilianDate[2]) - 1, Number(brazilianDate[1]));
    } else {
      start = new Date(value);
    }
  } else {
    start = new Date(value);
  }
  if (Number.isNaN(start.getTime())) return 'Não informado';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  if (start > today) return 'Data futura';
  let months = (today.getFullYear() - start.getFullYear()) * 12 +
    today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years) return `${years} ano${years === 1 ? '' : 's'}${remainingMonths ? ` e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}` : ''}`;
  if (remainingMonths) return `${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
  const days = Math.max(0, Math.floor((today - start) / 86400000));
  return `${days} ${days === 1 ? 'dia' : 'dias'}`;
}

function parseApiNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const number = Number(value.trim().replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

function collectIndicatorFields(value, prefix = '', fields = [], depth = 0) {
  if (depth > 4 || value === null || value === undefined) return fields;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectIndicatorFields(item, `${prefix} ${index + 1}`.trim(), fields, depth + 1));
  } else if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      collectIndicatorFields(nestedValue, prefix ? `${prefix} ${key}` : key, fields, depth + 1);
    }
  } else if (value !== '') {
    fields.push({ label: prefix, value });
  }
  return fields;
}

function formatIndicatorNumber(value, maximumFractionDigits = 2) {
  const number = parseApiNumber(value);
  return number === null
    ? String(value ?? 'Não informado')
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(number);
}

function formatLifetimeMonths(value) {
  const totalMonths = parseApiNumber(value);
  if (totalMonths === null || totalMonths < 0) return String(value ?? 'Não informado');
  const months = Math.floor(totalMonths);
  const days = Math.floor((totalMonths - months) * 30);
  const monthText = `${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (!days) return monthText;
  return `${monthText} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

function formatBusinessIndicator(key, result, periodStart) {
  if (!result || result.error) {
    return { value: 'Não disponível', detail: result?.error || 'A API não retornou este indicador.' };
  }
  if (result.data === null || result.data === undefined) {
    return { value: 'Sem dados retornados', detail: 'A resposta da API não contém um valor.' };
  }

  if (key === 'ticket' && Array.isArray(result.data.Dados)) {
    const targetDate = periodStart ? new Date(periodStart) : null;
    const targetMonth = targetDate && !Number.isNaN(targetDate.getTime())
      ? `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}`
      : null;
    const ticketData = result.data.Dados.find(item => {
      if (Number(item?.TipoVisualizacao) !== 1 || !item?.Competencia) return false;
      const competenceDate = new Date(item.Competencia);
      if (Number.isNaN(competenceDate.getTime())) return false;
      const competenceMonth =
        `${competenceDate.getUTCFullYear()}-${String(competenceDate.getUTCMonth() + 1).padStart(2, '0')}`;
      return !targetMonth || competenceMonth === targetMonth;
    });
    const amount = parseApiNumber(ticketData?.Valor ?? ticketData?.ValorTotal);
    if (amount === null) {
      return {
        value: 'Sem dados retornados',
        detail: `A API não retornou o ticket médio para ${targetMonth || 'a competência solicitada'}.`
      };
    }
    return {
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount),
      detail: ''
    };
  }

  const fields = collectIndicatorFields(result.data);
  if (!fields.length) {
    return { value: 'Sem dados retornados', detail: 'A resposta da API não contém um valor.' };
  }
  const labelKey = label => label.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const findField = pattern => fields.find(field => pattern.test(labelKey(field.label)));

  if (key === 'lifetime') {
    const months = findField(/mes|month/);
    const days = findField(/dia|day/);
    if (months && days) {
      const monthCount = parseApiNumber(months.value);
      const dayCount = parseApiNumber(days.value);
      const monthText = monthCount === null
        ? String(months.value)
        : `${Math.floor(monthCount)} ${Math.floor(monthCount) === 1 ? 'mês' : 'meses'}`;
      const integerDays = dayCount === null ? null : Math.floor(dayCount);
      const dayText = dayCount === null
        ? String(days.value)
        : `${integerDays} ${integerDays === 1 ? 'dia' : 'dias'}`;
      return { value: [monthText, dayText].filter(Boolean).join(' e '), detail: '' };
    }
    if (months) return { value: formatLifetimeMonths(months.value), detail: '' };
    if (days) {
      const dayCount = parseApiNumber(days.value);
      const integerDays = dayCount === null ? null : Math.floor(dayCount);
      return {
        value: dayCount === null
          ? String(days.value)
          : `${integerDays} ${integerDays === 1 ? 'dia' : 'dias'}`,
        detail: ''
      };
    }
  }

  const matchers = {
    ticket: [/ticket/, /media/, /valor/],
    atRisk: [/qtde|quantidade|total/, /risco|cliente/],
    churn: [/evasao|churn/, /percentual|taxa/, /valor/],
    lifetime: [/tempo|vida|lifetime/, /valor/]
  };
  const match = matchers[key].map(findField).find(Boolean);
  const selected = match || (fields.length === 1 ? fields[0] : null);
  if (!selected) {
    return {
      value: 'Dados recebidos',
      detail: fields.map(field =>
        `${indicatorFieldLabel(field.label)}: ${String(field.value)}`
      ).join(' · ')
    };
  }

  const number = parseApiNumber(selected.value);
  if (key === 'ticket' && number !== null) {
    return {
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number),
      detail: ''
    };
  }
  if (key === 'churn' && number !== null) {
    return { value: `${formatIndicatorNumber(number)}%`, detail: '' };
  }
  if (key === 'lifetime' && number !== null) {
    return { value: formatLifetimeMonths(number), detail: '' };
  }
  return {
    value: key === 'atRisk' && number !== null
      ? formatIndicatorNumber(number, 0)
      : String(selected.value),
    detail: selected === fields[0] && fields.length > 1
      ? fields.slice(1).map(field =>
        `${indicatorFieldLabel(field.label)}: ${String(field.value)}`
      ).join(' · ')
      : ''
  };
}

function fitForActiveCount(activeCount) {
  if (!Number.isFinite(activeCount) || activeCount < 0 || activeCount > 999999999) {
    return 'Não informado';
  }
  if (activeCount <= 50) return 'Fit 1';
  if (activeCount <= 200) return 'Fit 2';
  if (activeCount <= 300) return 'Fit 3';
  if (activeCount <= 500) return 'Fit 4';
  if (activeCount <= 800) return 'Fit 5';
  return 'Fit 6';
}

function priceForActiveCount(activeCount, priceTable) {
  if (!Number.isFinite(activeCount) || activeCount < 0 || activeCount > 999999999) {
    return null;
  }
  const count = Math.ceil(activeCount);
  const row = priceTable.find(item => count >= item.Inicio && count <= item.Fim);
  return row && Number.isFinite(row.Valor) ? row.Valor : null;
}

function formatInvoiceMonth(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return 'Mês não informado';
  const dateParts = typeof value === 'string'
    ? value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    : null;
  const monthYear = typeof value === 'string'
    ? value.trim().match(/^(\d{1,2})\/(\d{4})$/)
    : null;
  const date = dateParts
    ? new Date(Date.UTC(Number(dateParts[3]), Number(dateParts[2]) - 1, Number(dateParts[1])))
    : monthYear
      ? new Date(Date.UTC(Number(monthYear[2]), Number(monthYear[1]) - 1, 1))
      : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function latestInvoices(invoices) {
  const datedInvoices = invoices.map((invoice, index) => {
    const value = invoice.MesAno;
    const dateParts = typeof value === 'string'
      ? value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      : null;
    const monthYear = typeof value === 'string'
      ? value.trim().match(/^(\d{1,2})\/(\d{4})$/)
      : null;
    let timestamp = Number.NaN;
    if (value !== null && value !== undefined && value !== '') {
      if (dateParts) {
        timestamp = Date.UTC(Number(dateParts[3]), Number(dateParts[2]) - 1, Number(dateParts[1]));
      } else if (monthYear) {
        timestamp = Date.UTC(Number(monthYear[2]), Number(monthYear[1]) - 1, 1);
      } else {
        timestamp = new Date(value).getTime();
      }
    }
    return { invoice, index, timestamp };
  });
  if (datedInvoices.every(item => Number.isFinite(item.timestamp))) {
    datedInvoices.sort((first, second) =>
      second.timestamp - first.timestamp || first.index - second.index
    );
  }
  return datedInvoices.slice(0, 3).map(item => item.invoice);
}

function renderInvoices(invoices, errorMessage = '') {
  const list = document.getElementById('invoice-list');
  const invoiceStatus = document.getElementById('invoice-status');
  list.replaceChildren();
  invoiceStatus.textContent = errorMessage
    ? `Não foi possível carregar as faturas: ${errorMessage}`
    : '';
  invoiceStatus.className = `status${errorMessage ? ' error' : ''}`;
  invoiceStatus.hidden = !errorMessage;
  if (!invoices.length && !errorMessage) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhuma mensalidade encontrada.';
    list.appendChild(empty);
    return;
  }
  if (!invoices.length) return;

  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const countFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  for (const invoice of latestInvoices(invoices)) {
    const row = document.createElement('div');
    row.className = 'invoice-item';
    const period = document.createElement('strong');
    period.className = 'invoice-period';
    period.textContent = formatInvoiceMonth(invoice.MesAno);
    row.appendChild(period);

    const activeCount = parseApiNumber(invoice.MediaClientes);
    const total = parseApiNumber(invoice.ValorTotal);
    const metrics = [
      ['Valor da fatura', total === null ? 'Não informado' : money.format(total)],
      ['Média de ativos', activeCount === null ? 'Não informado' : countFormat.format(activeCount)]
    ];
    const products = parseApiNumber(invoice.ValorProdutosAdicionais);
    if (products !== null) metrics.push(['Produtos adicionais', money.format(products)]);
    for (const [label, value] of metrics) {
      const metric = document.createElement('span');
      metric.className = 'invoice-metric';
      const metricValue = document.createElement('strong');
      metricValue.textContent = value;
      const metricLabel = document.createElement('small');
      metricLabel.textContent = label;
      metric.append(metricValue, metricLabel);
      row.appendChild(metric);
    }
    list.appendChild(row);
  }
}

function renderCustomerMetrics(base) {
  const normalizedBase = normalizeBaseRecord(base);
  const container = document.getElementById('customer-metrics');
  const latestInvoice = latestInvoices(normalizedBase.FaturasRecentes || [])[0] || null;
  const activeCount = latestInvoice
    ? parseApiNumber(latestInvoice.MediaClientes)
    : parseApiNumber(normalizedBase.QtdeClientesAtivos);
  const addons = parseApiNumber(firstDefined(
    latestInvoice?.ValorProdutosAdicionais,
    normalizedBase.ValorProdutosAdicionais
  ));
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const countFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  const fit = fitForActiveCount(activeCount);
  const monthlyFee = priceForActiveCount(activeCount, normalizedBase.TabelaPrecoFit || []);
  const metrics = [
    ['Mensalidade', monthlyFee === null ? 'Indisponível' : money.format(monthlyFee)],
    ['FIT', fit || 'Não informado'],
    ['Modelo de operação', normalizedBase.ModeloOperacaoDescricao || 'Não informado'],
    ['Possui add-on?', addons === null
      ? 'Não informado'
      : addons > 0 ? `Sim · ${money.format(addons)}` : 'Não'],
    ['Em risco', yesNoUnknown(normalizedBase.EmAtencao)],
    [latestInvoice ? 'Média de ativos' : 'Clientes ativos',
      activeCount === null ? 'Não informado' : countFormat.format(activeCount)],
    ['Tempo de base', formatBaseTenure(normalizedBase.DataCriacao)],
    ['Multiunidade', yesNoUnknown(normalizedBase.UtilizaMultiUnidade)],
    ['Ativação', displayApiValue(normalizedBase.StatusAtivacao)],
    ['Realizou treinamento', yesNoUnknown(normalizedBase.RealizouTreinamento)]
  ];
  container.replaceChildren();
  for (const [label, value] of metrics) {
    const item = document.createElement('div');
    item.className = 'customer-metric';
    const metricLabel = document.createElement('span');
    metricLabel.className = 'customer-metric-label';
    metricLabel.textContent = label;
    const metricValue = document.createElement('strong');
    metricValue.className = 'customer-metric-value';
    metricValue.textContent = value;
    item.append(metricLabel, metricValue);
    container.appendChild(item);
  }
  const priceStatus = document.getElementById('price-status');
  priceStatus.textContent = normalizedBase.TabelaPrecoErro
    ? `Não foi possível consultar a tabela de preços: ${normalizedBase.TabelaPrecoErro}`
    : activeCount === null
      ? 'Não foi possível determinar o Fit sem a contagem de alunos ativos.'
      : monthlyFee === null
        ? 'A tabela atual não retornou preço para a faixa de alunos ativos deste cadastro.'
        : '';
  priceStatus.hidden = !priceStatus.textContent;
  document.getElementById('summary-period').textContent = latestInvoice
    ? `Referência: ${formatInvoiceMonth(latestInvoice.MesAno)}`
    : normalizedBase.FaturasErro
      ? `Não foi possível consultar faturas: ${normalizedBase.FaturasErro}`
      : activeCount !== null
        ? 'Exibindo os dados atuais do cadastro; histórico de faturas indisponível.'
        : 'Sem faturas para exibir uma referência mensal.';
}

function indicatorFieldLabel(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, character => character.toLocaleUpperCase('pt-BR'));
}

function resetBusinessIndicators(value = 'Carregando…') {
  for (const key of ['ticket', 'atRisk', 'churn', 'lifetime']) {
    document.getElementById(`indicator-${key === 'atRisk' ? 'at-risk' : key}`).textContent = value;
    const detail = document.getElementById(`indicator-${key === 'atRisk' ? 'at-risk' : key}-detail`);
    if (detail) detail.textContent = '';
  }
  const status = document.getElementById('indicators-status');
  status.className = 'status';
  status.textContent = '';
  status.hidden = true;
}

function renderBusinessIndicators(result) {
  const names = {
    ticket: 'Ticket médio',
    atRisk: 'Clientes em risco',
    churn: 'Churn',
    lifetime: 'Lifetime (LT)'
  };
  let hasErrors = false;
  for (const key of Object.keys(names)) {
    const indicator = formatBusinessIndicator(key, result.indicators?.[key], result.periodStart);
    const elementKey = key === 'atRisk' ? 'at-risk' : key;
    document.getElementById(`indicator-${elementKey}`).textContent = indicator.value;
    const detail = document.getElementById(`indicator-${elementKey}-detail`);
    if (detail) detail.textContent = indicator.detail;
    if (result.indicators?.[key]?.error) hasErrors = true;
  }
  document.getElementById('indicators-period').textContent =
    `Referência: ${result.period || 'mês anterior'}`;
  const status = document.getElementById('indicators-status');
  status.className = `status${hasErrors ? ' error' : ''}`;
  status.textContent = hasErrors
    ? 'Um ou mais indicadores não puderam ser carregados. Consulte o detalhe em cada indicador.'
    : '';
  status.hidden = !hasErrors;
}

async function loadBusinessIndicators() {
  const requestId = ++indicatorsRequestSequence;
  const cadastroId = selectedBase?.Id;
  if (!cadastroId) return;
  resetBusinessIndicators();
  const status = document.getElementById('indicators-status');
  status.textContent = 'Carregando indicadores…';
  status.hidden = false;
  try {
    const result = await send('business-indicators:list', { cadastroId });
    if (requestId !== indicatorsRequestSequence || Number(selectedBase?.Id) !== Number(cadastroId)) return;
    renderBusinessIndicators(result);
  } catch (error) {
    if (requestId !== indicatorsRequestSequence) return;
    for (const key of ['ticket', 'at-risk', 'churn', 'lifetime']) {
      document.getElementById(`indicator-${key}`).textContent = 'Não disponível';
      const detail = document.getElementById(`indicator-${key}-detail`);
      if (detail) detail.textContent = error.message;
    }
    status.className = 'status error';
    status.textContent = 'Não foi possível carregar os indicadores.';
    status.hidden = false;
  }
}

function updateSelectedBase(base) {
  const normalizedBase = normalizeBaseRecord(base);
  document.getElementById('selected-name').textContent = apiName(normalizedBase);
  document.getElementById('selected-meta').textContent =
    `Cadastro ${normalizedBase.Id} · Unidade ${normalizedBase.CodigoUnidade}`;
  renderCustomerMetrics(normalizedBase);
  renderInvoices(normalizedBase.FaturasRecentes || [], normalizedBase.FaturasErro || '');
  document.getElementById('selected-view').hidden = false;
}

function resetObservationForm() {
  observationRequestSequence += 1;
  observationReadyCadastroId = null;
  const prepareButton = document.getElementById('prepare-observation');
  prepareButton.disabled = false;
  prepareButton.textContent = 'Criar observação';
  document.getElementById('observation-form').hidden = true;
  document.getElementById('observation-form').reset();
  document.getElementById('observation-text').value = OBSERVATION_PRESETS.Perda;
  document.getElementById('observation-type').replaceChildren(
    new Option('Carregando…', '')
  );
  document.getElementById('observation-type').disabled = true;
  const status = document.getElementById('observation-status');
  status.hidden = true;
  status.textContent = '';
}

function renderMatches(bases) {
  matchesElement.replaceChildren();
  if (!bases.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhum cadastro encontrado para esse telefone.';
    matchesElement.appendChild(empty);
    return;
  }
  for (const base of bases) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'match-button';
    const title = document.createElement('span');
    title.textContent = apiName(base);
    const details = document.createElement('small');
    details.textContent = `Cadastro ${base.Id ?? ''} · Unidade ${base.CodigoUnidade ?? ''} · ${base.Email || ''}`;
    button.append(title, details);
    button.addEventListener('click', () => selectBase(base));
    matchesElement.appendChild(button);
  }
}

async function selectBase(base) {
  const requestId = ++selectionSequence;
  indicatorsRequestSequence += 1;
  resetObservationForm();
  resetBusinessIndicators();
  document.getElementById('indicators-period').textContent = 'Indicadores do mês anterior';
  clearStatus();
  selectedBase = base;
  document.getElementById('selected-view').hidden = false;
  document.getElementById('selected-name').textContent = apiName(base);
  document.getElementById('selected-meta').textContent =
    `Cadastro ${base.Id} · Unidade ${base.CodigoUnidade}`;
  renderInvoices([]);
  showStatus('Carregando dados financeiros do cadastro…');
  try {
    const data = await send('dashboard:base:select', { cadastro: base, conversationId });
    if (requestId !== selectionSequence) return;
    selectedBase = data.base;
    updateSelectedBase(selectedBase);
    loadBusinessIndicators();
    showStatus('Dados do cliente atualizados.', 'success');
  } catch (error) {
    if (requestId === selectionSequence) {
      showStatus(error.message, 'error');
      resetBusinessIndicators('Não disponível');
      for (const key of ['ticket', 'at-risk', 'churn', 'lifetime']) {
        const detail = document.getElementById(`indicator-${key}-detail`);
        if (detail) detail.textContent = error.message;
      }
    }
  }
}

async function searchBasesByPhone(value, { automatic = false } = {}) {
  const phone = normalizedPhone(value);
  const requestId = ++searchSequence;
  matchesElement.replaceChildren();
  if (!/^\d{10,13}$/.test(phone)) {
    if (automatic) {
      showStatus('Não consegui identificar o telefone na conversa. Informe o telefone com DDD para pesquisar.');
      return;
    }
    throw new Error('Informe o telefone com DDD, somente números (ex.: 31989823532).');
  }
  phoneInput.value = phone;
  const form = document.getElementById('search-form');
  setBusy(form, true, 'Buscando…');
  if (automatic) showStatus(`Pesquisando o telefone ${phone}…`);
  try {
    const bases = await send('base:search', { phone });
    if (requestId !== searchSequence) return;
    renderMatches(bases);
    if (bases.length === 1) {
      await selectBase(bases[0]);
      return;
    }
    showStatus(
      bases.length
        ? `${bases.length} cadastros encontrados. Selecione a unidade correta.`
        : 'Nenhum cadastro encontrado para esse telefone.',
      bases.length ? 'success' : ''
    );
  } catch (error) {
    if (requestId === searchSequence) showStatus(error.message, 'error');
  } finally {
    if (requestId === searchSequence) setBusy(form, false);
  }
}

function resetCustomerContext(phone, id) {
  customerPhone = normalizedPhone(phone);
  conversationId = typeof id === 'string' ? id.slice(0, 120) : '';
  selectionSequence += 1;
  searchSequence += 1;
  indicatorsRequestSequence += 1;
  resetObservationForm();
  selectedBase = null;
  setBusy(document.getElementById('search-form'), false);
  document.getElementById('selected-view').hidden = true;
  matchesElement.replaceChildren();
  phoneInput.value = customerPhone;
  if (customerPhone && !workspaceView.hidden) {
    searchBasesByPhone(customerPhone, { automatic: true });
  } else if (!workspaceView.hidden) {
    showStatus('Selecione uma conversa com um telefone visível ou informe o número do cliente.');
  }
}

function getGoogleCalendarId(value) {
  let sharedUrl;
  try {
    sharedUrl = new URL(String(value || '').trim());
  } catch {
    throw new Error('Cole um link válido do Google Calendar.');
  }
  if (
    sharedUrl.protocol !== 'https:' ||
    sharedUrl.hostname !== 'calendar.google.com' ||
    sharedUrl.username ||
    sharedUrl.password
  ) {
    throw new Error('O link precisa ser do domínio https://calendar.google.com/.');
  }

  let calendarId = sharedUrl.searchParams.get('src');
  const encodedCalendarId = sharedUrl.searchParams.get('cid');
  if (!calendarId && encodedCalendarId) {
    const normalizedCalendarId = encodedCalendarId.replace(/-/g, '+').replace(/_/g, '/');
    const paddedCalendarId = normalizedCalendarId.padEnd(Math.ceil(normalizedCalendarId.length / 4) * 4, '=');
    try {
      calendarId = atob(paddedCalendarId);
    } catch {
      throw new Error('O identificador do link está inválido. Copie novamente o link compartilhado da agenda.');
    }
  }
  if (!calendarId || /[\u0000-\u001f]/.test(calendarId)) {
    throw new Error('O link precisa conter um identificador de agenda em “cid=” ou “src=”.');
  }
  return calendarId;
}

function showAgendaStatus(message, kind = 'error') {
  const status = document.getElementById('agenda-status');
  status.textContent = message;
  status.className = `status ${kind}`;
  status.hidden = !message;
}

function showCalendarSetup(inputValue = googleCalendarUrl) {
  const form = document.getElementById('calendar-link-form');
  const linkInput = document.getElementById('calendar-link');
  form.hidden = false;
  linkInput.value = inputValue;
  document.getElementById('save-calendar-link').textContent = googleCalendarUrl
    ? 'Salvar nova agenda'
    : 'Conectar agenda';
  document.getElementById('cancel-calendar-change').hidden = !googleCalendarUrl;
  document.getElementById('change-google-calendar').hidden = true;
  document.getElementById('disconnect-google-calendar').hidden = true;
  document.getElementById('open-google-calendar').hidden = true;
  document.getElementById('google-calendar').hidden = true;
  document.getElementById('agenda-description').textContent = googleCalendarUrl
    ? 'Cole o link da agenda que deseja usar.'
    : 'Cole o link compartilhado para conectar sua agenda pela primeira vez.';
}

function showCalendarConnected() {
  document.getElementById('calendar-link-form').hidden = true;
  document.getElementById('cancel-calendar-change').hidden = true;
  document.getElementById('change-google-calendar').hidden = false;
  document.getElementById('disconnect-google-calendar').hidden = false;
  const openLink = document.getElementById('open-google-calendar');
  openLink.href = googleCalendarUrl;
  openLink.hidden = false;
  document.getElementById('google-calendar').hidden = !agendaLoaded;
  document.getElementById('agenda-description').textContent =
    'Agenda conectada. Se não carregar ou pedir acesso, abra-a diretamente no Google Calendar.';
}

function loadGoogleCalendar() {
  const calendarId = getGoogleCalendarId(googleCalendarUrl);
  const embedUrl = new URL('https://calendar.google.com/calendar/embed');
  embedUrl.searchParams.set('src', calendarId);
  embedUrl.searchParams.set('mode', 'DAY');
  embedUrl.searchParams.set('ctz', 'America/Sao_Paulo');
  embedUrl.searchParams.set('showTitle', '0');
  embedUrl.searchParams.set('showNav', '1');
  embedUrl.searchParams.set('showDate', '1');
  embedUrl.searchParams.set('showTabs', '0');
  embedUrl.searchParams.set('showPrint', '0');
  embedUrl.searchParams.set('showCalendars', '0');
  embedUrl.searchParams.set('showTz', '0');

  const iframe = document.getElementById('google-calendar');
  iframe.src = embedUrl.toString();
  iframe.hidden = false;
  agendaLoaded = true;
}

function selectPanelTab(showAgenda) {
  const customerTab = document.getElementById('customer-tab');
  const agendaTab = document.getElementById('agenda-tab');
  const customerPanel = document.getElementById('customer-panel');
  const agendaPanel = document.getElementById('agenda-panel');

  customerTab.setAttribute('aria-selected', String(!showAgenda));
  customerTab.tabIndex = showAgenda ? -1 : 0;
  agendaTab.setAttribute('aria-selected', String(showAgenda));
  agendaTab.tabIndex = showAgenda ? 0 : -1;
  customerPanel.hidden = showAgenda;
  agendaPanel.hidden = !showAgenda;
  document.getElementById('panel-title').textContent = showAgenda ? 'Agenda' : 'Visão do cliente';

  if (showAgenda && googleCalendarUrl && !agendaLoaded) {
    try {
      loadGoogleCalendar();
    } catch (error) {
      showAgendaStatus(`Não foi possível preparar a agenda: ${error.message}`);
    }
  }
}

for (const tab of document.querySelectorAll('.view-tab')) {
  tab.addEventListener('click', () => selectPanelTab(tab.id === 'agenda-tab'));
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextTab = tab.id === 'agenda-tab'
      ? document.getElementById('customer-tab')
      : document.getElementById('agenda-tab');
    nextTab.focus();
    nextTab.click();
  });
}

document.getElementById('calendar-link-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const link = document.getElementById('calendar-link').value.trim();
  setBusy(form, true, 'Conectando…');
  try {
    getGoogleCalendarId(link);
    await chrome.storage.local.set({ [GOOGLE_CALENDAR_URL_KEY]: link });
    googleCalendarUrl = link;
    agendaLoaded = false;
    document.getElementById('google-calendar').removeAttribute('src');
    showCalendarConnected();
    loadGoogleCalendar();
    showAgendaStatus('Agenda conectada.', 'success');
  } catch (error) {
    showAgendaStatus(error.message);
  } finally {
    setBusy(form, false);
  }
});

document.getElementById('change-google-calendar').addEventListener('click', () => {
  showCalendarSetup();
  showAgendaStatus('');
  document.getElementById('calendar-link').focus();
});

document.getElementById('cancel-calendar-change').addEventListener('click', () => {
  if (!googleCalendarUrl) {
    showCalendarSetup();
    showAgendaStatus('');
    return;
  }
  showCalendarConnected();
  if (!agendaLoaded) {
    try {
      loadGoogleCalendar();
      showAgendaStatus('');
    } catch (error) {
      showAgendaStatus(`Não foi possível preparar a agenda: ${error.message}`);
    }
  }
});

document.getElementById('disconnect-google-calendar').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await chrome.storage.local.remove(GOOGLE_CALENDAR_URL_KEY);
    googleCalendarUrl = '';
    agendaLoaded = false;
    document.getElementById('google-calendar').removeAttribute('src');
    showCalendarSetup();
    showAgendaStatus('Agenda desconectada. Cole outro link para conectar uma agenda.', 'success');
  } catch (error) {
    showAgendaStatus(error.message);
  } finally {
    button.disabled = false;
  }
});

document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  clearStatus();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password'));
  const code = String(formData.get('code'));
  setBusy(form, true, 'Conectando…');
  try {
    const permitted = await chrome.permissions.request({
      origins: ['https://apiadm.nextfit.com.br/*', 'https://api.nextfit.com.br/*']
    });
    if (!permitted) throw new Error('A permissão para conectar à Next Fit não foi concedida.');
    await send('login', { email, password, code });
    await chrome.storage.local.set({
      [AGENT_EMAIL_KEY]: email,
      [LOGIN_CREDENTIALS_KEY]: { email, password, code }
    });
    form.reset();
    loginView.hidden = true;
    workspaceView.hidden = false;
    if (customerPhone) {
      await searchBasesByPhone(customerPhone, { automatic: true });
    } else {
      showStatus('Conectado. Selecione uma conversa ou informe o telefone do cliente.');
    }
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    setBusy(form, false);
  }
});

document.getElementById('search-form').addEventListener('submit', event => {
  event.preventDefault();
  clearStatus();
  searchBasesByPhone(phoneInput.value).catch(error => showStatus(error.message, 'error'));
});

phoneInput.addEventListener('input', () => {
  const digits = normalizedPhone(phoneInput.value);
  if (digits !== phoneInput.value) phoneInput.value = digits;
});

document.getElementById('change-client').addEventListener('click', () => {
  selectionSequence += 1;
  indicatorsRequestSequence += 1;
  resetObservationForm();
  selectedBase = null;
  document.getElementById('selected-view').hidden = true;
  clearStatus();
});

document.getElementById('reload-indicators').addEventListener('click', () => {
  loadBusinessIndicators();
});

document.getElementById('prepare-observation').addEventListener('click', async event => {
  const button = event.currentTarget;
  const cadastroId = selectedBase?.Id;
  if (!cadastroId) {
    showStatus('Selecione um cadastro antes de criar uma observação.', 'error');
    return;
  }
  const requestId = ++observationRequestSequence;
  const status = document.getElementById('observation-status');
  button.disabled = true;
  button.textContent = 'Carregando…';
  status.className = 'status';
  status.textContent = 'Carregando o tipo de observação…';
  status.hidden = false;
  try {
    const result = await send('observation:form', { cadastroId });
    if (requestId !== observationRequestSequence || Number(selectedBase?.Id) !== Number(cadastroId)) return;
    const typeSelect = document.getElementById('observation-type');
    typeSelect.replaceChildren(...result.types.map(type => new Option(type, type)));
    typeSelect.value = result.types[0];
    document.getElementById('observation-text').value = OBSERVATION_PRESETS[typeSelect.value];
    typeSelect.disabled = false;
    observationReadyCadastroId = Number(cadastroId);
    document.getElementById('observation-form').hidden = false;
    status.hidden = true;
    status.textContent = '';
  } catch (error) {
    if (requestId !== observationRequestSequence) return;
    status.className = 'status error';
    status.textContent = error.message;
    status.hidden = false;
  } finally {
    if (requestId === observationRequestSequence) {
      button.disabled = false;
      button.textContent = 'Criar observação';
    }
  }
});

document.getElementById('observation-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const cadastroId = selectedBase?.Id;
  if (!cadastroId || observationReadyCadastroId !== Number(cadastroId)) {
    const status = document.getElementById('observation-status');
    status.className = 'status error';
    status.textContent = 'Carregue novamente o tipo da observação para o cadastro selecionado.';
    status.hidden = false;
    return;
  }
  const requestId = observationRequestSequence;
  const submitButton = form.querySelector('button[type="submit"]');
  const status = document.getElementById('observation-status');
  setBusy(form, true, 'Registrando…');
  status.hidden = true;
  try {
    await send('observation:create', {
      cadastroId,
      observation: document.getElementById('observation-text').value,
      observationType: document.getElementById('observation-type').value
    });
    if (requestId !== observationRequestSequence || Number(selectedBase?.Id) !== Number(cadastroId)) return;
    resetObservationForm();
    status.className = 'status success';
    status.textContent = 'Observação registrada no cadastro da Next Fit.';
    status.hidden = false;
  } catch (error) {
    if (requestId !== observationRequestSequence) return;
    status.className = 'status error';
    status.textContent = error.message;
    status.hidden = false;
  } finally {
    setBusy(form, false);
    submitButton.disabled = false;
  }
});

document.getElementById('observation-type').addEventListener('change', event => {
  const preset = OBSERVATION_PRESETS[event.currentTarget.value];
  if (preset !== undefined) document.getElementById('observation-text').value = preset;
});

document.getElementById('access-system').addEventListener('click', async event => {
  const button = event.currentTarget;
  if (!selectedBase?.Id) {
    showStatus('Selecione um cadastro antes de acessar o sistema.', 'error');
    return;
  }
  button.disabled = true;
  try {
    const access = await send('access:link');
    let copyError = null;
    try {
      await navigator.clipboard.writeText(access.url);
    } catch (error) {
      copyError = error;
    }
    try {
      await send('access:open');
    } catch (error) {
      const copiedText = copyError ? '' : ' O link foi copiado para a área de transferência.';
      showStatus(`${error.message}${copiedText}`, 'error');
      return;
    }
    if (copyError) {
      showStatus(`A janela anônima foi aberta, mas não foi possível copiar o link. Copie-o manualmente: ${access.url}`, 'error');
    } else {
      showStatus('Acesso copiado e aberto em uma nova janela anônima.', 'success');
    }
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

document.getElementById('reload-invoices').addEventListener('click', async event => {
  const button = event.currentTarget;
  if (!selectedBase?.Id) {
    showStatus('Selecione um cadastro antes de atualizar as faturas.', 'error');
    return;
  }
  const cadastroId = selectedBase.Id;
  button.disabled = true;
  try {
    const invoices = await send('invoice:list', { cadastroId });
    if (Number(selectedBase?.Id) !== Number(cadastroId)) return;
    selectedBase.FaturasRecentes = invoices;
    selectedBase.FaturasErro = '';
    renderCustomerMetrics(selectedBase);
    renderInvoices(invoices);
    showStatus('Faturas atualizadas.', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

document.getElementById('close').addEventListener('click', () => {
  document.querySelector('#login-form [name="password"]').value = '';
  document.querySelector('#login-form [name="code"]').value = '';
  if (window.parent === window) {
    window.close();
    return;
  }
  window.parent.postMessage({ type: 'help-gojo:panel:close' }, WHATSAPP_ORIGIN);
});

window.addEventListener('message', event => {
  const isContextUpdate = event.data?.type === 'help-gojo:panel:context';
  if (
    event.source !== window.parent ||
    event.origin !== WHATSAPP_ORIGIN ||
    !isContextUpdate ||
    typeof event.data?.conversationId !== 'string'
  ) {
    return;
  }
  const nextPhone = normalizedPhone(event.data.phone);
  const sameConversation = event.data.conversationId === conversationId;
  if (!nextPhone && sameConversation && customerPhone) return;
  if (nextPhone !== customerPhone || !sameConversation) {
    resetCustomerContext(nextPhone, event.data.conversationId);
  }
});

async function initialize() {
  const params = new URLSearchParams(location.search);
  customerPhone = normalizedPhone(params.get('clientPhone'));
  conversationId = params.get('conversationId') || '';
  phoneInput.value = customerPhone;

  const emailInput = document.querySelector('#login-form [name="email"]');
  const passwordInput = document.querySelector('#login-form [name="password"]');
  const codeInput = document.querySelector('#login-form [name="code"]');
  const saved = await chrome.storage.local.get([
    AGENT_EMAIL_KEY,
    LOGIN_CREDENTIALS_KEY,
    GOOGLE_CALENDAR_URL_KEY
  ]);
  const credentials = saved[LOGIN_CREDENTIALS_KEY];
  if (credentials && typeof credentials === 'object') {
    emailInput.value = typeof credentials.email === 'string'
      ? credentials.email
      : saved[AGENT_EMAIL_KEY] || '';
    passwordInput.value = typeof credentials.password === 'string' ? credentials.password : '';
    codeInput.value = typeof credentials.code === 'string' ? credentials.code : '';
  } else if (saved[AGENT_EMAIL_KEY]) {
    emailInput.value = saved[AGENT_EMAIL_KEY];
  }

  const savedCalendarUrl = saved[GOOGLE_CALENDAR_URL_KEY];
  if (typeof savedCalendarUrl === 'string' && savedCalendarUrl.trim()) {
    try {
      getGoogleCalendarId(savedCalendarUrl);
      googleCalendarUrl = savedCalendarUrl.trim();
      showCalendarConnected();
      if (!document.getElementById('agenda-panel').hidden) loadGoogleCalendar();
    } catch (error) {
      showCalendarSetup(savedCalendarUrl);
      showAgendaStatus(error.message);
    }
  } else {
    googleCalendarUrl = '';
    showCalendarSetup();
  }

  try {
    const session = await send('status', { conversationId });
    if (!session?.authenticated) {
      await requireAuthentication();
      return;
    }
    loginView.hidden = true;
    workspaceView.hidden = false;
    if (session.base) {
      selectedBase = session.base;
      updateSelectedBase(selectedBase);
      loadBusinessIndicators();
    }
    if (customerPhone) {
      await searchBasesByPhone(customerPhone, { automatic: true });
    } else {
      showStatus('Sessão conectada. Selecione uma conversa ou informe o telefone do cliente.');
    }
  } catch (error) {
    await requireAuthentication(error.message);
  }
}

initialize().catch(error => showStatus(error.message, 'error'));
