const MESSAGE_PREFIX = 'help-curupaco:nextfit:';
const AGENT_EMAIL_KEY = 'helpCurupacoNextfitAgentEmail';
const LOGIN_CREDENTIALS_KEY = 'helpCurupacoNextfitLoginCredentials';
const API_ADM = 'https://apiadm.nextfit.com.br/api';
const API_NEXTFIT = 'https://api.nextfit.com.br/api';

const MODEL_OPTIONS = {
  catraca: [
    'Fake', 'TopData', 'Actuar Smart', 'Actuar LiteNet2', 'Actuar LiteNet3',
    'Henry 7x', 'Henry 8x', 'Serial Genérica', 'iD Block Enterprise',
    'iD Block Modo Pro', 'Proveu Tupã', 'Tecnibra TCA IHM'
  ],
  biometric: ['Digital Persona V2', 'Futronic', 'Hamster DX'],
  facial: ['Hikvision', 'Facial Next Fit', 'iDFace', 'TopData', 'Intelbras'],
  printer: ['Impressora']
};

const FIELD_CONFIG = {
  catraca: {
    Fake: [
      ['description', 'Descrição', 'text', 'Fake'],
      ['digits', 'Quantidade de dígitos', 'number', '4']
    ],
    TopData: [
      ['version', 'Versão', 'text', ''],
      ['serverIp', 'IP do servidor', 'text', ''],
      ['innerIp', 'IP do Inner', 'text', ''],
      ['readerType', 'Tipo de leitor', 'select', 'codigo-barras', [['codigo-barras', 'Código de barras'], ['wiegand', 'Wiegand']]],
      ['biometric', 'Utiliza biometria', 'checkbox', true],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]]
    ],
    'Actuar Smart': [
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]]
    ],
    'Actuar LiteNet2': [
      ['ipRange', 'Faixa de IP', 'text', ''],
      ['number', 'Número', 'text', ''],
      ['version', 'Versão', 'select', 'v1', [['v1', 'V1'], ['v2', 'V2']]],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]]
    ],
    'Actuar LiteNet3': [
      ['ipRange', 'Faixa de IP', 'text', ''],
      ['number', 'Número', 'text', ''],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]]
    ],
    'Henry 7x': [
      ['ip', 'IP da catraca', 'text', ''],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]],
      ['reading', 'Forma de leitura', 'select', 'teclado-biometria', [['teclado-biometria', 'Teclado e biometria'], ['teclado', 'Teclado'], ['biometria', 'Biometria']]]
    ],
    'Henry 8x': [
      ['ip', 'IP da catraca', 'text', ''],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]]
    ],
    'Serial Genérica': [
      ['description', 'Nome do equipamento', 'text', ''],
      ['serialPort', 'Porta serial', 'text', ''],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]],
      ['rts', 'RTS', 'checkbox', true],
      ['dtr', 'DTR', 'checkbox', true]
    ],
    'iD Block Enterprise': [
      ['ip', 'IP da catraca', 'text', ''],
      ['deviceUser', 'Usuário do equipamento', 'text', 'admin'],
      ['devicePassword', 'Senha do equipamento', 'password', 'admin'],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]]
    ],
    'iD Block Modo Pro': [
      ['ip', 'IP da catraca', 'text', ''],
      ['deviceUser', 'Usuário do equipamento', 'text', 'admin'],
      ['devicePassword', 'Senha do equipamento', 'password', 'admin'],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]],
      ['facial', 'Autenticação facial', 'checkbox', false],
      ['keyboard', 'Autenticação por teclado', 'checkbox', true],
      ['biometric', 'Autenticação biométrica', 'checkbox', true]
    ],
    'Proveu Tupã': [
      ['ip', 'IP da catraca', 'text', ''],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]]
    ],
    'Tecnibra TCA IHM': [
      ['communication', 'Comunicação', 'select', 'tcpip', [['tcpip', 'TCP/IP'], ['serial', 'Serial']]],
      ['ip', 'IP da catraca (TCP/IP)', 'text', '', null, false],
      ['serialPort', 'Porta serial', 'text', '', null, false],
      ['direction', 'Sentido da catraca', 'select', 'horario', [['horario', 'Horário'], ['anti-horario', 'Anti-horário']]],
      ['turn', 'Giro', 'select', 'entrada', [['entrada', 'Entrada'], ['entrada-saida', 'Entrada e saída']]],
      ['keyboard', 'Utiliza teclado', 'checkbox', false],
      ['biometric', 'Utiliza biometria', 'checkbox', false],
      ['devicePassword', 'Senha do equipamento', 'password', '123456']
    ]
  },
  biometric: {
    'Digital Persona V2': [
      ['description', 'Descrição do equipamento', 'text', 'Digital Persona V2']
    ],
    Futronic: [
      ['description', 'Descrição do equipamento', 'text', 'Futronic']
    ],
    'Hamster DX': [
      ['description', 'Descrição do equipamento', 'text', 'Hamster DX']
    ]
  },
  facial: {
    Hikvision: [
      ['ip', 'IP', 'text', ''],
      ['httpPort', 'Porta HTTP', 'text', '80'],
      ['serverPort', 'Porta do servidor', 'text', '8000'],
      ['deviceUser', 'Usuário do equipamento', 'text', ''],
      ['devicePassword', 'Senha do equipamento', 'password', '']
    ],
    'Facial Next Fit': [
      ['cameraName', 'Nome da câmera principal', 'text', ''],
      ['minFaceSize', 'Tamanho mínimo da face', 'number', '100'],
      ['otherCamera', 'Utilizar outra câmera para cadastro', 'checkbox', false]
    ],
    iDFace: [
      ['ip', 'IP', 'text', ''],
      ['deviceUser', 'Usuário do equipamento', 'text', 'admin'],
      ['devicePassword', 'Senha do equipamento', 'password', 'admin'],
      ['dependentGate', 'Criar catraca fake dependente', 'checkbox', false]
    ],
    TopData: [
      ['readerPort', 'Porta do leitor', 'text', ''],
      ['releaseMode', 'Forma de liberação', 'select', 'leitor', [['leitor', 'Leitor'], ['catraca', 'Catraca'], ['ambos', 'Ambos']]]
    ],
    Intelbras: [
      ['ip', 'IP', 'text', ''],
      ['serverPort', 'Porta do servidor local', 'text', ''],
      ['deviceUser', 'Usuário do equipamento', 'text', 'admin'],
      ['devicePassword', 'Senha do equipamento', 'password', ''],
      ['releaseMode', 'Forma de liberação', 'select', 'leitor', [['leitor', 'Leitor'], ['catraca', 'Catraca']]]
    ]
  },
  printer: {
    Impressora: [
      ['description', 'Descrição da impressora', 'text', ''],
      ['printControl', 'Criar também uma catraca fake de controle de impressão', 'checkbox', false]
    ]
  }
};

