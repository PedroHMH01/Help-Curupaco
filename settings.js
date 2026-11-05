const CONFIG_KEY = 'helpCurupacoConfig';
const ICON_KEY = 'helpCurupacoIcon';
const OBSERVATIONS_CONFIG_KEY = 'helpCurupacoSupabaseConfig';
const DEFAULT_SUPABASE_URL = 'https://jvqeqlshhbcpwphcnrpg.supabase.co';
const STANDARD_CATEGORY = 'standard';
let config = cloneDefaultConfig();
let customIcon = null;
let theme = { ...DEFAULT_THEME };

const categorySelect = document.getElementById('category-select');
const equipmentSelect = document.getElementById('equipment-select');
const equipmentList = document.getElementById('equipment-list');
const procedureList = document.getElementById('procedure-list');
const standardList = document.getElementById('standard-list');
const problemOptionsList = document.getElementById('problem-options-list');
const infoOptionsList = document.getElementById('info-options-list');
const equipmentEditor = document.getElementById('equipment-editor');
const standardEditor = document.getElementById('standard-editor');
const saveStatus = document.getElementById('save-status');
const themeSelect = document.getElementById('theme-select');
const themeBackgroundFile = document.getElementById('theme-background-file');
const themePreview = document.getElementById('theme-preview');
const supabaseUrlInput = document.getElementById('supabase-url');
const supabaseAnonKeyInput = document.getElementById('supabase-anon-key');
const observationsConfigStatus = document.getElementById('observations-config-status');

function selectedCategory() {
  return config.categories.find(category => category.id === categorySelect.value);
}

function createEditableRow(value, onUpdate, onRemove) {
  const row = document.createElement('div');
  row.className = 'list-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.maxLength = 100;
  input.setAttribute('aria-label', `Editar ${value}`);
  input.addEventListener('change', () => onUpdate(input.value));

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-button';
  remove.textContent = '×';
  remove.setAttribute('aria-label', `Remover ${value}`);
  remove.addEventListener('click', onRemove);

  row.append(input, remove);
  return row;
}

function renderCategoryOptions() {
  const previousSelection = categorySelect.value;
  categorySelect.replaceChildren();
  config.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.label;
    categorySelect.appendChild(option);
  });
  const standardOption = document.createElement('option');
  standardOption.value = STANDARD_CATEGORY;
  standardOption.textContent = 'Procedimentos padrão';
  categorySelect.appendChild(standardOption);
  categorySelect.value = [...config.categories, { id: STANDARD_CATEGORY }]
    .some(category => category.id === previousSelection)
    ? previousSelection
    : config.categories[0].id;
  renderEditor();
}

function renderEditor() {
  renderProcedureList(problemOptionsList, config.problemOptions, (index, value) => {
    config.problemOptions[index] = value;
  }, index => {
    config.problemOptions.splice(index, 1);
    renderEditor();
  });
  renderProcedureList(infoOptionsList, config.infoOptions, (index, value) => {
    config.infoOptions[index] = value;
  }, index => {
    config.infoOptions.splice(index, 1);
    renderEditor();
  });

  const isStandard = categorySelect.value === STANDARD_CATEGORY;
  equipmentEditor.hidden = isStandard;
  standardEditor.hidden = !isStandard;

  if (isStandard) {
    renderProcedureList(standardList, config.standardProcedures, (index, value) => {
      config.standardProcedures[index] = value;
    }, index => {
      config.standardProcedures.splice(index, 1);
      renderEditor();
    });
    return;
  }

  const category = selectedCategory();
  if (!category) return;

  renderEquipmentList(category);
  renderEquipmentSelect(category);
  renderProcedureList(
    procedureList,
    category.proceduresByOption[equipmentSelect.value] || [],
    (index, value) => {
      category.proceduresByOption[equipmentSelect.value][index] = value;
    },
    index => {
      category.proceduresByOption[equipmentSelect.value].splice(index, 1);
      renderEditor();
    }
  );
}

