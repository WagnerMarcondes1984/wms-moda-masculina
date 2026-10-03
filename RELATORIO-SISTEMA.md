# Relatório do sistema WMS Moda Masculina

Data da análise: 02/10/2026. Escopo: arquivos locais do projeto, inspeção do código e verificações isoladas de JavaScript. Não foram acessados o banco de produção, o Console Firebase, contas de usuários ou a hospedagem. Nenhuma alteração funcional foi realizada.

## 1. Avaliação geral

O sistema é um catálogo digital de moda masculina com carrinho e encaminhamento de pedidos pelo WhatsApp, acompanhado de painel administrativo, ponto de venda (PDV) e relatório mensal de vendas registradas.

A arquitetura é simples: páginas HTML, CSS e JavaScript executados no navegador, integrados diretamente ao Firebase. A base atende a uma operação pequena com atendimento manual. Há limitações relevantes de segurança, consistência financeira e rastreabilidade que precisam de correção antes de depender do sistema como principal controle comercial.

O catálogo e o PDV compartilham os produtos, mas possuem fluxos de fechamento separados. Um pedido encaminhado pelo catálogo não gera automaticamente uma venda no Firestore. Assim, o faturamento exibido no painel representa as vendas registradas no PDV, e não necessariamente todas as vendas da loja.

## 2. Estrutura e tecnologias

| Arquivo ou pasta | Responsabilidade |
|---|---|
| `index.html` | Vitrine pública, busca, categorias, carrinho e formulários de entrega/retirada |
| `script.js` | Leitura do Firestore, filtros, carrinho, cupons, configuração visual e geração da mensagem do WhatsApp |
| `style.css` | Estilos da vitrine e adaptação para dispositivos móveis |
| `admin.html` | Login, gestão de produtos/categorias/cupons, PDV, relatórios e configurações; CSS e JavaScript incorporados |
| `firebase-config.js` | Configuração Firebase compartilhada pelas três páginas |
| `seed-firebase.html` | Carga inicial autenticada de produtos, categorias e cupom |
| `regras.md` | Proposta de regras de acesso ao Firestore e instruções de configuração |
| `assets/` | Sete imagens JPEG locais, incluindo seis imagens de produtos e uma de identidade visual |

Dependências identificadas: Firebase SDK compat 10.12.2, Firebase Authentication por e-mail/senha, Cloud Firestore, Font Awesome 6.5.1 e Google Fonts. O WhatsApp é acionado por link `wa.me`; não há integração de mensagens por API.

Não foram encontrados servidor próprio, framework de interface, gerenciador de dependências, pipeline de compilação, configuração de implantação, testes automatizados versionados ou documentação geral de instalação. Os arquivos podem ser servidos por hospedagem estática, desde que o Firebase e os recursos externos estejam acessíveis.

O projeto Firebase referenciado é `wms-moda-masculina`. A marca exibida é WMS Moda Masculina. Essa diferença de nomes não comprova erro de integração, mas merece documentação para evitar confusão operacional.

## 3. Funcionalidades públicas

O visitante pode consultar produtos ativos, filtrar por categoria e pesquisar pelo conteúdo dos produtos. A vitrine apresenta imagem, nome, descrição, preço e botão de adicionar ao carrinho.

O carrinho permite adicionar produtos, aumentar ou diminuir quantidades e remover itens. Calcula subtotal, desconto e total e apresenta contador de unidades. Em telas móveis, existe uma barra inferior para acessar o carrinho. Seu conteúdo fica somente na memória da página: recarregar ou fechar a página perde a seleção.

Na entrega, são solicitados nome, telefone, CEP e endereço. Há seleção de PIX, crédito, débito ou dinheiro, além de campo de troco. Essas opções são informadas na mensagem; não existe cobrança, geração de PIX ou confirmação de pagamento integrada.

Na retirada, são solicitados nome, data e horário. Os dias da semana, a faixa de horários e o intervalo são configuráveis. Não existe controle de capacidade, reserva de horário ou confirmação automática do agendamento.

Os cupons podem ser percentuais ou de valor fixo, com status ativo, validade e valor mínimo. A vitrine verifica essas condições ao aplicar o cupom e o remove se o subtotal cair abaixo do mínimo.