const app = document.getElementById('app');
const statusElement = document.getElementById('status');
const loginView = document.getElementById('login-view');
const workspaceView = document.getElementById('workspace-view');
const selectedView = document.getElementById('selected-view');
const userView = document.getElementById('user-view');
const equipmentView = document.getElementById('equipment-view');
const matchesElement = document.getElementById('matches');
const equipmentListElement = document.getElementById('equipment-list');
const userListElement = document.getElementById('user-list');
const equipmentTypeSelect = document.getElementById('equipment-type');
const equipmentModelSelect = document.getElementById('equipment-model');
const modelLabel = document.getElementById('model-label');
const equipmentFields = document.getElementById('equipment-fields');

let customerEmailFromFreshworks = '';
let customerConversationId = '';
let selectedBase = null;
let currentEquipment = [];
let currentUsers = [];
let currentAction = new URLSearchParams(location.search).get('action') || '';
let equipmentBeingEdited = null;
let baseSearchSequence = 0;

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
  const response = await chrome.runtime.sendMessage({ type: `${MESSAGE_PREFIX}${messageType}`, ...data });
  if (!response?.ok) throw new Error(response?.error || 'Não foi possível concluir a operação.');
  return response.data;
}

function inputElement([name, label, type, defaultValue, options, required = true]) {
  const wrapper = document.createElement('label');
  if (type === 'checkbox') {
    wrapper.className = 'checkbox-label';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.checked = Boolean(defaultValue);
    wrapper.append(input, document.createTextNode(label));
    return wrapper;
  }
  wrapper.append(document.createTextNode(label));
  const input = document.createElement(type === 'select' ? 'select' : 'input');
  input.name = name;
  input.required = type !== 'checkbox' && required;
  if (type === 'select') {
    for (const [value, text] of options || []) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      input.appendChild(option);
    }
    input.value = defaultValue;
  } else {
    input.type = type;
    input.value = defaultValue;
    if (type === 'number') input.min = '1';
  }
  wrapper.appendChild(input);
  return wrapper;
}

let renderedEquipmentType = null;

function renderEquipmentFields() {
  const type = equipmentTypeSelect.value;
  const models = MODEL_OPTIONS[type] || [];
  if (renderedEquipmentType !== type) {
    equipmentModelSelect.replaceChildren();
    for (const model of models) {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      equipmentModelSelect.appendChild(option);
    }
    renderedEquipmentType = type;
  }
  modelLabel.hidden = !type || models.length < 2;
  equipmentFields.replaceChildren();
  if (!type || models.length === 0) return;
  const model = equipmentModelSelect.value || models[0];
  for (const field of FIELD_CONFIG[type][model] || []) {
    equipmentFields.appendChild(inputElement(field));
  }
}

function getEquipmentFields() {
  const values = {};
  for (const element of equipmentFields.querySelectorAll('input, select')) {
    values[element.name] = element.type === 'checkbox' ? element.checked : element.value.trim();
  }
  return values;
}

function numberDirection(value) {
  return value === 'horario' ? 1 : 2;
}

function numberTurn(value) {
  return value === 'entrada' ? 2 : 4;
}

function basePayload(description, type, modelKey, modelId, modelConfig) {
  return {
    Descricao: description,
    Tipo: type,
    ModeloCatraca: type === 1 ? modelId : null,
    ModeloLeitorBiometria: type === 2 ? modelId : null,
    ModeloImpressora: type === 3 ? modelId : null,
    ModeloReconhecimentoFacial: type === 5 ? modelId : null,
    ModeloTeclado: null,
    ...(modelKey ? { [modelKey]: modelConfig } : {})
  };
}

