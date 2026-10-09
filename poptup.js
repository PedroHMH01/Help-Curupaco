let currentStep = 1;
let currentUrlKey = null;
let config = cloneDefaultConfig();

document.body.classList.toggle(
  'embedded',
  new URLSearchParams(window.location.search).get('embedded') === '1'
);

// Elementos estáticos do DOM
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnCopy = document.getElementById('btn-copy');
const btnReset = document.getElementById('btn-reset');
const outputText = document.getElementById('output-text');

// Obtém a URL da aba ativa
async function getCurrentTabUrl() {
  const toStorageKey = value => {
    try {
      return new URL(value).href;
    } catch (error) {
      console.error('URL inválida para salvar os dados:', error);
      return null;
    }
  };

  const contextUrl = new URLSearchParams(window.location.search).get('contextUrl');
  if (contextUrl) {
    return toStorageKey(contextUrl);
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      return toStorageKey(tab.url);
    }
  } catch (e) {
    console.error("Erro ao obter URL da aba:", e);
  }
  return null;
}

// Salva os dados no storage local para a URL atual
function saveDataForCurrentUrl() {
  if (!currentUrlKey) return;

  const state = {
    catraca: document.querySelector('input[name="catraca"]:checked')?.value || null,
    facial: document.querySelector('input[name="facial"]:checked')?.value || null,
    bio: document.querySelector('input[name="bio"]:checked')?.value || null,
    impressora: document.querySelector('input[name="impressora"]:checked')?.value || null,
    problema: document.getElementById('input-problema')?.value || '',
    procedimentosTexto: document.getElementById('input-procedimentos')?.value || '',
    info: document.getElementById('input-info')?.value || '',
    anydesk: document.getElementById('input-anydesk')?.value || '',
    procedimentos: (document.getElementById('input-procedimentos')?.value || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
    outputText: outputText.value
  };

  chrome.storage.local.set({ [currentUrlKey]: state });
}

// Carrega os dados do storage local
async function loadDataForCurrentUrl() {
  const storedConfig = await chrome.storage.local.get('helpCurupacoConfig');
  config = normalizeConfig(storedConfig.helpCurupacoConfig);
  renderEquipmentOptions();
  renderFieldOptions();

  currentUrlKey = await getCurrentTabUrl();
  if (!currentUrlKey) {
    generateSummary();
    return;
  }

  chrome.storage.local.get([currentUrlKey], (result) => {
    const data = result[currentUrlKey];
    if (!data) {
      generateSummary();
      return;
    }

    if (data.catraca) setRadioValue('catraca', data.catraca);
    if (data.facial) setRadioValue('facial', data.facial);
    if (data.bio) setRadioValue('bio', data.bio);
    if (data.impressora) setRadioValue('impressora', data.impressora);
    renderFieldOptions();

    if (data.problema) document.getElementById('input-problema').value = data.problema;
    const procedureText = typeof data.procedimentosTexto === 'string'
      ? data.procedimentosTexto
      : Array.isArray(data.procedimentos)
        ? data.procedimentos.map(procedure => (
          procedure === 'Troca de IP' && (data.ipDe || data.ipPara)
            ? `${procedure} (De: ${data.ipDe || ''} Para: ${data.ipPara || ''})`
            : procedure
        )).join(', ')
        : '';
    document.getElementById('input-procedimentos').value = procedureText;
    if (data.info) document.getElementById('input-info').value = data.info;
    if (data.anydesk) document.getElementById('input-anydesk').value = data.anydesk;

    // Recolhe sanfonas dos itens já selecionados
    document.querySelectorAll('.accordion-content').forEach(ac => {
      if (ac.querySelector('input[type="radio"]:checked')) {
        ac.classList.add('collapsed');
      }
    });

    generateSummary();
    if (typeof data.outputText === 'string' && typeof data.procedimentosTexto === 'string') {
      outputText.value = data.outputText;
    }
  });
}

function setRadioValue(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) radio.checked = true;
}

function renderEquipmentOptions() {
  config.categories.forEach(category => {
    const group = document.getElementById(`equipment-${category.id}`);
    if (!group) return;

    const selectedValue = group.querySelector('input:checked')?.value;
    group.replaceChildren();
    category.options.forEach(option => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = category.radioName;
      radio.value = option;
      radio.checked = option === selectedValue;
      label.append(radio, document.createTextNode(` ${option}`));
      group.appendChild(label);
    });
  });
}

function renderSelectOptions(selectId, options, placeholder) {
  const select = document.getElementById(selectId);
  select.replaceChildren(new Option(placeholder, ''));
  [...new Set(options)].forEach(value => {
    const option = new Option(value, value);
    select.appendChild(option);
  });
}

function renderFieldOptions() {
  renderSelectOptions('problem-options', config.problemOptions, 'Adicionar uma sugestão...');
  renderSelectOptions('info-options', config.infoOptions, 'Adicionar uma sugestão...');

  const procedures = [...config.standardProcedures];
  config.categories.forEach(category => {
    const selectedOption = document.querySelector(
      `input[name="${category.radioName}"]:checked`
    )?.value;
    if (selectedOption) {
      procedures.push(...(category.proceduresByOption[selectedOption] || []));
    }
  });
  renderSelectOptions('procedure-options', procedures, 'Adicionar uma ação...');
}

