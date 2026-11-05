const DEFAULT_CONFIG = {
  problemOptions: [
    'Equipamento sem comunicação',
    'Falha de conexão com a rede',
    'Problema após atualização',
    'Equipamento não reconhecido pelo sistema'
  ],
  infoOptions: [
    'Equipamento testado e funcionando',
    'Aguardando retorno do cliente',
    'Necessário acompanhamento',
    'Problema não reproduzido durante os testes'
  ],
  standardProcedures: [
    'Ressincronização de banco',
    'Instalação completa',
    'Instalação parcial'
  ],
  categories: [
    {
      id: 'catraca',
      label: 'Catracas',
      radioName: 'catraca',
      options: [
        'Topdata',
        'Id block',
        'Henry 7x',
        'Henry 8x',
        'Actuar Smart',
        'Actuar LiteNet2',
        'Actuar LiteNet3',
        'Serial generica'
      ],
      proceduresByOption: {
        'Topdata': ['Catraca na rede', 'Confirmação de Wi-Fi', 'Troca de IP'],
        'Id block': ['Catraca na rede', 'Confirmação de Wi-Fi', 'Troca de IP'],
        'Henry 7x': ['Catraca na rede', 'Confirmação de Wi-Fi', 'Troca de IP'],
        'Henry 8x': ['Catraca na rede', 'Confirmação de Wi-Fi', 'Troca de IP'],
        'Actuar Smart': [],
        'Actuar LiteNet2': [],
        'Actuar LiteNet3': [],
        'Serial generica': ['Troca de porta', 'Usa adaptador USB', 'Instalação de driver']
      }
    },
    {
      id: 'facial',
      label: 'Leitor Facial',
      radioName: 'facial',
      options: ['ID face', 'Topdata/EVO', 'Intelbras', 'Hikvision'],
      proceduresByOption: {
        'ID face': [],
        'Topdata/EVO': [],
        'Intelbras': [],
        'Hikvision': []
      }
    },
    {
      id: 'bio',
      label: 'Leitor Biométrico',
      radioName: 'bio',
      options: ['Digital persona', 'Futronic', 'ID bio'],
      proceduresByOption: {
        'Digital persona': [
          'Troca de porta USB',
          'Instalação do driver',
          'Confirmação de luz no leitor físico'
        ],
        'Futronic': [
          'Troca de porta USB',
          'Instalação do driver',
          'Confirmação de luz no leitor físico'
        ],
        'ID bio': [
          'Troca de porta USB',
          'Instalação do driver',
          'Confirmação de luz no leitor físico'
        ]
      }
    },
    {
      id: 'impressora',
      label: 'Impressora',
      radioName: 'impressora',
      options: ['Elgin', 'Bematech', 'ID print', 'Generica'],
      proceduresByOption: {
        'Elgin': ['Instalação do driver', 'Troca de porta'],
        'Bematech': ['Instalação do driver', 'Troca de porta'],
        'ID print': ['Instalação do driver', 'Troca de porta'],
        'Generica': ['Instalação do driver', 'Troca de porta']
      }
    }
  ]
};

const THEME_KEY = 'helpCurupacoTheme';
const DEFAULT_THEME = {
  preset: 'purple',
  backgroundImage: null
};
const THEME_PRESETS = {
  purple: {
    label: 'Roxo clássico',
    colorScheme: 'light',
    primary: '#6f42c1',
    hover: '#593196',
    light: '#f3ebff',
    border: '#d1b8f5',
    background: '#ffffff',
    pageBackground: '#f5f3fa',
    surface: '#ffffff',
    field: '#fcfaff',
    text: '#212529',
    muted: '#666666',
    buttonText: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.78)'
  },
  ocean: {
    label: 'Oceano',
    colorScheme: 'light',
    primary: '#1769aa',
    hover: '#0f4c81',
    light: '#e6f4ff',
    border: '#a8d7f0',
    background: '#f6fbff',
    pageBackground: '#eaf5fb',
    surface: '#ffffff',
    field: '#eff8ff',
    text: '#182b3a',
    muted: '#526575',
    buttonText: '#ffffff',
    overlay: 'rgba(246, 251, 255, 0.78)'
  },
  forest: {
    label: 'Floresta',
    colorScheme: 'light',
    primary: '#28734a',
    hover: '#1e5838',
    light: '#e8f5ec',
    border: '#b6d9c1',
    background: '#f7fcf8',
    pageBackground: '#edf6ef',
    surface: '#ffffff',
    field: '#f1f8f2',
    text: '#203329',
    muted: '#58685d',
    buttonText: '#ffffff',
    overlay: 'rgba(247, 252, 248, 0.8)'
  },
  sunset: {
    label: 'Pôr do sol',
    colorScheme: 'light',
    primary: '#bd5428',
    hover: '#913d1c',
    light: '#fff0e8',
    border: '#f0c3aa',
    background: '#fffaf7',
    pageBackground: '#fbf0e9',
    surface: '#ffffff',
    field: '#fff7f2',
    text: '#39271f',
    muted: '#756057',
    buttonText: '#ffffff',
    overlay: 'rgba(255, 250, 247, 0.8)'
  },
  midnight: {
    label: 'Noturno',
    colorScheme: 'dark',
    primary: '#a98bff',
    hover: '#9271ed',
    light: '#302746',
    border: '#51436f',
    background: '#191722',
    pageBackground: '#13121b',
    surface: '#211f2b',
    field: '#191722',
    text: '#f1eef8',
    muted: '#b5afc1',
    buttonText: '#191722',
    overlay: 'rgba(19, 18, 27, 0.78)'
  }
};

