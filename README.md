# Help Curupaco

Extensão para apoiar o atendimento de chamados no Freshworks: organiza informações de equipamentos, agiliza a elaboração de repasses e mantém observações compartilhadas por conversa.

## O que a extensão oferece

### Gerador de repasse

O gerador é exibido aberto por padrão no painel lateral do Freshworks. Clique no cabeçalho **Help Curupaco** (ou use Enter/Espaço quando estiver focado nele) para recolher ou reabrir o formulário. O painel ajusta a altura ao conteúdo para evitar uma rolagem interna. Ele ajuda a compor um texto padronizado com:

- equipamentos e modelos selecionados: catracas, leitores faciais, leitores biométricos e impressoras;
- problema ou motivo do chamado;
- procedimentos realizados;
- informações importantes;
- código do AnyDesk;
- texto final editável, pronto para copiar e colar.

As listas de procedimentos podem depender do equipamento escolhido. Menus de sugestões permitem inserir textos predefinidos nos campos sem apagar o conteúdo já escrito.

### Dados de trabalho salvos neste navegador

O preenchimento do gerador é salvo automaticamente no armazenamento local do navegador, associado à URL da página atual. Isso permite continuar o preenchimento ao voltar à mesma página, neste mesmo perfil de navegador.

Esse rascunho não é enviado ao Supabase nem sincronizado automaticamente entre agentes ou navegadores. **Limpar Dados** apaga o rascunho associado à página atual e reinicia o formulário.

### Observações compartilhadas por conversa

Na lateral do Freshworks há uma seção **Observações da conversa**. As observações são associadas ao identificador da conversa e podem ser consultadas por outros usuários que conectem a extensão ao mesmo projeto Supabase.

- Para consultar observações, abra a seção. A consulta é feita quando ela é aberta.
- Escreva o texto e selecione **Adicionar observação** para gravá-lo.
- O registro inclui o nome exibido do agente e a data/hora.
- Os registros são somente de inclusão: a interface não oferece edição ou exclusão.

O nome do agente é informativo e vem da interface do Freshworks; não é uma identidade verificada pelo banco de dados.

### Filtro prioritário da caixa de entrada

No Freshworks compatível, a extensão tenta selecionar automaticamente a ordenação **Tempo de espera mais longo (Caixa de entrada prioritária)** quando o menu correspondente aparece. A disponibilidade e o rótulo podem variar conforme mudanças do próprio Freshworks.

### Personalização

Nas opções da extensão é possível:

- escolher entre **Roxo clássico**, **Oceano**, **Floresta**, **Pôr do sol** e **Noturno**;
- carregar ou remover uma imagem PNG de fundo;
- trocar o ícone mostrado no painel;
- cadastrar equipamentos, modelos e procedimentos;
- editar as sugestões de problema e informações importantes;
- restaurar os menus de fábrica.

**Roxo clássico** preserva o estilo original do Freshworks, mantendo o roxo no Help Curupaco e no gerador. Uma imagem PNG escolhida aparece no gerador e como fundo fixo do histórico de conversa, sem rolar junto com as mensagens; com outra paleta, o restante do CRM também recebe o tema escolhido. As configurações e imagens são salvas localmente no navegador.

## Como instalar e abrir

1. Obtenha a pasta da extensão distribuída pela equipe.
2. No Chrome ou em um navegador Chromium compatível, abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Selecione **Carregar sem compactação** e escolha a pasta da extensão.
5. Abra o Freshworks no endereço autorizado pela extensão: `https://sistemanextfit.myfreshworks.com/`.
6. Abra o painel lateral do Help Curupaco no Freshworks para usar o gerador.
7. Para configurar listas, temas, ícone ou Supabase, use o botão da extensão ou abra `chrome://extensions` → Help Curupaco → **Detalhes** → **Opções da extensão**.

Após atualizar os arquivos da extensão, recarregue-a na página de extensões e atualize a aba do Freshworks.

## Usar o gerador

1. No primeiro passo, selecione os equipamentos e modelos atendidos.
2. Avance para o segundo passo.
3. Preencha o problema, os procedimentos, as informações importantes e, se necessário, o código do AnyDesk.
4. Use as listas de sugestões para acrescentar itens predefinidos; é possível escolher mais de uma sugestão.
5. Revise e edite o texto final.
6. Selecione **Copiar Repasse** e cole o texto no local apropriado do atendimento.
7. Use **Limpar Dados** para reiniciar e apagar o rascunho local da página atual.

## Configurar observações com Supabase

A configuração é necessária em cada instalação/perfil de navegador que deverá acessar as observações.