function buildEquipmentPlan(type, model, values) {
  const posts = [];
  let description = '';
  let payload;
  if (type === 'catraca') {
    switch (model) {
      case 'Fake':
        description = values.description;
        payload = basePayload(description, 1, 'Fake', 20, { Giro: 2, QuantidadeDigitos: values.digits });
        break;
      case 'TopData':
        description = `${values.readerType === 'wiegand' ? 'TopData c/facial' : 'TopData'} v: ${values.version} Servidor: ${values.serverIp} Inner: ${values.innerIp}`;
        payload = basePayload(description, 1, 'TopData', 1, {
          TipoComunicacao: 2, Porta: '3570', QuantidadeDigitos: 4, Giro: 2,
          SentidoCatraca: numberDirection(values.direction), Inner: '1',
          Biometria: values.biometric, Identificacao: true, Teclado: true,
          TipoLeitor: values.readerType === 'codigo-barras' ? 0 : 6
        });
        break;
      case 'Actuar Smart':
        description = 'Actuar Smart';
        payload = basePayload(description, 1, 'ActuarSmart', 3, {
          ModoIp: 1, Giro: numberTurn(values.turn), SentidoCatraca: numberDirection(values.direction),
          UtilizaLeitorBiometricoExternoValidacao: true, CodigoLeitorBiometricoExternoValidacao: 'CREATED_BIOMETRIC_ID'
        });
        posts.push(basePayload('Digital Persona V2', 2, 'DigitalPersonaUAreU', 2, { Driver: 2 }));
        break;
      case 'Actuar LiteNet2':
        description = values.version === 'v1' ? 'Actuar LiteNet 2' : 'Actuar LiteNet 2 c/teclado';
        payload = basePayload(description, 1, 'ActuarLiteNet2', 19, {
          Versao: values.version === 'v1' ? 1 : 2, QuantidadeDigitos: 4, Numero: values.number,
          SentidoCatraca: numberDirection(values.direction), FaixaIp: values.ipRange, Giro: numberTurn(values.turn)
        });
        break;
      case 'Actuar LiteNet3':
        description = 'Actuar LiteNet 3';
        payload = basePayload(description, 1, 'ActuarLiteNet3', 29, {
          Numero: values.number, SentidoCatraca: numberDirection(values.direction),
          FaixaIp: values.ipRange, Giro: numberTurn(values.turn)
        });
        break;
      case 'Henry 7x':
        description = 'Henry 7X';
        payload = basePayload(description, 1, 'Henry7X', 4, {
          TipoComunicacao: 1, Porta: '3000', SentidoCatraca: numberDirection(values.direction),
          Ip: values.ip, Giro: numberTurn(values.turn),
          FormaLeitura: values.reading === 'teclado-biometria' ? 3 : values.reading === 'teclado' ? 1 : 2,
          QuantidadeDigitos: 4, TempoLiberacaoSegundos: 3
        });
        break;
      case 'Henry 8x':
        description = `Henry 8x WebServer: ${values.ip}`;
        payload = basePayload(description, 1, 'Henry8X', 8, {
          Ip: values.ip, Porta: '3000', ModeloPlaca: 1, Giro: numberTurn(values.turn),
          SentidoCatraca: numberDirection(values.direction), QuantidadeDigitos: 4,
          TempoLiberacaoSegundos: 5, ModeloBiometria: 1
        });
        break;
      case 'Serial Genérica':
        description = values.description;
        payload = basePayload(description, 1, 'SerialGenerica', 9, {
          PortaCom: values.serialPort, SentidoCatraca: numberDirection(values.direction),
          QuantidadeDigitos: 4, Giro: numberTurn(values.turn), TempoLiberacaoSegundos: 3,
          Rts: values.rts, Dtr: values.dtr
        });
        break;
      case 'iD Block Enterprise':
        description = `iD Block Enterprise - ${values.ip}`;
        payload = basePayload(description, 1, 'IdBlock', 2, {
          Ip: values.ip, Porta: '80', Usuario: values.deviceUser, Senha: values.devicePassword,
          SentidoCatraca: numberDirection(values.direction), Giro: numberTurn(values.turn)
        });
        break;
      case 'iD Block Modo Pro':
        description = `iD Block Next - Modo Pro - ${values.ip}`;
        payload = basePayload(description, 1, 'IdBlockV2', 26, {
          Ip: values.ip, PortaServidorLocal: '8081', Facial: values.facial, Teclado: values.keyboard,
          Biometria: values.biometric, FormaLiberacao: 1, Giro: numberTurn(values.turn), Modelo: 2,
          Senha: values.devicePassword, SentidoCatraca: numberDirection(values.direction),
          TempoLiberacaoSegundos: 3, Usuario: values.deviceUser
        });
        break;
      case 'Proveu Tupã':
        description = 'Proveu Tupã';
        payload = basePayload(description, 1, 'ProveuTupa', 11, {
          Ip: values.ip, Porta: '5151', QuantidadeDigitos: 4, SentidoCatraca: numberDirection(values.direction),
          Codigo: '0001', Giro: numberTurn(values.turn), TempoLiberacaoSegundos: 5
        });
        break;
      case 'Tecnibra TCA IHM':
        description = 'Tecnibra';
        payload = basePayload(description, 1, 'TecnibraTcaIhm', 7, {
          TipoComunicacao: values.communication === 'tcpip' ? 1 : 2,
          Codigo: '1', Senha: values.devicePassword, TempoLiberacaoSegundos: 3, QuantidadeDigitos: 4,
          SentidoCatraca: numberDirection(values.direction), Giro: numberTurn(values.turn),
          UtilizaTeclado: values.keyboard, UtilizaBiometria: values.biometric,
          ...(values.communication === 'tcpip' ? { Ip: values.ip } : { PortaCom: values.serialPort })
        });
        break;
      default: throw new Error('Modelo de catraca não suportado.');
    }
  } else if (type === 'biometric') {
    if (model === 'Digital Persona V2') {
      description = values.description;
      payload = basePayload(description, 2, 'DigitalPersonaUAreU', 2, { Driver: 2 });
    } else if (model === 'Futronic') {
      description = values.description;
      payload = basePayload(description, 2, 'FS80H', 1, { UtilizaImpressaoTreino: false });
    } else {
      description = values.description;
      payload = basePayload(description, 2, 'HamsterDx', 3, { UtilizaImpressaoTreino: false });
    }
  } else if (type === 'printer') {
    description = values.description;
    payload = basePayload(description, 3, null, 1, null);
    if (values.printControl) {
      posts.push({
        __afterCreatedPrinter: true,
        __printerDescription: values.description,
        Descricao: 'Controle de Impressão',
        Tipo: 1,
        ModeloCatraca: 20,
        ModeloLeitorBiometria: null,
        ModeloImpressora: null,
        ModeloReconhecimentoFacial: null,
        ModeloTeclado: null,
        Fake: { Giro: 2, UtilizaImpressaoTreino: true, CodigoImpressoraTreino: 'CREATED_PRINTER_ID' }
      });
    }
  } else if (type === 'facial') {
    switch (model) {
      case 'Hikvision':
        description = `Hikvision | IP: ${values.ip}`;
        payload = basePayload(description, 5, 'HikvisionFacial', 3, {
          Ip: values.ip, PortaHttp: values.httpPort, PortaServidor: values.serverPort,
          Usuario: values.deviceUser, Senha: values.devicePassword
        });
        break;
      case 'Facial Next Fit':
        description = model;
        payload = basePayload(description, 5, 'RfNextFit', 1, {
          NomeCameraPrincipal: values.cameraName, TamanhoMinimoFace: Number(values.minFaceSize),
          UtilizarOutraCameraParaCadastro: values.otherCamera, ModoReconhecimentoFacial: 1
        });
        break;
      case 'iDFace':
        description = model;
        payload = basePayload(description, 5, 'IdFace', 2, {
          Ip: values.ip, PortaServidorLocal: '8081', Usuario: values.deviceUser, Senha: values.devicePassword,
          FormaLiberacao: values.dependentGate ? 1 : 2
        });
        if (values.dependentGate) {
          posts.push({
            __afterCreatedFacial: true,
            Descricao: 'Catraca dependente do iDFace',
            Tipo: 1,
            ModeloCatraca: 20,
            ModeloLeitorBiometria: null,
            ModeloImpressora: null,
            ModeloReconhecimentoFacial: null,
            ModeloTeclado: null,
            Fake: { Giro: 2, QuantidadeDigitos: 4 },
            EquipamentoCatraca: { UtilizaReconhecimentoFacial: true, CodigoEquipamentoReconhecimentoFacial: 'CREATED_FACIAL_ID' }
          });
        }
        break;
      case 'TopData':
        description = 'Facial TopData/EVO';
        payload = basePayload(description, 5, 'FacialTopData', 6, {
          PortaLeitor: values.readerPort, LeitorSaida: false, PortaLeitorSaida: null,
          FormaLiberacao: values.releaseMode === 'leitor' ? 1 : values.releaseMode === 'catraca' ? 2 : 3
        });
        break;
      case 'Intelbras':
        description = model;
        payload = basePayload(description, 5, 'IntelbrasBioT', 4, {
          Ip: values.ip, PortaServidorLocal: values.serverPort, Usuario: values.deviceUser,
          Senha: values.devicePassword, FormaLiberacao: values.releaseMode === 'leitor' ? 1 : 2,
          TempoLiberacaoSegundos: 3
        });
        break;
      default: throw new Error('Modelo facial não suportado.');
    }
  } else {
    throw new Error('Tipo de equipamento não suportado.');
  }

  if (!description.trim()) throw new Error('Preencha a descrição ou os campos obrigatórios.');
  if (type === 'catraca' && ['TopData', 'Henry 7x', 'Henry 8x', 'iD Block Enterprise', 'iD Block Modo Pro', 'Proveu Tupã'].includes(model) && !values.ip && model !== 'TopData') {
    throw new Error('Preencha o IP do equipamento.');
  }
  if (type === 'catraca' && model === 'TopData' && (!values.serverIp || !values.innerIp || !values.version)) throw new Error('Preencha versão e IPs do TopData.');
  if (type === 'catraca' && ['Actuar LiteNet2', 'Actuar LiteNet3'].includes(model) && (!values.ipRange || !values.number)) throw new Error('Preencha a faixa de IP e o número da catraca.');
  if (type === 'catraca' && model === 'Serial Genérica' && !values.serialPort) throw new Error('Preencha a porta serial.');
  if (type === 'catraca' && model === 'Tecnibra TCA IHM' && !(values.communication === 'tcpip' ? values.ip : values.serialPort)) throw new Error('Preencha o IP ou a porta serial.');
  if (type === 'catraca' && ['iD Block Enterprise', 'iD Block Modo Pro'].includes(model) && (!values.deviceUser || !values.devicePassword)) throw new Error('Preencha usuário e senha do equipamento.');
  if (type === 'catraca' && model === 'Tecnibra TCA IHM' && !values.devicePassword) throw new Error('Preencha a senha do equipamento.');
  if (type === 'facial' && ['Hikvision', 'iDFace', 'Intelbras'].includes(model) && !values.ip) throw new Error('Preencha o IP do equipamento.');
  if (type === 'facial' && model === 'Hikvision' && (!values.deviceUser || !values.devicePassword)) throw new Error('Preencha usuário e senha do equipamento.');
  if (type === 'facial' && ['iDFace', 'Intelbras'].includes(model) && (!values.deviceUser || !values.devicePassword)) throw new Error('Preencha usuário e senha do equipamento.');
  if (type === 'facial' && model === 'TopData' && !values.readerPort) throw new Error('Preencha a porta do leitor.');
  if (type === 'facial' && model === 'Facial Next Fit' && !values.cameraName) throw new Error('Preencha o nome da câmera principal.');
  if (type === 'printer' && !values.description) throw new Error('Preencha a descrição da impressora.');
  if (type === 'catraca' && model === 'Actuar Smart') posts.push(payload);
  else posts.unshift(payload);
  return { description, posts };
}

