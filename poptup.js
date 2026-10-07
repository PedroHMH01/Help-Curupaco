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
const dynamicProceduresDiv = document.getElementById('dynamic-procedures');

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
    info: document.getElementById('input-info')?.value || '',
    anydesk: document.getElementById('input-anydesk')?.value || '',
    ipDe: document.getElementById('ip-de')?.value || '',
    ipPara: document.getElementById('ip-para')?.value || '',
    procedimentos: Array.from(document.querySelectorAll('.proc-cb:checked')).map(cb => cb.value),
    outputText: outputText.value
  };

  chrome.storage.local.set({ [currentUrlKey]: state });
}

// Carrega os dados do storage local
async function loadDataForCurrentUrl() {
  const storedConfig = await chrome.storage.local.get('helpCurupacoConfig');
  config = storedConfig.helpCurupacoConfig || cloneDefaultConfig();
  renderEquipmentOptions();
  renderStandardProcedures();

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

    renderDynamicProcedures();

    if (data.problema) document.getElementById('input-problema').value = data.problema;
    if (data.info) document.getElementById('input-info').value = data.info;
    if (data.anydesk) document.getElementById('input-anydesk').value = data.anydesk;

    if (data.ipDe && document.getElementById('ip-de')) document.getElementById('ip-de').value = data.ipDe;
    if (data.ipPara && document.getElementById('ip-para')) document.getElementById('ip-para').value = data.ipPara;

    if (data.procedimentos) {
      document.querySelectorAll('.proc-cb').forEach(cb => {
        cb.checked = data.procedimentos.includes(cb.value);
      });
    }

    // Recolhe sanfonas dos itens já selecionados
    document.querySelectorAll('.accordion-content').forEach(ac => {
      if (ac.querySelector('input[type="radio"]:checked')) {
        ac.classList.add('collapsed');
      }
    });

    generateSummary();
    if (typeof data.outputText === 'string') {
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

function renderStandardProcedures() {
  const group = document.getElementById('standard-procedures');
  const selectedValues = new Set(
    Array.from(group.querySelectorAll('.proc-cb:checked'), checkbox => checkbox.value)
  );
  group.replaceChildren();
  config.standardProcedures.forEach(procedure => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'proc-cb';
    checkbox.value = procedure;
    checkbox.checked = selectedValues.has(procedure);
    label.append(checkbox, document.createTextNode(` ${procedure}`));
    group.appendChild(label);
  });
}

// Renderização dos procedimentos dinâmicos
function renderDynamicProcedures() {
  const selectedProcedures = new Set(
    Array.from(dynamicProceduresDiv.querySelectorAll('.proc-cb:checked'), checkbox => checkbox.value)
  );
  dynamicProceduresDiv.replaceChildren();

  config.categories.forEach(category => {
    const selectedOption = document.querySelector(
      `input[name="${category.radioName}"]:checked`
    )?.value;
    if (!selectedOption) return;

    const procedures = category.proceduresByOption[selectedOption] || [];
    if (!procedures.length) return;

    const section = createSection(
      `Procedimentos ${category.label} (${selectedOption})`,
      procedures.map(procedure => ({
        type: 'checkbox',
        value: procedure,
        label: procedure
      }))
    );

    if (procedures.includes('Troca de IP')) {
      const inputs = document.createElement('div');
      inputs.className = 'inline-inputs';

      const inputFrom = document.createElement('input');
      inputFrom.type = 'text';
      inputFrom.id = 'ip-de';
      inputFrom.placeholder = 'De IP: Ex 192.168.0.10';

      const inputTo = document.createElement('input');
      inputTo.type = 'text';
      inputTo.id = 'ip-para';
      inputTo.placeholder = 'Para IP: Ex 192.168.0.15';

      inputs.append(inputFrom, inputTo);
      section.appendChild(inputs);
    }

    dynamicProceduresDiv.appendChild(section);
  });

  dynamicProceduresDiv.querySelectorAll('.proc-cb').forEach(checkbox => {
    checkbox.checked = selectedProcedures.has(checkbox.value);
  });
}

// Auxiliar para construção limpa dos elementos DOM sem HTML dinâmico
function createSection(titleText, items) {
  const container = document.createElement('div');
  container.className = 'dynamic-section';

  const title = document.createElement('label');
  title.style.fontWeight = 'bold';
  title.style.color = '#6f42c1';
  title.style.fontSize = '12px';
  title.textContent = titleText;
  container.appendChild(title);

  const group = document.createElement('div');
  group.className = 'checkbox-group';
  group.style.marginTop = '4px';

  items.forEach(item => {
    const lbl = document.createElement('label');
    const input = document.createElement('input');
    input.type = item.type;
    input.className = 'proc-cb';
    input.value = item.value;

    lbl.appendChild(input);
    lbl.appendChild(document.createTextNode(' ' + item.label));
    group.appendChild(lbl);
  });

  container.appendChild(group);
  return container;
}

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

  const procedimentos = [];
  document.querySelectorAll('.proc-cb:checked').forEach(cb => {
    let val = cb.value;
    if (val === 'Troca de IP') {
      const de = document.getElementById('ip-de')?.value || '';
      const para = document.getElementById('ip-para')?.value || '';
      if (de || para) val += ` (De: ${de} Para: ${para})`;
    }
    procedimentos.push(val);
  });

  const problema = document.getElementById('input-problema')?.value || '';
  const info = document.getElementById('input-info')?.value || '';
  const anydesk = document.getElementById('input-anydesk')?.value || '';

  outputText.value = `CLEAR - REPASSE

@REPASSE RESUMO

Equipamento: ${tiposEquip.join(', ')}

Marca/Modelo: ${marcaModelo.join(', ')}

Problema: ${problema}

Procedimentos realizados: ${procedimentos.join(', ')}

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
    btnNext.innerText = 'Finalizar';
  }
});

btnPrev.addEventListener('click', () => {
  if (currentStep === 2) {
    currentStep = 1;
    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-1').classList.add('active');
    btnPrev.disabled = true;
    btnNext.innerText = 'Próximo';
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
    renderDynamicProcedures();
    generateSummary();
    saveDataForCurrentUrl();
  } else if (e.target.matches('.proc-cb')) {
    generateSummary();
    saveDataForCurrentUrl();
  }
});

document.addEventListener('input', (e) => {
  if (e.target === outputText) {
    saveDataForCurrentUrl();
  } else if (['input-problema', 'input-info', 'input-anydesk', 'ip-de', 'ip-para'].includes(e.target.id)) {
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
  document.querySelectorAll('input[type="text"]').forEach(i => i.value = '');
  document.querySelectorAll('.accordion-content').forEach(ac => ac.classList.remove('collapsed'));

  currentStep = 1;
  document.getElementById('step-2').classList.remove('active');
  document.getElementById('step-1').classList.add('active');
  btnPrev.disabled = true;
  btnNext.innerText = 'Próximo';

  renderDynamicProcedures();
  generateSummary();

  if (currentUrlKey) {
    chrome.storage.local.remove([currentUrlKey]);
  }
});

// Inicialização
loadDataForCurrentUrl();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes.helpCurupacoConfig) return;
  config = changes.helpCurupacoConfig.newValue || cloneDefaultConfig();
  renderEquipmentOptions();
  renderStandardProcedures();
  renderDynamicProcedures();
  generateSummary();
  saveDataForCurrentUrl();
});