function appendSelectedOption(select, field) {
  const value = select.value;
  if (!value) return;

  const currentValues = field.value.split(',').map(item => item.trim()).filter(Boolean);
  if (!currentValues.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
    currentValues.push(value);
    field.value = currentValues.join(', ');
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  select.value = '';
}

document.getElementById('problem-options').addEventListener('change', event => {
  appendSelectedOption(event.currentTarget, document.getElementById('input-problema'));
});
document.getElementById('procedure-options').addEventListener('change', event => {
  appendSelectedOption(event.currentTarget, document.getElementById('input-procedimentos'));
});
document.getElementById('info-options').addEventListener('change', event => {
  appendSelectedOption(event.currentTarget, document.getElementById('input-info'));
});

// Constrói o texto do repasse
function generateSummary() {
  const catraca = document.querySelector('input[name="catraca"]:checked')?.value;
  const facial = document.querySelector('input[name="facial"]:checked')?.value;
  const bio = document.querySelector('input[name="bio"]:checked')?.value;
  const impressora = document.querySelector('input[name="impressora"]:checked')?.value;

  const tiposEquip = [];
  const marcaModelo = [];

  if (catraca) { tiposEquip.push('Catraca'); marcaModelo.push(catraca); }
  if (facial) { tiposEquip.push('Leitor Facial'); marcaModelo.push(facial); }
  if (bio) { tiposEquip.push('Leitor Biométrico'); marcaModelo.push(bio); }
  if (impressora) { tiposEquip.push('Impressora'); marcaModelo.push(impressora); }

  const problema = document.getElementById('input-problema')?.value || '';
  const procedimentos = document.getElementById('input-procedimentos')?.value || '';
  const info = document.getElementById('input-info')?.value || '';
  const anydesk = document.getElementById('input-anydesk')?.value || '';

  outputText.value = `CLEAR - REPASSE

@REPASSE RESUMO

Equipamento: ${tiposEquip.join(', ')}

Marca/Modelo: ${marcaModelo.join(', ')}

Problema: ${problema}

Procedimentos realizados: ${procedimentos}

Informações importantes: ${info}

AnyDesk: ${anydesk}`;
}

// Navegação entre passos
btnNext.addEventListener('click', () => {
  if (currentStep === 1) {
    currentStep = 2;
    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    btnPrev.disabled = false;
    btnNext.hidden = true;
  }
});

btnPrev.addEventListener('click', () => {
  if (currentStep === 2) {
    currentStep = 1;
    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-1').classList.add('active');
    btnPrev.disabled = true;
    btnNext.hidden = false;
  }
});

// Delegação global de eventos de clique/alteração para evitar atribuições inline
document.addEventListener('click', (e) => {
  const header = e.target.closest('.accordion-header');
  if (header) {
    const targetId = header.getAttribute('data-target');
    const targetContent = document.getElementById(targetId);
    if (targetContent) {
      targetContent.classList.toggle('collapsed');
    }
  }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('input[type="radio"]')) {
    const parentAccordion = e.target.closest('.accordion-content');
    if (parentAccordion) {
      parentAccordion.classList.add('collapsed');
    }
    renderFieldOptions();
    generateSummary();
    saveDataForCurrentUrl();
  }
});

document.addEventListener('input', (e) => {
  if (e.target === outputText) {
    saveDataForCurrentUrl();
  } else if (['input-problema', 'input-procedimentos', 'input-info', 'input-anydesk'].includes(e.target.id)) {
    generateSummary();
    saveDataForCurrentUrl();
  }
});

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Use the legacy API if clipboard access is unavailable in this context.
    }
  }

  const temporaryTextarea = document.createElement('textarea');
  temporaryTextarea.value = text;
  temporaryTextarea.setAttribute('readonly', '');
  temporaryTextarea.style.position = 'fixed';
  temporaryTextarea.style.left = '-9999px';
  document.body.appendChild(temporaryTextarea);
  temporaryTextarea.select();

  try {
    if (!document.execCommand('copy')) {
      throw new Error('O navegador não permitiu copiar o texto.');
    }
  } finally {
    temporaryTextarea.remove();
  }
}

// Botão Copiar
btnCopy.addEventListener('click', async () => {
  const originalText = btnCopy.innerText;
  try {
    await copyTextToClipboard(outputText.value);
    btnCopy.innerText = 'Copiado com Sucesso!';
  } catch (error) {
    console.error('Erro ao copiar o repasse:', error);
    btnCopy.innerText = 'Falha ao copiar';
  }
  setTimeout(() => { btnCopy.innerText = originalText; }, 1500);
});

// Botão Limpar
btnReset.addEventListener('click', () => {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  document.querySelectorAll('input[type="text"], textarea').forEach(i => i.value = '');
  document.querySelectorAll('.accordion-content').forEach(ac => ac.classList.remove('collapsed'));

  currentStep = 1;
  document.getElementById('step-2').classList.remove('active');
  document.getElementById('step-1').classList.add('active');
  btnPrev.disabled = true;
  btnNext.hidden = false;

  renderFieldOptions();
  generateSummary();

  if (currentUrlKey) {
    chrome.storage.local.remove([currentUrlKey]);
  }
});

// Inicialização
loadDataForCurrentUrl();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes.helpCurupacoConfig) return;
  config = normalizeConfig(changes.helpCurupacoConfig.newValue);
  renderEquipmentOptions();
  renderFieldOptions();
  generateSummary();
  saveDataForCurrentUrl();
});