function apiName(item) {
  return item?.Nome || item?.RazaoSocial || item?.NomeFantasia || item?.Descricao || 'Cadastro Next Fit';
}

function renderMatches(bases) {
  matchesElement.replaceChildren();
  if (!bases.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhum cadastro encontrado para esse e-mail.';
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
    details.textContent = `Código ${base.Id ?? ''} · Unidade ${base.CodigoUnidade ?? ''} · ${base.Email || ''}`;
    button.append(title, details);
    button.addEventListener('click', () => selectBase(base));
    matchesElement.appendChild(button);
  }
}

async function searchBasesByEmail(email, { automatic = false, selectUniqueBase = false } = {}) {
  const normalizedEmail = email.trim();
  const requestId = ++baseSearchSequence;
  matchesElement.replaceChildren();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    if (automatic) {
      showStatus('Não consegui identificar o e-mail deste chat. Informe-o para pesquisar as bases.');
      return;
    }
    throw new Error('Informe um e-mail de cliente válido.');
  }

  const form = document.getElementById('search-form');
  setBusy(form, true, 'Buscando…');
  if (automatic) showStatus(`Pesquisando automaticamente por ${normalizedEmail}…`);
  try {
    const bases = await send('base:search', { email: normalizedEmail });
    if (requestId !== baseSearchSequence) return;
    renderMatches(bases);
    if (selectUniqueBase && bases.length === 1) {
      await selectBase(bases[0]);
      return;
    }
    showStatus(
      bases.length
        ? `${bases.length} cadastro(s) encontrado(s) para ${normalizedEmail}.${selectUniqueBase ? ' Se houver mais de um, selecione a base correta para carregar os equipamentos.' : ' Selecione a base correta.'}`
        : `Nenhum cadastro encontrado para ${normalizedEmail}.`,
      bases.length ? 'success' : ''
    );
  } catch (error) {
    if (requestId === baseSearchSequence) showStatus(error.message, 'error');
  } finally {
    if (requestId === baseSearchSequence) setBusy(form, false);
  }
}