function renderEquipmentList(category) {
  equipmentList.replaceChildren();
  if (!category.options.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-list';
    empty.textContent = 'Nenhum equipamento cadastrado.';
    equipmentList.appendChild(empty);
  }

  category.options.forEach((value, index) => {
    equipmentList.appendChild(createEditableRow(
      value,
      newValue => {
        const normalized = newValue.trim();
        if (!normalized || category.options.some((option, optionIndex) => (
          optionIndex !== index && option.toLocaleLowerCase() === normalized.toLocaleLowerCase()
        ))) {
          showStatus('Informe um nome único para o equipamento.', true);
          renderEditor();
          return;
        }
        if (normalized === value) return;
        category.options[index] = normalized;
        category.proceduresByOption[normalized] =
          category.proceduresByOption[value] || [];
        delete category.proceduresByOption[value];
        renderEditor();
      },
      () => {
        const removed = category.options.splice(index, 1)[0];
        delete category.proceduresByOption[removed];
        renderEditor();
      }
    ));
  });
}

function renderEquipmentSelect(category) {
  const previousSelection = equipmentSelect.value;
  equipmentSelect.replaceChildren();
  category.options.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    equipmentSelect.appendChild(option);
  });
  equipmentSelect.value = category.options.includes(previousSelection)
    ? previousSelection
    : category.options[0] || '';
  equipmentSelect.disabled = category.options.length === 0;
  document.getElementById('add-procedure-form').querySelector('button').disabled =
    category.options.length === 0;
}

function renderProcedureList(container, procedures, onUpdate, onRemove) {
  container.replaceChildren();
  if (!procedures.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-list';
    empty.textContent = 'Nenhum procedimento cadastrado.';
    container.appendChild(empty);
  }

  procedures.forEach((procedure, index) => {
    container.appendChild(createEditableRow(
      procedure,
      value => {
        const normalized = value.trim();
        if (!normalized || procedures.some((item, itemIndex) => (
          itemIndex !== index && item.toLocaleLowerCase() === normalized.toLocaleLowerCase()
        ))) {
          showStatus('Informe um nome único para o procedimento.', true);
          renderEditor();
          return;
        }
        onUpdate(index, normalized);
      },
      () => onRemove(index)
    ));
  });
}

function addEntry(inputId, items, onAdd) {
  const input = document.getElementById(inputId);
  const value = input.value.trim();
  if (!value) return;
  if (items.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
    showStatus('Esse item já existe na lista.', true);
    return;
  }
  onAdd(value);
  input.value = '';
  renderEditor();
  showStatus('Alteração pendente. Clique em Salvar configurações.');
}

function showStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.style.color = isError ? '#b42332' : '#176b38';
}

function updateIconPreview(dataUrl) {
  const preview = dataUrl || chrome.runtime.getURL('icon.png');
  document.getElementById('icon-preview').src = preview;
  document.getElementById('app-icon').src = preview;
}

function isPrivilegedSupabaseKey(value) {
  const key = value.trim();
  if (/service_role|^sb_secret_/i.test(key)) return true;
  const payload = key.split('.')[1];
  if (!payload) return false;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return JSON.parse(decoded).role === 'service_role';
  } catch {
    return false;
  }
}

document.getElementById('save-observations-config').addEventListener('click', async () => {
  observationsConfigStatus.textContent = '';
  try {
    const projectUrl = new URL(supabaseUrlInput.value.trim());
    const anonKey = supabaseAnonKeyInput.value.trim();
    if (
      projectUrl.protocol !== 'https:' ||
      !/^[a-z0-9-]+\.supabase\.co$/i.test(projectUrl.hostname) ||
      projectUrl.pathname !== '/'
    ) {
      throw new Error('Informe a URL HTTPS de um projeto Supabase válido.');
    }
    if (!anonKey) throw new Error('Informe a chave pública anon/publishable.');
    if (isPrivilegedSupabaseKey(anonKey)) {
      throw new Error('Não use service_role ou uma chave secreta. Use a chave pública anon/publishable.');
    }

    const permissionGranted = await chrome.permissions.request({
      origins: [`${projectUrl.origin}/*`]
    });
    if (!permissionGranted) {
      throw new Error('Permissão de conexão com o projeto Supabase não concedida.');
    }

    await chrome.storage.local.set({
      [OBSERVATIONS_CONFIG_KEY]: {
        url: projectUrl.origin,
        anonKey
      }
    });
    supabaseUrlInput.value = projectUrl.origin;
    supabaseAnonKeyInput.value = anonKey;
    observationsConfigStatus.textContent = 'Conexão salva. Execute o SQL do projeto e atualize o Freshworks.';
    observationsConfigStatus.style.color = '#176b38';
  } catch (error) {
    console.error('Não foi possível salvar a conexão do Supabase:', error);
    observationsConfigStatus.textContent = error.message || 'Não foi possível salvar a conexão.';
    observationsConfigStatus.style.color = '#b42332';
  }
});