A finalização abre o WhatsApp com uma mensagem contendo itens, valores e dados de entrega ou retirada. Abrir esse link não comprova que o cliente enviou a mensagem ou que a loja confirmou o pedido. Não há número de pedido, acompanhamento de status ou persistência desse pedido no banco.

## 4. Painel administrativo e PDV

O login utiliza Firebase Authentication, com persistência de sessão configurada no painel. O código exibe o painel para qualquer usuário autenticado; não verifica papel administrativo ou lista de usuários autorizados.

Produtos: criação, edição e exclusão; campos de nome, categoria, preço, descrição, imagem, ativo e destaque; pesquisa e filtros por categoria e status; indicadores de quantidade total, ativos e destaques. O campo destaque é administrável, mas não possui tratamento específico na vitrine analisada.

Categorias: criação, edição e exclusão, com nome, identificador e ícone. O identificador de nova categoria é gerado a partir do nome. Não há proteção contra sobrescrever uma categoria com identificador já existente nem tratamento dos produtos relacionados quando uma categoria é excluída.

Cupons: criação, edição e exclusão; código, tipo, valor, mínimo, validade e status. A verificação de código duplicado utiliza os dados carregados na sessão, sem garantia contra cadastros simultâneos.

PDV: seleção de produtos ativos, carrinho, ajuste de quantidade, desconto manual e cupom, cliente opcional e pagamento em uma ou duas formas. A venda é gravada em `vendas`, com data gerada pelo servidor. Há listagem das vendas do dia e exclusão definitiva de vendas.

Relatórios: seleção de mês, quantidade de vendas, soma dos totais e ticket médio, além de tabela com data, horário, cliente, itens, pagamento e total. Ticket médio é a soma dos totais dividida pela quantidade de vendas. Não há cálculo de lucro, despesas, custo de mercadoria, taxas, contas a receber ou conciliação de pagamentos. Não foi identificada exportação CSV/PDF.

Configurações: nome da loja, WhatsApp, dias e horários de retirada, intervalo, imagem de cabeçalho e três cores. A campanha “Black Friday Antecipada” e o texto de desconto de até 50% permanecem fixos no HTML; não há lógica que comprove ou aplique essa promoção aos preços.

## 5. Modelo de dados

| Coleção | Principais campos observados |
|---|---|
| `produtos` | `id`, `nome`, `categoria`, `preco`, `imagem`, `descricao`, `ativo`, `destaque`, `criadoEm` |
| `categorias` | `id`, `nome`, `icone` |
| `cupons` | `codigo`, `tipo`, `valor`, `valorMinimo`, `validade`, `ativo` |
| `configuracoes/geral` | Nome, WhatsApp, calendário de retirada, banner e cores |
| `vendas` | `itens`, `subtotal`, `desconto`, `total`, `pagamentos`, `pagamento`, `cliente`, `cupom`, `criadoEm` |

Os itens gravados em vendas contêm nome, preço e quantidade, mas não preservam o identificador do produto. Não há registro do operador responsável, origem do pedido ou histórico de alteração/cancelamento.

As imagens carregadas pelo painel são redimensionadas no navegador, convertidas para JPEG e armazenadas como data URL dentro do documento Firestore. Produtos usam dimensão máxima padrão de 900 pixels e banners, 1600 pixels. O código não utiliza Firebase Storage, apesar de a configuração conter um bucket.

## 6. Segurança e integridade

**Prioridade alta — autorização administrativa ampla.** As regras propostas em `regras.md` usam apenas `request.auth != null` para permitir escrita e acesso a vendas. Se publicadas exatamente assim, qualquer conta autenticada no projeto recebe essas permissões. Não é possível afirmar que são as regras atualmente implantadas. Deve-se restringir por identidade ou papel administrativo e verificar a configuração de criação de contas.

**Prioridade alta — conteúdo do banco inserido como HTML.** Nomes, descrições, categorias e dados de vendas são interpolados em `innerHTML` e, em alguns casos, em atributos e handlers `onclick`. Há risco de XSS armazenado se conteúdo malicioso entrar nesses campos. Não foi realizada exploração. A correção deve usar criação de elementos e `textContent`, validação de URLs e eliminação de interpolação de dados em handlers.

