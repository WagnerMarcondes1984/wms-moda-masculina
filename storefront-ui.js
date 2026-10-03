/* Recursos da vitrine: preferências locais, compartilhamento e instalação. */
(() => {
    const FAVORITOS = 'ra-favoritos-v1';
    const TEMA = 'ra-tema-v1';
    const ler = (chave) => { try { return localStorage.getItem(chave); } catch { return null; } };
    const salvar = (chave, valor) => { try { localStorage.setItem(chave, valor); return true; } catch { return false; } };
    const lerFavoritos = () => {
        try {
            const dados = JSON.parse(ler(FAVORITOS) || '[]');
            return new Set(Array.isArray(dados) ? dados.filter(id => typeof id === 'number' || typeof id === 'string').map(String) : []);
        } catch { return new Set(); }
    };
    let favoritos = lerFavoritos();
    let produtos = [];
    let somenteFavoritos = false;
    let instalacao = null;
    const aviso = document.getElementById('loja-aviso');
    let avisoTimer;
    const notificar = (mensagem) => {
        aviso.textContent = mensagem;
        aviso.classList.add('show');
        clearTimeout(avisoTimer);
        avisoTimer = setTimeout(() => aviso.classList.remove('show'), 4500);
    };
    function atualizarFavoritos() {
        document.getElementById('favoritos-total').textContent = favoritos.size;
        document.getElementById('favoritos-toggle').setAttribute('aria-pressed', String(somenteFavoritos));
        document.querySelectorAll('[data-favorito]').forEach(btn => {
            const marcado = favoritos.has(btn.dataset.favorito);
            btn.setAttribute('aria-pressed', String(marcado));
            btn.setAttribute('aria-label', marcado ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
            btn.classList.toggle('is-favorite', marcado);
            btn.querySelector('i').className = marcado ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        });
    }
    const mediaTema = matchMedia('(prefers-color-scheme: dark)');
    function aplicarTema(tema) {
        document.documentElement.dataset.theme = tema;
        const escuro = tema === 'dark';
        const btn = document.getElementById('tema-toggle');
        btn.setAttribute('aria-pressed', String(escuro));
        btn.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
        btn.innerHTML = `<i class="fa-solid ${escuro ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i>`;
    }
    aplicarTema(ler(TEMA) || (mediaTema.matches ? 'dark' : 'light'));
    document.getElementById('tema-toggle').addEventListener('click', () => {
        const tema = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        aplicarTema(tema);
        if (!salvar(TEMA, tema)) notificar('Seu navegador não permitiu salvar a preferência de tema.');
    });
    mediaTema.addEventListener('change', e => { if (!ler(TEMA)) aplicarTema(e.matches ? 'dark' : 'light'); });
    document.getElementById('favoritos-toggle').addEventListener('click', () => {
        somenteFavoritos = !somenteFavoritos;
        atualizarFavoritos();
        document.dispatchEvent(new Event('favoritos-changed'));
    });
    async function compartilhar(produto) {
        const url = new URL('index.html', location.href);
        url.searchParams.set('produto', produto.id);
        const dados = { title: produto.nome, text: `Confira ${produto.nome} na ${document.title}`, url: url.href };
        if (navigator.share) {
            try { await navigator.share(dados); return; }
            catch (erro) { if (erro.name === 'AbortError') return; }
        }
        try {
            await navigator.clipboard.writeText(url.href);
            notificar('Link do produto copiado!');
        } catch { window.prompt('Copie o link para compartilhar este produto:', url.href); }
    }
    document.querySelector('.products-container').addEventListener('click', e => {
        const favorito = e.target.closest('[data-favorito]');
        if (favorito) {
            const id = favorito.dataset.favorito;
            if (favoritos.has(id)) favoritos.delete(id); else favoritos.add(id);
            if (!salvar(FAVORITOS, JSON.stringify([...favoritos]))) notificar('Favorito marcado nesta sessão. O navegador não permitiu salvá-lo.');
            atualizarFavoritos();
            document.dispatchEvent(new Event('favoritos-changed'));
        }
        const share = e.target.closest('[data-compartilhar]');
        if (share) {
            const produto = produtos.find(p => String(p.id) === share.dataset.compartilhar);
            if (produto) compartilhar(produto);
        }
    });
    window.addEventListener('storage', e => {
        if (e.key === FAVORITOS || e.key === null) {
            favoritos = lerFavoritos();
            atualizarFavoritos();
            document.dispatchEvent(new Event('favoritos-changed'));
        }
        if (e.key === TEMA || e.key === null) aplicarTema(ler(TEMA) || (mediaTema.matches ? 'dark' : 'light'));
    });
    const instalarBtn = document.getElementById('instalar-loja');
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        instalacao = e;
        instalarBtn.hidden = false;
    });
    instalarBtn.addEventListener('click', async () => {
        if (!instalacao) return;
        const evento = instalacao;
        instalacao = null;
        instalarBtn.hidden = true;
        try { await evento.prompt(); await evento.userChoice; }
        catch { notificar('Abra o menu do navegador para instalar a loja.'); }
    });
    window.addEventListener('appinstalled', () => { instalarBtn.hidden = true; instalacao = null; });
    if ('serviceWorker' in navigator && window.isSecureContext) {
        window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {
            notificar('Não foi possível preparar a instalação. Você pode continuar usando a loja.');
        }));
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios && !matchMedia('(display-mode: standalone)').matches && !navigator.standalone) {
        document.getElementById('instalar-ios').hidden = false;
    }
    window.lojaUI = {
        notificar,
        somenteFavoritos: () => somenteFavoritos,
        favorito: id => favoritos.has(String(id)),
        atualizarFavoritos,
        registrarProdutos: lista => { produtos = lista; },
        configurar: config => {
            const numero = String(config.whatsapp || '').replace(/\D/g, '');
            const btn = document.getElementById('whatsapp-duvidas');
            btn.href = `https://wa.me/${numero}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre os produtos da ${config.nomeLoja}.`)}`;
            btn.hidden = !numero;
        }
    };
    atualizarFavoritos();
})();
