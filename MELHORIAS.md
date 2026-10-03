# Recursos da vitrine e do painel

Implementação em HTML/CSS/JavaScript puro. A integração Firebase foi mantida, sem acrescentar campos, coleções, regras ou escritas aos fluxos existentes.

## Vitrine

- Skeletons aparecem no HTML inicial e permanecem até a consulta dos dados. Falha na consulta de produtos mostra um botão para tentar novamente.
- Imagens dos produtos e do carrinho usam `loading="lazy"` e `decoding="async"`.
- Favoritos são guardados em `localStorage` na chave `ra-favoritos-v1`. O botão Favoritos filtra o catálogo e combina com a busca e categoria existentes. A preferência acompanha outras abas do mesmo navegador. Se o armazenamento estiver bloqueado, funciona apenas na sessão e apresenta um aviso.
- Compartilhar usa Web Share API quando disponível. A alternativa copia o link ou apresenta um campo para copiá-lo. O link leva à vitrine e destaca o produto por `?produto=ID`.
- Modo escuro respeita inicialmente a preferência do dispositivo. O botão permite mudar o tema e salva a escolha em `ra-tema-v1`.
- WhatsApp flutuante utiliza o número e nome da loja já presentes em `configuracoes/geral`. É ocultado enquanto o carrinho está aberto.

## Instalação no celular

`manifest.json` usa ícones PNG de 192 e 512 pixels derivados da imagem de marca existente. Nome e ícones do aplicativo instalado são estáticos e podem ser ajustados nesses arquivos.

O botão Instalar loja aparece quando o navegador fornece o evento de instalação. No iPhone/iPad, a vitrine apresenta a orientação para Compartilhar → Adicionar à Tela de Início. Disponibilidade depende do navegador e de seus critérios de instalação.

Publicar por HTTPS é necessário para a experiência de instalação em produção; localhost permite testes. Abrir o HTML diretamente por `file://` não reproduz a PWA.

O service worker guarda apenas recursos estáticos públicos. Não intercepta consultas ao Firebase nem guarda páginas administrativas. A loja continua precisando de internet para consultar produtos e preços; sem rede, abre uma página de reconexão, evitando apresentar preços antigos como atuais.

Para futuras mudanças na lista de recursos estáticos, atualizar a versão `CACHE` em `sw.js`. Não foi realizada publicação da aplicação.

## Relatório

- Gráfico de barras Chart.js 4.4.8, carregado por CDN, apresenta faturamento por dia do mês selecionado.
- Utiliza somente `vendasRelatorio`, já carregado pela consulta existente.
- Uma nova consulta limpa o gráfico e desabilita a exportação até a resposta. Respostas atrasadas de meses anteriores são ignoradas.
- Se o CDN não carregar, a tabela e o CSV continuam funcionando.
- CSV usa ponto e vírgula, BOM UTF-8, valores decimais com vírgula, aspas escapadas e neutralização de fórmulas em células textuais. Exporta ID, data, hora, cliente, itens, subtotal, desconto, total, pagamento e cupom.

## Recibos e PDV

A opção **Pagar com duas formas** está destacada no PDV e disponível no carrinho da vitrine, para entrega e retirada. Escolha a primeira forma, marque a opção, selecione a segunda e informe seu valor. O restante é calculado automaticamente para a primeira forma. Exemplo: total de R$ 100,00, com R$ 40,00 no crédito e R$ 60,00 no PIX. Os valores aparecem no WhatsApp, no histórico e no recibo. A divisão usa centavos inteiros e bloqueia formas iguais ou parcelas inválidas, mantendo o formato existente de `pagamentos` nas vendas.

O recibo pode ser impresso pelo histórico de vendas do dia, pelo relatório mensal ou pelo botão Imprimir última venda, habilitado após uma venda finalizada nesta sessão. Usa `window.print()` e estilos próprios: imprime somente o recibo, com itens, quantidades, valores, pagamentos e identificação da venda.

O documento é um comprovante simples, sem integração fiscal. A impressão segue a impressora ou destino PDF escolhido no navegador. A seleção de papel deve ser feita no diálogo da impressora.

| Atalho | Ação |
|---|---|
| F2 | Focar a busca de produtos |
| F4 | Focar o campo do cupom |
| F8 | Finalizar a venda atual |
| F9 | Imprimir a última venda da sessão |

Os atalhos funcionam somente com usuário autenticado, na aba PDV e sem modal aberto. Combinações com Ctrl/Alt/Shift/Meta e repetição de tecla são ignoradas. Em alguns teclados, usar Fn junto da tecla de função.

A finalização bloqueia novas tentativas enquanto a gravação está em andamento. A lógica de cálculo e os campos originais da venda permanecem iguais. Problemas anteriores de validade dos cupons e validação financeira, apontados no relatório do sistema, não foram incluídos neste pedido de funcionalidades.

## Validação

Verificação de sintaxe JavaScript e JSON; execução no Chrome com Firebase e autenticação simulados, sem acesso ao banco real. Foram conferidos skeletons, lazy loading, favoritos e tema após recarregar, compartilhamento e link direto, WhatsApp, layout móvel, gráfico com Chart.js real, download CSV, escaping e proteção contra fórmulas, recibo e estilos de impressão, atalhos, bloqueio de gravação simultânea, limpeza do recibo no logout, erro de carregamento e página offline.

A instalação real em Android/iOS, o compartilhamento nativo do aparelho, a impressora física e o login/consultas de produção ainda devem ser conferidos na hospedagem HTTPS.

Referências: [Chart.js — integração](https://www.chartjs.org/docs/latest/getting-started/integration.html), [MDN — instalação de PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [MDN — Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API).
