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