**Prioridade alta — validação financeira insuficiente.** A proposta de regras não valida campos, tipos, faixas de preço, descontos, quantidades ou coerência dos totais. As verificações ficam no navegador. Os limites `min` dos inputs não substituem validação explícita nas funções de gravação.

**Prioridade alta — exclusão de vendas sem rastreabilidade.** O painel remove o documento definitivamente. Isso altera os indicadores e elimina a evidência da venda, sem registrar operador ou motivo. Recomenda-se cancelamento com status, justificativa e trilha de auditoria.

**Prioridade média — exposição de cupons.** As regras propostas permitem leitura pública de toda a coleção e a vitrine carrega todos os cupons, inclusive os que depois recusa. Isso permite conhecer códigos e condições. Caso existam cupons destinados a públicos restritos, a arquitetura precisa de validação específica.

A configuração cliente do Firebase está no repositório, como exigido pelo uso do SDK no navegador. A proteção dos dados precisa estar nas regras e na autorização; ocultar esse arquivo não resolve os riscos identificados. Não foi encontrada chave de conta de serviço nos arquivos analisados.

## 7. Problemas funcionais encontrados

| Prioridade | Evidência | Efeito |
|---|---|---|
| Alta | `pdvAplicarCupom` não verifica `validade` | Cupom vencido pode ser utilizado no PDV |
| Alta | `pdvCalcularDesconto` não revalida o valor mínimo | Cupom continua descontando após reduzir o carrinho abaixo do mínimo |
| Alta | Finalização de venda não possui bloqueio de envio em andamento ou identificador de operação | Cliques repetidos podem gerar vendas duplicadas; cenário não reproduzido contra o banco |
| Alta | ID de novo produto calculado como maior ID carregado + 1, seguido de `set` | Duas sessões podem escolher o mesmo documento e sobrescrever um cadastro |
| Média | CEP exigido, mas ausente na mensagem de entrega | Informação preenchida pelo cliente não chega ao lojista |
| Média | Validação de telefone e CEP verifica somente preenchimento | Dados incompletos ou inválidos podem ser aceitos; placeholders não aplicam máscaras |
| Média | Finalização não chama validação nativa de data mínima e não compara horário com o instante atual | Não há garantia de rejeição de datas/horários de retirada no passado |
| Média | Data mínima usa `toISOString`, em UTC | Próximo da mudança do dia UTC, o mínimo pode divergir do dia local |
| Média | Frete não é calculado nem incluído no total | Total apresentado corresponde aos produtos após desconto, sem entrega |
| Média | Falhas de leitura da vitrine são registradas apenas no console | Indisponibilidade pode aparecer como catálogo vazio ou configuração padrão |
| Baixa | Seed cria categoria `all` e vitrine também cria “Todos” | Com a carga inicial, o filtro “Todos” é duplicado |
| Baixa | JavaScript adiciona classe `no-scroll`, mas não há regra CSS correspondente | Bloqueio de rolagem da página ao abrir carrinho fica incompleto |
| Baixa | Abas de entrega/retirada não atualizam `aria-selected` | Estado comunicado à tecnologia assistiva diverge da seleção visual |

Preço e desconto manual negativos não são rejeitados explicitamente pela lógica correspondente. Em execução isolada, um desconto manual de -10 produziu desconto calculado de -10, elevando o total de uma venda de 50 para 60. Valores precisam ser finitos e respeitar faixas válidas.

O seed usa `set` em IDs fixos. Reexecutá-lo não duplica esses documentos, mas pode sobrescrever alterações de produtos, categorias e do cupom inicial e renovar datas de criação. O utilitário merece controle operacional.

## 8. Desempenho, experiência e manutenção

A vitrine carrega produtos, categorias, cupons e configurações em sequência antes de concluir a inicialização. Leituras independentes podem ser paralelizadas. Todas as listas são carregadas sem paginação e filtradas em memória, o que limita a evolução para catálogos maiores.

Não há listeners `onSnapshot`: mudanças realizadas em outra sessão não são refletidas automaticamente nas listas já carregadas. Um carrinho aberto também pode manter preço e cupom antigos até a página ser recarregada.