function renderEquipment(items) {
  equipmentListElement.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhum equipamento ativo encontrado.';
    equipmentListElement.appendChild(empty);
    return;
  }
  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'equipment-item';
    const details = document.createElement('div');
    details.className = 'record-details';
    const title = document.createElement('span');
    title.textContent = item.Descricao || item.Nome || 'Equipamento';
    const type = document.createElement('small');
    type.textContent = ({ 1: 'Catraca', 2: 'Biométrico', 3: 'Impressora', 5: 'Facial' })[item.Tipo] || `Tipo ${item.Tipo ?? ''}`;
    details.append(title, type);
    const actions = document.createElement('div');
    actions.className = 'record-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'secondary';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => openEquipmentEditor(item));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.textContent = 'Remover';
    remove.addEventListener('click', () => removeEquipment(item));
    actions.append(edit, remove);
    row.append(details, actions);
    equipmentListElement.appendChild(row);
  }
}

function renderUsers(items) {
  userListElement.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhum usuário ativo encontrado.';
    userListElement.appendChild(empty);
    return;
  }
  for (const user of items) {
    const row = document.createElement('div');
    row.className = 'user-item';
    const details = document.createElement('div');
    details.className = 'record-details';
    const name = document.createElement('strong');
    name.textContent = user.Nome || user.Usuario || 'Usuário';
    const email = document.createElement('small');
    email.textContent = user.Email || user.Usuario || 'Sem e-mail cadastrado';
    const profile = document.createElement('small');
    profile.textContent = user.Perfil || user.NomePerfil || `Perfil ${user.TipoPerfil ?? 'não informado'}`;
    details.append(name, email, profile);
    row.appendChild(details);
    userListElement.appendChild(row);
  }
}