1. Crie ou abra o projeto Supabase da equipe.
2. No SQL Editor do projeto, execute [`supabase/conversation-observations.sql`](./supabase/conversation-observations.sql).
3. No painel do Supabase, abra **Project Settings** → **API Keys** e copie a chave pública **publishable**. Em projetos com chaves legadas, pode ser usada a chave pública **anon**.
4. Nas opções do Help Curupaco, informe a URL do projeto e cole a chave pública no campo **Chave pública anon / publishable**.
5. Se o navegador solicitar, conceda à extensão permissão para acessar o domínio do Supabase.
6. Selecione **Salvar conexão** e atualize a aba do Freshworks.
7. Abra uma conversa, expanda **Observações da conversa** e aguarde o carregamento.

Não use nem compartilhe uma chave `service_role`, `secret` ou qualquer chave privilegiada. A chave pública é guardada no armazenamento local do perfil do navegador.

### Limites de segurança e privacidade do Supabase

O modo atual usa acesso público com uma chave pública: quem obtiver a URL do projeto e essa chave pode consultar e tentar inserir registros pela API, inclusive fora do Freshworks. A extensão restringe suas próprias mensagens ao domínio Freshworks configurado, mas isso **não autentica os usuários perante o Supabase**.

As políticas do banco permitem consulta e inclusão para o domínio fixado no SQL e não concedem atualização ou exclusão aos papéis públicos usados pela extensão. Isso não valida a identidade do agente, nem substitui autenticação, controle de acesso individual ou proteção contra abuso. Não armazene dados pessoais, credenciais ou informações sensíveis nas observações sem antes definir controles de segurança apropriados para a equipe.

## Onde os dados ficam

| Dado | Local | Compartilhamento |
|---|---|---|
| Rascunho e texto do repasse | Armazenamento local do navegador | Não é compartilhado automaticamente |
| Listas de equipamentos, procedimentos e sugestões | Armazenamento local do navegador | Aplicável apenas àquele perfil, salvo distribuição/backup separado |
| Tema, imagem de fundo e ícone | Armazenamento local do navegador | Aplicável apenas àquele perfil |
| URL e chave pública do Supabase | Armazenamento local do navegador | Configurar nos demais perfis que usarão as observações |
| Observações enviadas | Projeto Supabase configurado | Compartilhadas conforme as permissões e políticas desse projeto |

## Solução de problemas

- **A seção de observações pede configuração:** abra as opções, confira a URL e a chave pública e salve a conexão.
- **Não carrega ou não salva:** confirme que o SQL foi executado no mesmo projeto Supabase da URL configurada e que a permissão de domínio foi concedida.
- **O nome do agente não é identificado:** confira se a conta está conectada e se o perfil do agente está visível no Freshworks.
- **O painel ou filtro não apareceu:** confirme que está no domínio Freshworks autorizado, recarregue a extensão e atualize a página. O Freshworks pode alterar sua interface e seletores.
- **As alterações de configuração não aparecem:** feche e reabra o painel ou atualize a aba do Freshworks.

## Benefícios atuais

- Padroniza e acelera a redação de repasses sem retirar do agente a possibilidade de revisar o texto.
- Reduz digitação repetida com sugestões e procedimentos associados aos equipamentos.
- Preserva rascunhos durante a navegação no mesmo perfil e na mesma URL.
- Mantém contexto adicional por conversa para consulta pela equipe.
- Permite adaptar menus e aparência ao fluxo de trabalho da operação.
- Ajuda a priorizar a caixa de entrada pela ordenação de maior tempo de espera.

Esses recursos apoiam o trabalho do agente, mas não alteram o conteúdo do chamado automaticamente, não substituem a revisão humana e não garantem por si só redução de tempo ou de erros.

## Possibilidades de evolução

As ideias abaixo são possibilidades, não funcionalidades disponíveis atualmente:

- **Acesso seguro por agente:** autenticação Supabase, identificação verificada, permissões por equipe e remoção do acesso público.
- **Governança das observações:** trilha de auditoria, política de retenção, exportação e fluxo administrativo para corrigir ou remover registros conforme as regras da empresa.
- **Mais contexto por chamado:** anexos, categorias, busca, marcação de observações importantes e histórico de alterações.
- **Sincronização de configurações:** distribuir menus e temas administrativamente entre os perfis da equipe.
- **Mais automação no repasse:** modelos por tipo de chamado, validação de campos obrigatórios e integração com campos do Freshworks, quando suportada e autorizada.
- **Acompanhamento operacional:** métricas de adoção, qualidade e tempo de atendimento com coleta mínima e controles de privacidade.
- **Acessibilidade e idiomas:** navegação por teclado, melhorias para leitores de tela e interface em outros idiomas.
- **Compatibilidade e confiabilidade:** testes automatizados para mudanças do Freshworks, indicadores de conexão e diagnóstico mais claro para falhas.

## Escopo técnico atual

A extensão usa Manifest V3 e injeta o painel apenas em `sistemanextfit.myfreshworks.com`. A integração de observações usa a API REST do Supabase e a tabela `conversation_observations`, definida pelo script SQL do repositório.