categorySelect.addEventListener('change', renderEditor);
equipmentSelect.addEventListener('change', renderEditor);

document.getElementById('add-equipment-form').addEventListener('submit', event => {
  event.preventDefault();
  const category = selectedCategory();
  if (!category) return;
  addEntry('new-equipment', category.options, value => {
    category.options.push(value);
    category.proceduresByOption[value] = [];
  });
});

document.getElementById('add-procedure-form').addEventListener('submit', event => {
  event.preventDefault();
  const category = selectedCategory();
  if (!category || !equipmentSelect.value) {
    showStatus('Adicione um equipamento antes de cadastrar procedimentos.', true);
    return;
  }
  const procedures = category.proceduresByOption[equipmentSelect.value] || [];
  category.proceduresByOption[equipmentSelect.value] = procedures;
  addEntry('new-procedure', procedures, value => procedures.push(value));
});

document.getElementById('add-standard-form').addEventListener('submit', event => {
  event.preventDefault();
  addEntry('new-standard', config.standardProcedures, value => {
    config.standardProcedures.push(value);
  });
});

document.getElementById('add-problem-option-form').addEventListener('submit', event => {
  event.preventDefault();
  addEntry('new-problem-option', config.problemOptions, value => {
    config.problemOptions.push(value);
  });
});

document.getElementById('add-info-option-form').addEventListener('submit', event => {
  event.preventDefault();
  addEntry('new-info-option', config.infoOptions, value => {
    config.infoOptions.push(value);
  });
});

document.getElementById('save-button').addEventListener('click', async () => {
  try {
    await chrome.storage.local.set({ [CONFIG_KEY]: config });
    showStatus('Configurações salvas com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar as configurações:', error);
    showStatus('Não foi possível salvar. Tente novamente.', true);
  }
});

document.getElementById('restore-menus-button').addEventListener('click', async () => {
  if (!window.confirm('Restaurar equipamentos, procedimentos e sugestões para a versão de fábrica? Essa ação não altera o ícone personalizado nem os dados de repasse salvos.')) {
    return;
  }

  const defaultConfig = cloneDefaultConfig();
  try {
    await chrome.storage.local.set({ [CONFIG_KEY]: defaultConfig });
    config = defaultConfig;
    renderCategoryOptions();
    showStatus('Menus restaurados para a versão de fábrica.');
  } catch (error) {
    console.error('Erro ao restaurar os menus de fábrica:', error);
    showStatus('Não foi possível restaurar os menus. Tente novamente.', true);
  }
});

document.getElementById('icon-file').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const isIconFile = file.name.toLowerCase().endsWith('.ico');
  if ((!file.type.startsWith('image/') && !isIconFile) || file.size > 1024 * 1024) {
    showStatus('Escolha uma imagem válida de até 1 MB.', true);
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', async () => {
    if (typeof reader.result !== 'string') return;
    try {
      await chrome.storage.local.set({ [ICON_KEY]: reader.result });
      customIcon = reader.result;
      updateIconPreview(customIcon);
      showStatus('Ícone personalizado salvo.');
    } catch (error) {
      console.error('Erro ao salvar o ícone:', error);
      showStatus('Não foi possível salvar o ícone.', true);
    }
  });
  reader.addEventListener('error', () => {
    showStatus('Não foi possível ler o arquivo de imagem.', true);
  });
  reader.readAsDataURL(file);
});