async function selectBase(base) {
  clearStatus();
  selectedBase = base;
  selectedView.hidden = false;
  document.getElementById('selected-name').textContent = apiName(base);
  document.getElementById('selected-meta').textContent = `Cadastro ${base.Id} · Unidade ${base.CodigoUnidade}`;
  userView.hidden = true;
  equipmentView.hidden = true;
  showStatus('Carregando dados da base…');
  try {
    const data = await send('base:select', {
      cadastro: base,
      conversationId: customerConversationId
    });
    currentEquipment = data.equipment || [];
    currentUsers = data.users || [];
    selectedBase = data.base || base;
    document.getElementById('selected-name').textContent = apiName(selectedBase);
    document.getElementById('selected-meta').textContent = `Cadastro ${selectedBase.Id} · Unidade ${selectedBase.CodigoUnidade}`;
    renderEquipment(currentEquipment);
    renderUsers(currentUsers);
    clearStatus();
    if (currentAction === 'users') {
      userView.hidden = false;
    } else if (currentAction === 'equipment') {
      equipmentView.hidden = false;
    } else if (currentAction) {
      await activateAction(currentAction);
    }
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

function maskEquipmentSecrets(configuration) {
  const masked = {};
  for (const [key, value] of Object.entries(configuration)) {
    if (/token|secret/i.test(key) && value !== null && value !== '') {
      masked[key] = '********';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      masked[key] = maskEquipmentSecrets(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function equipmentConfiguration(item) {
  const modelProperties = {
    1: ['ModeloCatraca', {
      20: 'Fake', 1: 'TopData', 3: 'ActuarSmart', 19: 'ActuarLiteNet2',
      29: 'ActuarLiteNet3', 4: 'Henry7X', 8: 'Henry8X', 9: 'SerialGenerica',
      2: 'IdBlock', 26: 'IdBlockV2', 11: 'ProveuTupa', 7: 'TecnibraTcaIhm'
    }],
    2: ['ModeloLeitorBiometria', { 2: 'DigitalPersonaUAreU', 1: 'FS80H', 3: 'HamsterDx' }],
    3: ['ModeloImpressora', { 1: 'Impressora' }],
    5: ['ModeloReconhecimentoFacial', {
      3: 'HikvisionFacial', 1: 'RfNextFit', 2: 'IdFace', 6: 'FacialTopData', 4: 'IntelbrasBioT'
    }]
  };
  const [property, models] = modelProperties[item.Tipo] || [];
  const key = property && models[item[property]];
  if (key && item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
    return key;
  }
  const fallbackKeys = [
    'TopData', 'IdBlock', 'ActuarSmart', 'ActuarLiteNet2', 'ActuarLiteNet3', 'Henry7X',
    'Henry8X', 'Fake', 'ProveuTupa', 'TecnibraTcaIhm', 'SerialGenerica', 'IdBlockV2',
    'IdFace', 'FacialTopData', 'HikvisionFacial', 'IntelbrasBioT', 'RfNextFit',
    'DigitalPersonaUAreU', 'FS80H', 'HamsterDx'
  ];
  return fallbackKeys.find(candidate =>
    item[candidate] && typeof item[candidate] === 'object' && !Array.isArray(item[candidate])
  ) || '';
}

function openEquipmentEditor(item) {
  const key = equipmentConfiguration(item);
  if (!item.Id) {
    showStatus('Não foi possível identificar o código deste equipamento para editar.', 'error');
    return;
  }
  equipmentBeingEdited = { item, key };
  document.getElementById('edit-equipment-description').value = item.Descricao || '';
  document.getElementById('edit-equipment-configuration').value =
    key ? JSON.stringify({ [key]: maskEquipmentSecrets(item[key]) }, null, 2) : '{}';
  document.getElementById('edit-equipment-configuration').disabled = !key;
  document.getElementById('equipment-edit-form').hidden = false;
  document.getElementById('equipment-form').hidden = true;
  document.getElementById('equipment-edit-form').scrollIntoView({ block: 'nearest' });
}

async function refreshEquipment() {
  currentEquipment = await send('equipment:list');
  renderEquipment(currentEquipment);
}

async function removeEquipment(item) {
  const confirmed = window.confirm(
    `Remover o equipamento "${item.Descricao || 'Equipamento'}" da unidade ${selectedBase?.CodigoUnidade}?\n\nA Next Fit fará a inativação do registro.`
  );
  if (!confirmed) return;
  try {
    await send('equipment:inactivate', { id: item.Id });
    showStatus('Equipamento removido da lista ativa. Atualizando…', 'success');
    try {
      await refreshEquipment();
      showStatus('Equipamento removido da lista ativa.', 'success');
    } catch (error) {
      showStatus(`Equipamento removido, mas não foi possível atualizar a lista: ${error.message}`, 'error');
    }
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function refreshUsers() {
  if (!selectedBase?.Id) {
    throw new Error('Busque o cliente e selecione a base correta antes de consultar os usuários.');
  }
  currentUsers = await send('user:list', { cadastroId: selectedBase.Id });
  renderUsers(currentUsers);
}

async function openAccessSystem() {
  if (!selectedBase) {
    showStatus('Busque o cliente e selecione a base correta antes de acessar o sistema.', 'error');
    return;
  }
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
  }
}

async function activateAction(action) {
  currentAction = action;
  if (!selectedBase) {
    showStatus('Busque o e-mail do cliente e selecione a base correta para continuar.');
    return;
  }
  userView.hidden = action !== 'users';
  equipmentView.hidden = action !== 'equipment';
  if (action === 'users') {
    await refreshUsers();
  } else if (action === 'equipment') {
    await refreshEquipment();
  } else if (action === 'access') {
    await openAccessSystem();
  }
}

function currentFormTitle(type, model) {
  return `${({ catraca: 'Catraca', biometric: 'Leitor biométrico', facial: 'Reconhecimento facial', printer: 'Impressora' })[type]} — ${model}`;
}

function equipmentValuesSummary(type, model, values) {
  return (FIELD_CONFIG[type][model] || []).map(([name, label, fieldType]) => {
    let value = values[name];
    if (fieldType === 'password' && value) value = '********';
    else if (fieldType === 'checkbox') value = value ? 'Sim' : 'Não';
    return `${label}: ${value || '—'}`;
  }).join('\n');
}

function randomPassword() {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const pool = lower + digits;
  const randomIndex = max => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const chars = Array.from({ length: 7 }, () => pool[randomIndex(pool.length)]);
  const lowerPosition = randomIndex(7);
  let digitPosition = randomIndex(7);
  if (digitPosition === lowerPosition) digitPosition = (digitPosition + 1) % 7;
  chars[lowerPosition] = lower[randomIndex(lower.length)];
  chars[digitPosition] = digits[randomIndex(digits.length)];
  return `${chars.join('')}F`;
}

document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  clearStatus();
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = String(data.get('email')).trim();
  const password = String(data.get('password'));
  const code = String(data.get('code'));
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
    if (customerEmailFromFreshworks) document.getElementById('client-email').value = customerEmailFromFreshworks;
    showStatus('Conectado. Pesquisando as bases deste chat…', 'success');
    if (customerEmailFromFreshworks) {
      await searchBasesByEmail(customerEmailFromFreshworks, { automatic: true });
    } else {
      showStatus('Conectado. Informe o e-mail do cliente para pesquisar as bases.');
    }
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    setBusy(form, false);
  }
});

document.getElementById('search-form').addEventListener('submit', async event => {
  event.preventDefault();
  clearStatus();
  try {
    const email = document.getElementById('client-email').value.trim();
    await searchBasesByEmail(email);
  } catch (error) {
    showStatus(error.message, 'error');
  }
});

document.getElementById('change-client').addEventListener('click', () => {
  selectedBase = null;
  currentAction = '';
  currentEquipment = [];
  currentUsers = [];
  selectedView.hidden = true;
  userView.hidden = true;
  equipmentView.hidden = true;
  document.getElementById('user-form').hidden = true;
  document.getElementById('user-creation-choice').hidden = true;
  document.getElementById('created-user-credentials').hidden = true;
  document.getElementById('created-user-password').value = '';
  document.getElementById('equipment-form').hidden = true;
  document.getElementById('equipment-edit-form').hidden = true;
  clearStatus();
});

document.getElementById('reload-equipment').addEventListener('click', async () => {
  try {
    await refreshEquipment();
    showStatus('Lista de equipamentos atualizada.', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
});

document.getElementById('reload-users').addEventListener('click', async () => {
  try {
    await refreshUsers();
    showStatus('Lista de usuários atualizada.', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
});

document.getElementById('open-user').addEventListener('click', () => {
  activateAction('users').catch(error => showStatus(error.message, 'error'));
});

document.getElementById('open-equipment').addEventListener('click', () => {
  activateAction('equipment').catch(error => showStatus(error.message, 'error'));
});

document.getElementById('access-system').addEventListener('click', () => {
  activateAction('access').catch(error => showStatus(error.message, 'error'));
});

document.getElementById('show-user-form').addEventListener('click', () => {
  if (!selectedBase) return;
  document.getElementById('created-user-credentials').hidden = true;
  document.getElementById('user-creation-choice').hidden = false;
  document.getElementById('user-form').hidden = true;
  document.getElementById('user-creation-choice').scrollIntoView({ block: 'nearest' });
});

function openUserCreationForm(linkToEquipment) {
  if (!selectedBase) return;
  const choice = document.getElementById('user-creation-choice');
  const form = document.getElementById('user-form');
  const equipmentLabel = document.getElementById('user-equipment-label');
  const equipmentSelect = document.getElementById('user-equipment');
  const nameInput = document.getElementById('user-name');
  const credentials = document.getElementById('created-user-credentials');
  const credentialStatus = document.getElementById('credential-copy-status');
  const prefix = 'Controle de acesso (Não alterar)';

  credentials.hidden = true;
  credentialStatus.textContent = '';
  choice.hidden = true;
  if (linkToEquipment) {
    if (!currentEquipment.length) {
      choice.hidden = false;
      showStatus('Não há equipamentos ativos nesta base para vincular o usuário.', 'error');
      return;
    }
    equipmentSelect.replaceChildren();
    for (const equipment of currentEquipment) {
      const option = document.createElement('option');
      option.value = String(equipment.Id);
      option.textContent = equipment.Descricao || equipment.Nome || `Equipamento ${equipment.Id}`;
      equipmentSelect.appendChild(option);
    }
    equipmentLabel.hidden = false;
    const equipment = currentEquipment.find(item => String(item.Id) === equipmentSelect.value);
    nameInput.value = `${prefix} ${equipment?.Descricao || equipment?.Nome || ''}`.trim();
  } else {
    equipmentSelect.replaceChildren();
    equipmentLabel.hidden = true;
    nameInput.value = prefix;
  }

  const unit = String(selectedBase.CodigoUnidade);
  let address = `${unit}@controle.com.br`;
  let suffix = 2;
  const existingEmails = new Set(currentUsers.map(user => String(user.Email || '').toLowerCase()));
  while (existingEmails.has(address.toLowerCase())) {
    address = `${unit}-${suffix}@controle.com.br`;
    suffix += 1;
  }
  document.querySelector('#user-form [name="email"]').value = address;
  form.hidden = false;
  form.scrollIntoView({ block: 'nearest' });
}

document.getElementById('create-standard-user').addEventListener('click', () => {
  openUserCreationForm(false);
});

document.getElementById('create-linked-user').addEventListener('click', () => {
  openUserCreationForm(true);
});

document.getElementById('user-equipment').addEventListener('change', event => {
  const equipment = currentEquipment.find(item => String(item.Id) === event.currentTarget.value);
  const prefix = 'Controle de acesso (Não alterar)';
  const equipmentName = equipment?.Descricao || equipment?.Nome || '';
  document.getElementById('user-name').value = `${prefix} ${equipmentName}`.trim();
});

document.getElementById('user-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const email = String(data.get('email')).trim();
  if (!name || !email || !selectedBase) return;
  const linkedEquipmentId = document.getElementById('user-equipment-label').hidden
    ? null
    : Number(data.get('equipmentId'));
  if (
    linkedEquipmentId !== null &&
    !currentEquipment.some(item => Number(item.Id) === linkedEquipmentId)
  ) {
    showStatus('Selecione um equipamento ativo para vincular o usuário.', 'error');
    return;
  }
  const password = randomPassword();
  const confirmed = window.confirm(
    `Confirmar criação do usuário de catraca?\n\nNome: ${name}\nE-mail: ${email}\nUnidade: ${selectedBase.CodigoUnidade}\nPerfil: Instrutor${linkedEquipmentId ? `\nEquipamento: ${currentEquipment.find(item => Number(item.Id) === linkedEquipmentId)?.Descricao || 'Selecionado'}` : '\nTipo: Usuário padrão'}\n\nUma senha aleatória será gerada e exibida após a criação.`
  );
  if (!confirmed) return;
  setBusy(form, true, 'Criando…');
  try {
    await send('user:create', { name, email, password });
    document.getElementById('created-user-name').value = name;
    document.getElementById('created-user-email').value = email;
    document.getElementById('created-user-password').value = password;
    form.reset();
    form.hidden = true;
    document.getElementById('user-creation-choice').hidden = true;
    document.getElementById('created-user-credentials').hidden = false;
    showStatus('Usuário criado. Copie e guarde a senha para entrar no computador.', 'success');
    try {
      await refreshUsers();
    } catch (error) {
      showStatus(`Usuário criado, mas a lista não pôde ser atualizada: ${error.message}. A senha continua visível abaixo.`, 'error');
    }
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    setBusy(form, false);
  }
});

document.getElementById('copy-user-password').addEventListener('click', async () => {
  const passwordInput = document.getElementById('created-user-password');
  const copyStatus = document.getElementById('credential-copy-status');
  try {
    await navigator.clipboard.writeText(passwordInput.value);
    copyStatus.textContent = 'Senha copiada.';
  } catch (error) {
    passwordInput.focus();
    passwordInput.select();
    copyStatus.textContent = 'Não foi possível copiar automaticamente. A senha está selecionada; copie com Ctrl+C.';
    showStatus(error.message || 'Não foi possível copiar a senha automaticamente.', 'error');
  }
});

document.getElementById('show-equipment-form').addEventListener('click', () => {
  document.getElementById('equipment-edit-form').hidden = true;
  document.getElementById('equipment-form').hidden = false;
  document.getElementById('equipment-form').reset();
  renderEquipmentFields();
  document.getElementById('equipment-form').scrollIntoView({ block: 'nearest' });
});

equipmentTypeSelect.addEventListener('change', renderEquipmentFields);
equipmentModelSelect.addEventListener('change', renderEquipmentFields);

document.getElementById('equipment-edit-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!equipmentBeingEdited || !selectedBase) return;
  const form = event.currentTarget;
  const description = document.getElementById('edit-equipment-description').value.trim();
  let configuration;
  try {
    configuration = JSON.parse(document.getElementById('edit-equipment-configuration').value);
  } catch {
    showStatus('A configuração deve ser um JSON válido.', 'error');
    return;
  }
  const confirmed = window.confirm(
    `Salvar alterações no equipamento "${equipmentBeingEdited.item.Descricao || 'Equipamento'}"?\n\nDescrição: ${description}\n\nConfirme somente se revisou a configuração.`
  );
  if (!confirmed) return;
  setBusy(form, true, 'Salvando…');
  try {
    await send('equipment:update', {
      id: equipmentBeingEdited.item.Id,
      description,
      configuration
    });
    equipmentBeingEdited = null;
    form.hidden = true;
    showStatus('Equipamento atualizado. Atualizando a lista…', 'success');
    try {
      await refreshEquipment();
      showStatus('Equipamento atualizado.', 'success');
    } catch (error) {
      showStatus(`Equipamento atualizado, mas não foi possível atualizar a lista: ${error.message}`, 'error');
    }
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    setBusy(form, false);
  }
});

document.getElementById('cancel-equipment-edit').addEventListener('click', () => {
  equipmentBeingEdited = null;
  document.getElementById('equipment-edit-form').hidden = true;
});

document.getElementById('cancel-equipment-form').addEventListener('click', () => {
  document.getElementById('equipment-form').hidden = true;
});

document.getElementById('cancel-user-form').addEventListener('click', () => {
  document.getElementById('user-form').hidden = true;
  document.getElementById('user-creation-choice').hidden = true;
});

document.getElementById('equipment-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const type = equipmentTypeSelect.value;
  const model = equipmentModelSelect.value;
  try {
    const values = getEquipmentFields();
    const plan = buildEquipmentPlan(type, model, values);
    const chained = plan.posts.length > 1;
    const confirmed = window.confirm(
      `Confirmar criação?\n\nCliente: ${apiName(selectedBase)}\nUnidade: ${selectedBase.CodigoUnidade}\nEquipamento: ${currentFormTitle(type, model)}\n${equipmentValuesSummary(type, model, values)}\nGravações: ${plan.posts.length}${chained ? '\n\nEste fluxo cria mais de um registro e pode deixar uma gravação parcial se a API falhar.' : ''}`
    );
    if (!confirmed) return;
    setBusy(form, true, 'Criando…');
    await send('equipment:create', { equipmentType: type, model, posts: plan.posts });
    form.hidden = true;
    showStatus(`${currentFormTitle(type, model)} criado com sucesso. Atualizando a lista…`, 'success');
    try {
      await refreshEquipment();
      showStatus(`${currentFormTitle(type, model)} criado com sucesso.`, 'success');
    } catch (error) {
      showStatus(`${currentFormTitle(type, model)} foi criado, mas a lista não pôde ser atualizada: ${error.message}`, 'error');
    }
  } catch (error) {
    showStatus(error.message, 'error');
    if (selectedBase) {
      try {
        currentEquipment = await send('equipment:list');
        renderEquipment(currentEquipment);
      } catch (refreshError) {
        showStatus(`${error.message} A lista não pôde ser atualizada: ${refreshError.message}`, 'error');
      }
    }
  } finally {
    setBusy(form, false);
  }
});

document.getElementById('close').addEventListener('click', () => {
  document.querySelector('#login-form [name="password"]').value = '';
  document.querySelector('#login-form [name="code"]').value = '';
  window.parent.postMessage(
    { type: 'help-curupaco:utilities:close' },
    'https://sistemanextfit.myfreshworks.com'
  );
});

window.addEventListener('message', event => {
  const action = event.data?.action;
  const isContextUpdate = event.data?.type === 'help-curupaco:utilities:context';
  if (
    event.source !== window.parent ||
    event.origin !== 'https://sistemanextfit.myfreshworks.com' ||
    (!isContextUpdate && event.data?.type !== 'help-curupaco:utilities:action') ||
    (!isContextUpdate && !['users', 'equipment', 'access'].includes(action))
  ) {
    return;
  }
  const freshworksEmail = typeof event.data.clientEmail === 'string'
    ? event.data.clientEmail.trim()
    : '';
  const freshworksConversationId = typeof event.data.conversationId === 'string'
    ? event.data.conversationId
    : '';
  if (
    (freshworksConversationId && freshworksConversationId !== customerConversationId) ||
    (freshworksEmail && freshworksEmail !== customerEmailFromFreshworks)
  ) {
    customerEmailFromFreshworks = freshworksEmail;
    customerConversationId = freshworksConversationId;
    document.getElementById('client-email').value = freshworksEmail;
    selectedBase = null;
    currentEquipment = [];
    currentUsers = [];
    selectedView.hidden = true;
    userView.hidden = true;
    equipmentView.hidden = true;
    document.getElementById('user-form').hidden = true;
    document.getElementById('user-creation-choice').hidden = true;
    document.getElementById('created-user-credentials').hidden = true;
    document.getElementById('created-user-password').value = '';
    document.getElementById('equipment-form').hidden = true;
    document.getElementById('equipment-edit-form').hidden = true;
    if (customerEmailFromFreshworks && !workspaceView.hidden) {
      searchBasesByEmail(customerEmailFromFreshworks, {
        automatic: true,
        selectUniqueBase: currentAction === 'equipment'
      });
    } else if (workspaceView.hidden) {
      showStatus('A conversa mudou. A pesquisa será feita assim que você conectar.');
    } else {
      searchBasesByEmail('', { automatic: true });
    }
  }
  if (!isContextUpdate) {
    activateAction(action).catch(error => showStatus(error.message, 'error'));
  }
});

async function initialize() {
  const params = new URLSearchParams(location.search);
  customerEmailFromFreshworks = params.get('clientEmail') || '';
  customerConversationId = params.get('conversationId') || '';
  currentAction = params.get('action') || '';
  const emailInput = document.querySelector('#login-form [name="email"]');
  const passwordInput = document.querySelector('#login-form [name="password"]');
  const codeInput = document.querySelector('#login-form [name="code"]');
  const saved = await chrome.storage.local.get([AGENT_EMAIL_KEY, LOGIN_CREDENTIALS_KEY]);
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
  if (customerEmailFromFreshworks) document.getElementById('client-email').value = customerEmailFromFreshworks;
  try {
    const session = await send('status', {
      conversationId: customerConversationId
    });
    if (session?.authenticated) {
      loginView.hidden = true;
      workspaceView.hidden = false;
      if (session.base) {
        selectedBase = session.base;
        selectedView.hidden = false;
        document.getElementById('selected-name').textContent = apiName(selectedBase);
        document.getElementById('selected-meta').textContent = `Cadastro ${selectedBase.Id} · Unidade ${selectedBase.CodigoUnidade}`;
        showStatus('Sessão ativa. Base selecionada.', 'success');
      } else {
        showStatus('Sessão ativa.', 'success');
      }
      if (customerEmailFromFreshworks) {
        await searchBasesByEmail(customerEmailFromFreshworks, { automatic: true });
      } else {
        showStatus('Sessão ativa. Informe o e-mail do cliente para pesquisar as bases.');
      }
      if (currentAction && selectedBase) {
        await activateAction(currentAction);
      }
    } else {
      loginView.hidden = false;
    }
  } catch (error) {
    showStatus(error.message, 'error');
    loginView.hidden = false;
  }
}

initialize().catch(error => showStatus(error.message, 'error'));
