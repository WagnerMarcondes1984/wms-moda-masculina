/* Valores em centavos para que as duas parcelas somem exatamente o total. */
window.dividirPagamento = (total, forma1, dividir, forma2, valor2) => {
    const totalCentavos = Math.round(Number(total) * 100);
    if (!Number.isFinite(totalCentavos) || totalCentavos < 0) return { erro: 'O total do pedido é inválido.', pagamentos: [] };
    if (!dividir) return { erro: '', pagamentos: [{ forma: forma1, valor: totalCentavos / 100 }] };
    if (!forma1 || !forma2 || forma1 === forma2) return { erro: 'Escolha duas formas de pagamento diferentes.', pagamentos: [] };
    const segundaParcela = Math.round(Number(valor2) * 100);
    if (!Number.isFinite(segundaParcela) || segundaParcela <= 0 || segundaParcela >= totalCentavos) {
        return { erro: 'Informe um valor para a segunda forma maior que zero e menor que o total.', pagamentos: [] };
    }
    return { erro: '', pagamentos: [{ forma: forma1, valor: (totalCentavos - segundaParcela) / 100 }, { forma: forma2, valor: segundaParcela / 100 }] };
};