document.getElementById('remove-icon').addEventListener('click', async () => {
  try {
    await chrome.storage.local.remove(ICON_KEY);
    customIcon = null;
    updateIconPreview(null);
    showStatus('Ícone padrão restaurado.');
  } catch (error) {
    console.error('Erro ao restaurar o ícone padrão:', error);
    showStatus('Não foi possível restaurar o ícone.', true);
  }
});

function updateThemePreview() {
  applyHelpCurupacoTheme(theme);
  themeSelect.value = theme.preset;
  themePreview.style.backgroundImage = theme.backgroundImage
    ? `linear-gradient(var(--background-overlay), var(--background-overlay)), url("${theme.backgroundImage}")`
    : 'linear-gradient(var(--background-overlay), var(--background-overlay))';
}

themeSelect.addEventListener('change', async () => {
  theme = { ...theme, preset: themeSelect.value };
  updateThemePreview();
  try {
    await chrome.storage.local.set({ [THEME_KEY]: theme });
    showStatus('Tema salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar o tema:', error);
    showStatus('Não foi possível salvar o tema.', true);
  }
});

themeBackgroundFile.addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (file.type !== 'image/png' || file.size > 2 * 1024 * 1024) {
      throw new Error('Escolha uma imagem PNG de até 2 MB.');
    }

    const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!pngSignature.every((byte, index) => signature[index] === byte)) {
      throw new Error('O arquivo selecionado não é um PNG válido.');
    }

    const reader = new FileReader();
    const backgroundImage = await new Promise((resolve, reject) => {
      reader.addEventListener('load', () => resolve(reader.result), { once: true });
      reader.addEventListener('error', () => reject(new Error('Não foi possível ler o arquivo PNG.')), { once: true });
      reader.readAsDataURL(file);
    });
    if (typeof backgroundImage !== 'string') {
      throw new Error('Não foi possível carregar o arquivo PNG.');
    }

    theme = { ...theme, backgroundImage };
    await chrome.storage.local.set({ [THEME_KEY]: theme });
    updateThemePreview();
    showStatus('Fundo PNG salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar o fundo PNG:', error);
    showStatus(error.message || 'Não foi possível salvar o fundo PNG.', true);
  } finally {
    event.target.value = '';
  }
});

document.getElementById('remove-theme-background').addEventListener('click', async () => {
  theme = { ...theme, backgroundImage: null };
  try {
    await chrome.storage.local.set({ [THEME_KEY]: theme });
    updateThemePreview();
    showStatus('Fundo PNG removido.');
  } catch (error) {
    console.error('Erro ao remover o fundo PNG:', error);
    showStatus('Não foi possível remover o fundo PNG.', true);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[THEME_KEY]) return;
  theme = normalizeHelpCurupacoTheme(changes[THEME_KEY].newValue);
  updateThemePreview();
});

async function initializeSettings() {
  try {
    const values = await chrome.storage.local.get([
      CONFIG_KEY,
      ICON_KEY,
      THEME_KEY,
      OBSERVATIONS_CONFIG_KEY
    ]);
    config = normalizeConfig(values[CONFIG_KEY]);
    customIcon = values[ICON_KEY] || null;
    theme = normalizeHelpCurupacoTheme(values[THEME_KEY]);
    const supabaseConfig = values[OBSERVATIONS_CONFIG_KEY];
    supabaseUrlInput.value = supabaseConfig?.url || DEFAULT_SUPABASE_URL;
    supabaseAnonKeyInput.value = supabaseConfig?.anonKey || '';
    updateThemePreview();
    updateIconPreview(customIcon);
    renderCategoryOptions();
    showStatus('A extensão está pronta para uso.');
  } catch (error) {
    console.error('Erro ao carregar as configurações:', error);
    showStatus('Não foi possível carregar as configurações.', true);
  }
}

initializeSettings();