function normalizeHelpCurupacoTheme(value) {
  const preset = Object.prototype.hasOwnProperty.call(THEME_PRESETS, value?.preset)
    ? value.preset
    : DEFAULT_THEME.preset;
  const backgroundImage = typeof value?.backgroundImage === 'string'
    && /^data:image\/png;base64,[A-Za-z0-9+/]*={0,2}$/.test(value.backgroundImage)
    ? value.backgroundImage
    : null;
  return { preset, backgroundImage };
}

function applyHelpCurupacoTheme(theme) {
  const normalizedTheme = normalizeHelpCurupacoTheme(theme);
  const preset = THEME_PRESETS[normalizedTheme.preset];
  const root = document.documentElement;
  const variables = {
    '--primary-purple': preset.primary,
    '--hover-purple': preset.hover,
    '--light-purple': preset.light,
    '--border-purple': preset.border,
    '--bg-color': preset.background,
    '--page-bg-color': preset.pageBackground,
    '--surface-color': preset.surface,
    '--field-color': preset.field,
    '--text-color': preset.text,
    '--muted-color': preset.muted,
    '--button-text-color': preset.buttonText,
    '--background-overlay': preset.overlay
  };

  Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
  root.style.colorScheme = preset.colorScheme;

  if (document.body) {
    document.body.style.backgroundImage = normalizedTheme.backgroundImage
      ? `linear-gradient(var(--background-overlay), var(--background-overlay)), url("${normalizedTheme.backgroundImage}")`
      : '';
    document.body.style.backgroundSize = normalizedTheme.backgroundImage ? 'cover' : '';
    document.body.style.backgroundPosition = normalizedTheme.backgroundImage ? 'center' : '';
    document.body.style.backgroundAttachment = normalizedTheme.backgroundImage ? 'fixed' : '';
  }
}

function applyFreshworksHelpCurupacoTheme(theme) {
  const normalizedTheme = normalizeHelpCurupacoTheme(theme);
  const preset = THEME_PRESETS[normalizedTheme.preset];
  const root = document.documentElement;
  const chatOverlay = preset.colorScheme === 'dark'
    ? 'rgba(19, 18, 27, 0.35)'
    : 'rgba(255, 255, 255, 0.35)';
  const chatBackgroundImage = normalizedTheme.backgroundImage
    ? `linear-gradient(${chatOverlay}, ${chatOverlay}), url("${normalizedTheme.backgroundImage}")`
    : null;
  const variables = {
    '--hc-theme-page-overlay': preset.overlay,
    '--hc-theme-page': preset.pageBackground,
    '--hc-theme-surface': preset.surface,
    '--hc-theme-surface-alt': preset.field,
    '--hc-theme-text': preset.text,
    '--hc-theme-muted': preset.muted,
    '--hc-theme-border': preset.border,
    '--hc-theme-accent': preset.primary,
    '--hc-theme-accent-soft': preset.light,
    '--hc-theme-button-text': preset.buttonText,
    '--hc-theme-background-image': normalizedTheme.backgroundImage
      ? `linear-gradient(${preset.overlay}, ${preset.overlay}), url("${normalizedTheme.backgroundImage}")`
      : 'none'
  };

  if (chatBackgroundImage) {
    root.style.setProperty('--hc-theme-chat-background-image', chatBackgroundImage);
    root.dataset.helpCurupacoChatBackground = 'true';
  } else {
    root.style.removeProperty('--hc-theme-chat-background-image');
    delete root.dataset.helpCurupacoChatBackground;
  }

  if (normalizedTheme.preset === 'purple') {
    Object.keys(variables).forEach(name => root.style.removeProperty(name));
    root.style.removeProperty('color-scheme');
    delete root.dataset.helpCurupacoTheme;
    return;
  }

  Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
  root.dataset.helpCurupacoTheme = normalizedTheme.preset;
  root.style.colorScheme = preset.colorScheme;
}

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function normalizeConfig(value) {
  const defaults = cloneDefaultConfig();
  return {
    ...defaults,
    ...value,
    problemOptions: Array.isArray(value?.problemOptions) ? value.problemOptions : defaults.problemOptions,
    infoOptions: Array.isArray(value?.infoOptions) ? value.infoOptions : defaults.infoOptions,
    standardProcedures: Array.isArray(value?.standardProcedures)
      ? value.standardProcedures
      : defaults.standardProcedures,
    categories: Array.isArray(value?.categories) ? value.categories : defaults.categories
  };
}
