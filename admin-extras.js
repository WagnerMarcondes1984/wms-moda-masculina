/* Relatório e recibos usam apenas vendas já carregadas; nenhuma escrita adicional. */
(() => {
    const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let grafico = null;
    let ultimaVenda = null;
    let relatorioPronto = false;
    const dataVenda = venda => venda.criadoEm?.toDate ? venda.criadoEm.toDate() : null;
    function prepararRelatorio(pronto) {
        relatorioPronto = pronto;
        document.getElementById('exportar-csv').disabled = !pronto;
        if (!pronto) {
            if (grafico) { grafico.destroy(); grafico = null; }
            document.getElementById('grafico-status').textContent = 'Carregando relatório…';
        }
    }
    function renderGrafico() {
        if (grafico) { grafico.destroy(); grafico = null; }
        const status = document.getElementById('grafico-status');
        if (!relatorioPronto) return;
        if (typeof Chart === 'undefined') {
            status.textContent = 'O gráfico não carregou. A tabela e a exportação continuam disponíveis.';
            return;
        }
        const mes = document.getElementById('relatorio-mes').value || mesAtualStr();
        const [ano, numeroMes] = mes.split('-').map(Number);
        const dias = new Date(ano, numeroMes, 0).getDate();
        const valores = Array(dias).fill(0);
        vendasRelatorio.forEach(v => {
            const data = dataVenda(v);
            if (data && data.getFullYear() === ano && data.getMonth() === numeroMes - 1) valores[data.getDate() - 1] += Number(v.total || 0);
        });
        status.textContent = vendasRelatorio.length ? 'Faturamento por dia no mês selecionado.' : 'Nenhuma venda registrada neste mês.';
        grafico = new Chart(document.getElementById('relatorio-grafico'), {
            type: 'bar',
            data: { labels: valores.map((_, i) => String(i + 1).padStart(2, '0')), datasets: [{ label: 'Vendas (R$)', data: valores, backgroundColor: '#1565c0', borderRadius: 5 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: item => moeda(item.parsed.y) } } },
                scales: { y: { beginAtZero: true, ticks: { callback: valor => moeda(valor) } }, x: { title: { display: true, text: 'Dia do mês' } } }
            }
        });
    }
    function celulaCSV(valor) {
        let texto = String(valor ?? '');
        // Evita interpretar conteúdo de clientes/produtos como fórmula na planilha.
        if (/^[\s\uFEFF]*[=+@-]/.test(texto) || /^[\t\r\n]/.test(texto)) texto = "'" + texto;
        return '"' + texto.replace(/"/g, '""') + '"';
    }
    function gerarCSV(vendas) {
        const linhas = [['ID', 'Data', 'Hora', 'Cliente', 'Itens', 'Subtotal', 'Desconto', 'Total', 'Pagamento', 'Cupom']];
        vendas.forEach(v => {
            const data = dataVenda(v);
            const pagamentos = Array.isArray(v.pagamentos) ? v.pagamentos.map(p => `${PAG_LABEL[p.forma] || p.forma}: ${moeda(p.valor)}`).join(' + ') : v.pagamento;
            linhas.push([v.docId, data?.toLocaleDateString('pt-BR') || '', data?.toLocaleTimeString('pt-BR') || '', v.cliente || '', (v.itens || []).map(i => `${i.qtd}x ${i.nome}`).join(' | '), Number(v.subtotal || 0).toFixed(2).replace('.', ','), Number(v.desconto || 0).toFixed(2).replace('.', ','), Number(v.total || 0).toFixed(2).replace('.', ','), pagamentos, v.cupom || '']);
        });
        return '\uFEFF' + linhas.map(linha => linha.map(celulaCSV).join(';')).join('\r\n');
    }
    document.getElementById('exportar-csv').addEventListener('click', () => {
        if (!relatorioPronto) return;
        const blob = new Blob([gerarCSV(vendasRelatorio)], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vendas-${document.getElementById('relatorio-mes').value || mesAtualStr()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    function imprimir(venda) {
        if (!venda || !auth.currentUser) { toast('Selecione uma venda registrada para imprimir.', 'err'); return; }
        const recibo = document.getElementById('recibo-impressao');
        recibo.replaceChildren();
        const adicionar = (tag, texto, classe) => {
            const el = document.createElement(tag);
            el.textContent = texto;
            if (classe) el.className = classe;
            recibo.appendChild(el);
        };
        adicionar('h1', document.getElementById('config-nome-loja').value || 'WMS Moda Masculina');
        adicionar('h2', 'Recibo de venda');
        adicionar('p', 'Comprovante simples • não é documento fiscal');
        adicionar('p', `Venda: ${venda.docId || '—'}`);
        adicionar('p', `Data: ${dataVenda(venda)?.toLocaleString('pt-BR') || '—'}`);
        if (venda.cliente) adicionar('p', `Cliente: ${venda.cliente}`);
        adicionar('hr', '');
        (venda.itens || []).forEach(i => {
            adicionar('p', `${i.qtd}x ${i.nome}`);
            adicionar('p', `${moeda(i.preco)} un. — ${moeda(Number(i.preco) * Number(i.qtd))}`, 'recibo-item-valor');
        });
        adicionar('hr', '');
        adicionar('p', `Subtotal: ${moeda(venda.subtotal)}`);
        adicionar('p', `Desconto: ${moeda(venda.desconto)}`);
        adicionar('h2', `Total: ${moeda(venda.total)}`);
        if (Array.isArray(venda.pagamentos)) venda.pagamentos.forEach(p => adicionar('p', `${PAG_LABEL[p.forma] || p.forma}: ${moeda(p.valor)}`));
        else adicionar('p', `Pagamento: ${PAG_LABEL[venda.pagamento] || venda.pagamento || '—'}`);
        if (venda.cupom) adicionar('p', `Cupom: ${venda.cupom}`);
        adicionar('p', 'Obrigado pela preferência!', 'recibo-rodape');
        document.body.classList.add('printing-receipt');
        window.print();
    }
    window.addEventListener('afterprint', () => document.body.classList.remove('printing-receipt'));
    window.imprimirVenda = docId => imprimir([...vendasHoje, ...vendasRelatorio].find(v => v.docId === docId));
    document.getElementById('imprimir-ultima-venda').addEventListener('click', () => imprimir(ultimaVenda));
    document.addEventListener('keydown', e => {
        if (!auth.currentUser || !document.getElementById('tab-pdv').classList.contains('active') || document.querySelector('.modal-overlay.show') || e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
        const acoes = {
            F2: () => document.getElementById('pdv-busca').focus(),
            F4: () => document.getElementById('pdv-cupom-input').focus(),
            F8: () => document.getElementById('pdv-finalizar-btn').click(),
            F9: () => document.getElementById('imprimir-ultima-venda').click()
        };
        if (acoes[e.key]) { e.preventDefault(); acoes[e.key](); }
    });
    window.painelExtras = {
        prepararRelatorio, renderGrafico, gerarCSV,
        falhaRelatorio: () => { document.getElementById('grafico-status').textContent = 'Não foi possível carregar os dados deste mês.'; },
        registrarUltimaVenda: venda => { ultimaVenda = venda; document.getElementById('imprimir-ultima-venda').disabled = false; },
        limparSessao: () => {
            ultimaVenda = null;
            document.getElementById('imprimir-ultima-venda').disabled = true;
            document.body.classList.remove('printing-receipt');
            document.getElementById('recibo-impressao').replaceChildren();
            prepararRelatorio(false);
        }
    };
    document.getElementById('chart-cdn').addEventListener('load', () => {
        if (relatorioPronto) renderGrafico();
    });
})();
