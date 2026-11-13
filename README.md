# Help Gojo

Extensão para consultar informações de cadastro e faturas recentes da Next Fit a partir de uma conversa no WhatsApp Web.

## Recursos

- Botão flutuante **HG** no WhatsApp Web para abrir o painel.
- Aba **Agenda** com visualização diária do Google Calendar. No primeiro uso, informe um link compartilhado; ele fica salvo no perfil do navegador e pode ser trocado ou desconectado depois.
- Identificação automática do telefone no cabeçalho ou no painel de informações do contato ("Recado e número de telefone") ao trocar de conversa; se o painel for aberto pela extensão, ele permanece aberto após a leitura.
- Busca manual por telefone com DDD, somente números (por exemplo, `31989823532`).
- Resumo em indicadores separados para mensalidade, Fit, modelo de operação, existência de add-ons, situação de risco e clientes ativos.
- Indicadores mensais de ticket médio, clientes em risco, churn e lifetime (LT).
- O lifetime é exibido em meses e dias, convertendo a fração decimal do mês com base em 30 dias e arredondando os dias para baixo.
- Criação de observações **Perda** e **Ganha** no cadastro Next Fit (tipo API `5`), com textos iniciais específicos para cada opção.
- Consulta das 3 faturas mais recentes, além de tempo desde `DataCriacao`, modalidade, multiunidade, ativação e treinamento.

O Fit é calculado pela contagem de alunos ativos: Fit 1 (0–50), Fit 2 (51–200), Fit 3 (201–300), Fit 4 (301–500), Fit 5 (501–800) e Fit 6 (801–999.999.999). Quando há fatura, usa-se a média de ativos da fatura mais recente; sem faturas, usa-se a contagem atual do cadastro. “Mensalidade” consulta o valor atual da faixa correspondente em `CadastroTabelaPreco`, filtrando pelo cadastro e incluindo `TabelaPrecoPlano`; se a tabela ou a faixa não estiver disponível, o painel informa que o preço está indisponível, sem recorrer a valores fixos. O histórico apresenta até três faturas recentes da conta selecionada, consultadas em `CadastroFatura/Listar` por `CodigoCadastro` e ordenadas por `MesAno`. “Em risco” reflete o campo de atenção do ambiente; o valor da fatura não confirma separadamente se ela foi liquidada.

## Instalação e configuração

1. Abra `chrome://extensions` em um navegador Chromium.
2. Ative **Modo do desenvolvedor** e selecione **Carregar sem compactação**.
3. Escolha a pasta da extensão e abra `https://web.whatsapp.com/`.
4. No Help Gojo, conecte-se com seu e-mail, senha e código de acesso da Next Fit. Na primeira conexão, permita o acesso aos domínios da API Next Fit.
5. Se o número não estiver visível no cabeçalho da conversa, informe-o manualmente no painel.

As credenciais ficam salvas localmente no perfil do navegador para preencher o formulário em acessos futuros; não são criptografadas pela extensão. Proteja o acesso ao perfil do navegador. A sessão de acesso à Next Fit é temporária e requer nova conexão após a mudança do dia local.

Para atualizar a extensão após alterações, recarregue-a em `chrome://extensions` e atualize a aba do WhatsApp Web.