Guardar imagens dentro dos documentos aumenta o volume transferido ao carregar o catálogo. Não há verificação do tamanho final da imagem antes da gravação. Usar armazenamento de arquivos e guardar URLs nos documentos permitiria separar a entrega das imagens da leitura dos dados comerciais.

A interface possui layout responsivo, labels e alguns atributos de acessibilidade. O acionador do carrinho tem `role="button"` e `tabindex`, mas não possui tratamento de Enter/espaço. Não foi identificado controle de foco do carrinho ou seus diálogos. A inspeção visual e a navegação por teclado ainda precisam ser executadas em navegador.

O painel concentra estilos, marcação e lógica em um único arquivo de aproximadamente 78 KB. A configuração Firebase está centralizada, mas os valores padrão da loja estão duplicados entre painel e vitrine. Existe uma inicialização residual baseada em `sessionStorage.admin_ok`, sem código que atribua esse valor; se estiver presente, pode iniciar leituras adicionais antes da restauração da autenticação.

Não foram encontrados arquivos de backup, monitoramento, integração contínua ou configuração de ambientes separados. A ausência no repositório não comprova ausência de recursos configurados externamente. Custos, quotas, domínio, disponibilidade e regras reais precisam ser verificados na infraestrutura; não é possível estimá-los com precisão apenas pelos arquivos.

## 9. Verificações executadas

Foram lidos os arquivos de aplicação, configuração, carga inicial e regras. A sintaxe de `script.js`, `firebase-config.js` e dos scripts incorporados em `admin.html` e `seed-firebase.html` foi verificada com o parser do Node.js, sem erros.

Funções reais do PDV foram extraídas e executadas isoladamente em ambiente JavaScript, com elementos de formulário simulados. Resultados:

- Cupom com validade em 01/01/2020 foi aceito.
- Cupom de 10%, com mínimo de 100, continuou dando desconto de 5 depois de o subtotal cair para 50.
- Desconto manual de -10 foi calculado como -10.

Essas verificações confirmam defeitos de lógica, mas não equivalem a teste completo de navegador ou produção. Não foram testados login real, CRUD contra Firestore, envio efetivo de mensagens, carga concorrente, pagamento ou regras implantadas. As alterações preexistentes em `firebase-config.js`, `index.html` e `style.css` foram preservadas.

## 10. Sequência sugerida de evolução

**Etapa 1 — corrigir segurança e valores:** restringir administradores nas regras, validar documentos e faixas numéricas, corrigir interpolação de HTML, validade/mínimo de cupons no PDV e impedir gravações duplicadas. Validar os cenários com contas autorizadas e não autorizadas em ambiente de teste.

**Etapa 2 — tornar a operação rastreável:** incluir CEP na mensagem, validar retirada no futuro, padronizar datas, trocar a geração vulnerável de IDs, preservar identificadores dos produtos nas vendas e registrar operador. Substituir exclusão definitiva por cancelamento auditável.

**Etapa 3 — integrar o ciclo comercial:** persistir pedidos com número e status, ligar confirmação de pedido à venda, definir tratamento de frete e acrescentar estoque por tamanho/cor se necessário à operação. Formalizar como pagamentos são confirmados.

**Etapa 4 — melhorar manutenção e escala:** separar módulos do painel, centralizar configurações padrão, mover imagens para armazenamento de arquivos, paginar consultas, melhorar mensagens de erro, implementar exportação e estabelecer documentação de implantação e recuperação.

**Etapa 5 — ampliar conforme necessidade:** cadastro de clientes, custos/margens, despesas, conciliação, relatórios por produto e categoria, múltiplos operadores, integrações fiscais e meios de pagamento. Esses recursos não existem na versão analisada e precisam de escopo próprio.

## 11. Parecer

O código apresenta uma base coerente para catálogo com atendimento por WhatsApp e registro manual de vendas. Os recursos existentes não cobrem estoque, pagamento integrado, gestão completa de pedidos ou apuração de lucro. A prioridade é corrigir autorização e integridade dos registros, seguida da conexão entre pedidos e vendas. A prontidão para produção depende de validar a infraestrutura e os fluxos reais, além das correções apontadas.
