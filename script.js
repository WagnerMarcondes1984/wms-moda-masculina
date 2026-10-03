// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
// firebaseConfig é carregado de ./firebase-config.js
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (erro) { console.error("Não foi possível iniciar a conexão:", erro); }
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    // --- SELETORES GLOBAIS ---
    const cartIcon = document.querySelector(".cart-icon"),
        cartSidebar = document.querySelector(".cart-sidebar"),
        cartOverlay = document.querySelector(".cart-overlay"),
        closeCartBtn = document.querySelector(".close-cart-btn"),
        cartBody = document.querySelector(".cart-body"),
        cartBadge = document.querySelector(".cart-badge");
    const deliveryToggleBtns = document.querySelectorAll(".delivery-btn");
    const deliveryForm = document.getElementById("delivery-form-container"),
        pickupForm = document.getElementById("pickup-form-container");
    const trocoContainer = document.getElementById("troco-container");
    const couponInput = document.getElementById("coupon-input"),
        applyCouponBtn = document.getElementById("apply-coupon-btn"),
        couponFeedback = document.getElementById("coupon-feedback");
    const subtotalElem = document.getElementById("cart-subtotal"),
        cartDiscountElem = document.getElementById("cart-discount"),
        discountLineElem = document.querySelector(".discount-line"),
        totalElem = document.getElementById("cart-total");
    const finishOrderBtn = document.getElementById("finish-order-btn");
    // Seletores da barra inferior
    const viewCartBanner = document.querySelector(".view-cart-banner");
    const bannerTotalElem = document.getElementById("banner-total");
    const viewCartBannerBtn = document.querySelector(".view-cart-banner-btn");

    // Seletores para o sistema de filtro
    const categoriesBar = document.getElementById("categories-bar");
    const searchInput = document.querySelector(".search-input");

    // --- CARREGAR PRODUTOS DO FIREBASE ---
    let produtos = [];
    let erroProdutos = false;
    try {
        const snap = await db.collection("produtos")
            .where("ativo", "!=", false)
            .get();
        produtos = snap.docs.map(d => ({ ...d.data() }));
    } catch (e) {
        erroProdutos = true;
        console.error("Erro ao carregar produtos do Firebase:", e);
    }

    // --- CARREGAR CATEGORIAS DO FIREBASE ---
    let categorias = [];
    try {
        const catSnap = await db.collection("categorias").get();
        categorias = catSnap.docs.map(d => ({ ...d.data() }));
    } catch (e) {
        console.error("Erro ao carregar categorias do Firebase:", e);
    }

    const renderizarCategoriasBar = () => {
        const botoesExtra = categorias
            .map(
                (c) => `
                    <button class="category-btn" data-category="${c.id}">
                        <i class="fa-solid ${c.icone || 'fa-tag'}"></i> ${c.nome}
                    </button>
                `,
            )
            .join("");
        categoriesBar.innerHTML = `
            <button class="category-btn active" data-category="all">
                <i class="fa-solid fa-border-all"></i> Todos
            </button>
            ${botoesExtra}
        `;
    };
    renderizarCategoriasBar();

    // --- CARREGAR CUPONS DO FIREBASE ---
    let coupons = [];
    try {
        const cuponsSnap = await db.collection("cupons").get();
        coupons = cuponsSnap.docs.map((d) => ({ docId: d.id, ...d.data() }));
    } catch (e) {
        console.error("Erro ao carregar cupons do Firebase:", e);
    }

    // --- CARREGAR CONFIGURAÇÕES DA LOJA DO FIREBASE ---
    const CONFIG_PADRAO = {
        nomeLoja: "WMS Moda Masculina",
        whatsapp: "558182362638",
        retiradaDias: [0, 1, 2, 3, 4, 5, 6],
        retiradaHoraInicio: "08:00",
        retiradaHoraFim: "18:00",
        retiradaIntervalo: 60,
        bannerUrl: "",
        corPrimaria: "#0EA5A6",
        corSecundaria: "#0F172A",
        corDestaque: "#C5A049",
    };
    let configLoja = { ...CONFIG_PADRAO };
    try {
        const configDoc = await db.collection("configuracoes").doc("geral").get();
        if (configDoc.exists) configLoja = { ...CONFIG_PADRAO, ...configDoc.data() };
    } catch (e) {
        console.error("Erro ao carregar configurações da loja:", e);
    }

    const aplicarConfiguracoesDaLoja = () => {
        document.title = configLoja.nomeLoja;

        const headerEl = document.querySelector("header");
        if (headerEl && configLoja.bannerUrl) {
            headerEl.style.backgroundImage = `url("${configLoja.bannerUrl}")`;
            headerEl.classList.add("header--banner");
        }

        const root = document.documentElement;
        if (configLoja.corPrimaria) root.style.setProperty("--primary-color", configLoja.corPrimaria);
        if (configLoja.corSecundaria) root.style.setProperty("--secondary-color", configLoja.corSecundaria);
        if (configLoja.corDestaque) root.style.setProperty("--accent-color", configLoja.corDestaque);

        const logoTitleEl = document.querySelector(".logo h1");
        if (logoTitleEl) logoTitleEl.textContent = configLoja.nomeLoja;

        const footerEl = document.querySelector("footer p");
        if (footerEl) {
            const ano = new Date().getFullYear();
            footerEl.textContent = `${ano} - ${configLoja.nomeLoja}. Todos os direitos reservados`;
        }

        const pickupDateInput = document.getElementById("pickup-date");
        if (pickupDateInput) {
            const hoje = new Date();
            pickupDateInput.min = hoje.toISOString().split("T")[0];
        }

        const pickupTimeSelect = document.getElementById("pickup-time");
        if (pickupTimeSelect) {
            const [hIni, mIni] = configLoja.retiradaHoraInicio.split(":").map(Number);
            const [hFim, mFim] = configLoja.retiradaHoraFim.split(":").map(Number);
            const inicioMin = hIni * 60 + mIni;
            const fimMin = hFim * 60 + mFim;
            const passo = configLoja.retiradaIntervalo || 60;
            let opcoes = `<option value="" disabled selected>Selecione</option>`;
            for (let m = inicioMin; m <= fimMin; m += passo) {
                const h = String(Math.floor(m / 60)).padStart(2, "0");
                const min = String(m % 60).padStart(2, "0");
                opcoes += `<option value="${h}:${min}">${h}:${min}</option>`;
            }
            pickupTimeSelect.innerHTML = opcoes;
        }
    };
    aplicarConfiguracoesDaLoja();
    window.lojaUI.configurar(configLoja);
    window.lojaUI.registrarProdutos(produtos);

    // --- ESTADO DA APLICAÇÃO ---
    let carrinho = [],
        tipoEntrega = "delivery",
        appliedCoupon = null;

    // Variáveis de estado para filtros
    let categoriaAtiva = "all";
    let termoBusca = "";

    const formatarMoeda = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const getScrollbarWidth = () =>
        window.innerWidth - document.documentElement.clientWidth;
    const lockScroll = () => {
        document.body.style.paddingRight = `${getScrollbarWidth()}px`;
        document.body.classList.add("no-scroll");
    };
    const unlockScroll = () => {
        document.body.style.paddingRight = "";
        document.body.classList.remove("no-scroll");
    };
    const abrirCarrinho = () => {
        cartSidebar.classList.add("show");
        cartOverlay.classList.add("show");
        lockScroll();
    };
    const fecharCarrinho = () => {
        cartSidebar.classList.remove("show");
        cartOverlay.classList.remove("show");
        unlockScroll();
    };

    const animacaoVoarParaCarrinho = (productCard) => {
        const productImg = productCard.querySelector(".product-img"),
            imgRect = productImg.getBoundingClientRect(),
            cartRect = cartIcon.getBoundingClientRect(),
            flyingImg = document.createElement("img");
        flyingImg.src = productImg.src;
        flyingImg.classList.add("product-image-fly");
        flyingImg.style.left = `${imgRect.left}px`;
        flyingImg.style.top = `${imgRect.top}px`;
        flyingImg.style.width = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;
        document.body.appendChild(flyingImg);
        requestAnimationFrame(() => {
            flyingImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
            flyingImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
            flyingImg.style.width = "0px";
            flyingImg.style.height = "0px";
            flyingImg.style.opacity = "0";
        });
        flyingImg.addEventListener("transitionend", () => flyingImg.remove());
    };

    const escaparHTML = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
    // Função para filtrar e mostrar produtos
    const filtrarEMostrarProdutos = () => {
        let produtosFiltrados = produtos;

        // Filtro por categoria
        if (categoriaAtiva !== "all") {
            produtosFiltrados = produtosFiltrados.filter(
                (produto) => produto.categoria === categoriaAtiva,
            );
        }

        // Filtro por busca
        if (termoBusca.trim() !== "") {
            const termo = termoBusca.toLowerCase();
            produtosFiltrados = produtosFiltrados.filter(
                (produto) =>
                    produto.nome.toLowerCase().includes(termo) ||
                    (produto.descricao || "").toLowerCase().includes(termo),
            );
        }

        if (window.lojaUI.somenteFavoritos()) {
            produtosFiltrados = produtosFiltrados.filter(p => window.lojaUI.favorito(p.id));
        }
        // Renderizar produtos filtrados
        const container = document.querySelector(".products-container");
        container.setAttribute('aria-busy', 'false');
        document.getElementById('catalog-status').textContent = erroProdutos ? 'Não foi possível carregar os produtos.' : `${produtosFiltrados.length} produto${produtosFiltrados.length === 1 ? '' : 's'}${window.lojaUI.somenteFavoritos() ? ' nos favoritos' : ''}`;
        if (erroProdutos) {
            container.innerHTML = '<div class="catalog-empty"><p>Não foi possível conectar ao catálogo.</p><button class="product-button" id="retry-catalog">Tentar novamente</button></div>';
            document.getElementById('retry-catalog').onclick = () => location.reload();
            return;
        }
        if (produtosFiltrados.length === 0) {
            container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #999;">
                            <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p style="font-size: 1.2rem; font-weight: 600;">${window.lojaUI.somenteFavoritos() ? "Nenhum favorito encontrado. Marque o coração dos produtos que você gostar." : "Nenhum produto encontrado"}</p>
                        </div>
                    `;
        } else {
            container.innerHTML = produtosFiltrados
                .map(
                    (p) => `
                        <div class="product-card" data-id="${escaparHTML(p.id)}" id="produto-${escaparHTML(p.id)}">
                            <img class="product-img" src="${escaparHTML(p.imagem)}" alt="${escaparHTML(p.nome)}" loading="lazy" decoding="async">
                            <div class="product-actions">
                                <button class="icon-action" data-favorito="${escaparHTML(p.id)}" aria-label="Adicionar aos favoritos" aria-pressed="false"><i class="fa-regular fa-heart" aria-hidden="true"></i></button>
                                <button class="icon-action" data-compartilhar="${escaparHTML(p.id)}" aria-label="Compartilhar ${escaparHTML(p.nome)}"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button>
                            </div>
                            <div class="product-info">
                                <h3 class="product-name">${escaparHTML(p.nome)}</h3>
                                <p class="product-description">${escaparHTML(p.descricao)}</p>
                                <p class="product-price">${formatarMoeda(p.preco)}</p>
                                <button class="product-button">Comprar</button>
                            </div>
                        </div>
                    `,
                )
                .join("");
        }
        window.lojaUI.atualizarFavoritos();
    };

    document.addEventListener("favoritos-changed", filtrarEMostrarProdutos);
    const adicionarAoCarrinho = (produtoId, productCard) => {
        if (productCard) animacaoVoarParaCarrinho(productCard);
        const produto = produtos.find((p) => p.id === produtoId);
        if (!produto) return;

        const itemNoCarrinho = carrinho.find((item) => item.id === produtoId);
        if (itemNoCarrinho) itemNoCarrinho.quantidade++;
        else carrinho.push({ ...produto, quantidade: 1 });
        atualizarCarrinho();
    };

    const alterarQuantidade = (produtoId, acao) => {
        const item = carrinho.find((i) => i.id === produtoId);
        if (!item) return;
        if (acao === "aumentar") item.quantidade++;
        else if (acao === "diminuir") {
            item.quantidade--;
            if (item.quantidade <= 0)
                carrinho = carrinho.filter((i) => i.id !== produtoId);
        }
        atualizarCarrinho();
    };

    const obterPagamentos = total => dividirPagamento(total,
        document.querySelector('input[name="payment"]:checked').value,
        document.getElementById('payment-split').checked,
        document.getElementById('payment-second').value,
        document.getElementById('payment-second-amount').value);
    const atualizarPagamento = () => {
        const dividir = document.getElementById('payment-split').checked;
        document.getElementById('payment-split-area').hidden = !dividir;
        document.getElementById('payment-split').setAttribute('aria-expanded', String(dividir));
        const subtotal = carrinho.reduce((s, item) => s + item.preco * item.quantidade, 0);
        const resultado = obterPagamentos(subtotal - calcularDesconto(subtotal));
        document.getElementById('payment-split-feedback').textContent = dividir ? resultado.erro : '';
        document.getElementById('payment-second-amount').setAttribute('aria-invalid', String(dividir && !!resultado.erro));
        const resumo = document.getElementById('payment-split-summary');
        resumo.replaceChildren();
        if (dividir && !resultado.erro) resultado.pagamentos.forEach(p => {
            const linha = document.createElement('p');
            linha.textContent = `${p.forma}: ${formatarMoeda(p.valor)}`;
            resumo.appendChild(linha);
        });
        const primeira = document.querySelector('input[name="payment"]:checked').value;
        const segunda = document.getElementById('payment-second').value;
        trocoContainer.style.display = primeira === 'Dinheiro' || (dividir && segunda === 'Dinheiro') ? 'block' : 'none';
    };

    const atualizarCarrinho = () => {
        if (carrinho.length === 0) {
            cartBody.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-box-open"></i><p>Seu carrinho está vazio.</p></div>`;
        } else {
            cartBody.innerHTML = carrinho
                .map(
                    (item) =>
                        `<div class="cart-item" data-id="${item.id}">
                            <img src="${escaparHTML(item.imagem)}" alt="${escaparHTML(item.nome)}" class="cart-item-img" loading="lazy" decoding="async">
                            <div class="cart-item-info">
                                <h4 class="cart-item-name">${item.nome}</h4>
                                <p class="cart-item-price">${formatarMoeda(item.preco)}</p>
                                <div class="cart-item-controls">
                                    <button class="quantity-btn" data-action="diminuir">-</button>
                                    <span class="quantity">${item.quantidade}</span>
                                    <button class="quantity-btn" data-action="aumentar">+</button>
                                </div>
                            </div>
                            <button class="remove-item-btn">&times;</button>
                        </div>`,
                )
                .join("");
        }
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );

        if (
            appliedCoupon &&
            appliedCoupon.valorMinimo &&
            subtotal < appliedCoupon.valorMinimo
        ) {
            appliedCoupon = null;
            couponFeedback.textContent =
                "Cupom removido: o pedido não atinge mais o valor mínimo exigido.";
            couponFeedback.classList.remove("success");
            couponFeedback.classList.add("error");
        }

        const discountAmount = calcularDesconto(subtotal);
        const total = subtotal - discountAmount;
        subtotalElem.textContent = formatarMoeda(subtotal);
        if (discountAmount > 0) {
            cartDiscountElem.textContent = `- ${formatarMoeda(discountAmount)}`;
            discountLineElem.style.display = "flex";
        } else {
            discountLineElem.style.display = "none";
        }
        totalElem.textContent = formatarMoeda(total);
        cartBadge.textContent = carrinho.reduce(
            (acc, item) => acc + item.quantidade,
            0,
        );
        finishOrderBtn.disabled = carrinho.length === 0;
        atualizarPagamento();

        if (carrinho.length > 0 && window.innerWidth <= 768) {
            bannerTotalElem.textContent = formatarMoeda(total);
            viewCartBanner.classList.add("show");
        } else {
            viewCartBanner.classList.remove("show");
        }
    };

    const calcularDesconto = (subtotal) => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.tipo === "fixo")
            return Math.min(appliedCoupon.valor, subtotal);
        return subtotal * (appliedCoupon.valor / 100);
    };

    const applyCoupon = () => {
        const code = couponInput.value.trim().toUpperCase();
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );
        const foundCoupon = coupons.find((c) => c.codigo === code);
        couponFeedback.classList.remove("success", "error");

        if (!foundCoupon) {
            appliedCoupon = null;
            couponFeedback.textContent = "Cupom inválido.";
            couponFeedback.classList.add("error");
        } else if (foundCoupon.ativo === false) {
            appliedCoupon = null;
            couponFeedback.textContent = "Este cupom não está mais disponível.";
            couponFeedback.classList.add("error");
        } else if (
            foundCoupon.validade &&
            new Date(`${foundCoupon.validade}T23:59:59`) < new Date()
        ) {
            appliedCoupon = null;
            couponFeedback.textContent = "Este cupom expirou.";
            couponFeedback.classList.add("error");
        } else if (
            foundCoupon.valorMinimo &&
            subtotal < foundCoupon.valorMinimo
        ) {
            appliedCoupon = null;
            couponFeedback.textContent = `Pedido mínimo de ${formatarMoeda(
                foundCoupon.valorMinimo,
            )} para usar este cupom.`;
            couponFeedback.classList.add("error");
        } else {
            appliedCoupon = foundCoupon;
            couponFeedback.textContent = "Cupom aplicado!";
            couponFeedback.classList.add("success");
        }
        atualizarCarrinho();
    };

    const finalizarPedido = () => {
        let valid = true;
        let fieldsToValidate = [];

        if (tipoEntrega === "delivery") {
            fieldsToValidate = [
                "delivery-name",
                "delivery-phone",
                "delivery-cep",
                "delivery-address",
            ];
        } else {
            fieldsToValidate = ["pickup-name", "pickup-date", "pickup-time"];
        }

        if (tipoEntrega === "pickup") {
            const dataInput = document.getElementById("pickup-date");
            if (dataInput.value) {
                const [ano, mes, dia] = dataInput.value.split("-").map(Number);
                const diaSemana = new Date(ano, mes - 1, dia).getDay();
                if (!configLoja.retiradaDias.includes(diaSemana)) {
                    dataInput.classList.add("error");
                    alert("A loja não realiza retiradas no dia selecionado. Escolha outra data.");
                    return;
                }
            }
        }

        fieldsToValidate.forEach((id) => {
            const el = document.getElementById(id);
            let isFieldValid = el.value.trim() !== "";

            if (id.includes("name") && isFieldValid) {
                if (
                    el.value
                        .trim()
                        .split(" ")
                        .filter((word) => word).length < 2
                ) {
                    isFieldValid = false;
                }
            }

            if (!isFieldValid) {
                el.classList.add("error");
                valid = false;
            } else {
                el.classList.remove("error");
            }
        });

        if (!valid) {
            alert(
                "Por favor, preencha todos os campos obrigatórios marcados em vermelho.",
            );
            return;
        }

        const numeroWhatsApp = configLoja.whatsapp;
        const itensPedido = carrinho
            .map((item) => `  - ${item.quantidade}x ${item.nome}`)
            .join("\n");
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );
        const discountAmount = calcularDesconto(subtotal);
        let cupomInfo = "";
        if (appliedCoupon) {
            cupomInfo = `\n*Cupom Aplicado:* ${appliedCoupon.codigo} (${formatarMoeda(
                discountAmount,
            )})`;
        }
        const total = subtotal - discountAmount;
        let mensagem = `*-- NOVO PEDIDO ${configLoja.nomeLoja} --*\n\n*Itens:*\n${itensPedido}\n\n*Subtotal:* ${formatarMoeda(
            subtotal,
        )}${cupomInfo}\n*Total:* ${formatarMoeda(
            total,
        )}\n\n-------------------------\n\n`;

        if (tipoEntrega === "delivery") {
            const nome = document.getElementById("delivery-name").value;
            const phone = document.getElementById("delivery-phone").value;
            const address = document.getElementById("delivery-address").value;

            mensagem += `*Tipo de Pedido:* Entrega\n\n*Nome:* ${nome}\n*Telefone:* ${phone}\n*Endereço:* ${address}`;
        } else {
            const nome = document.getElementById("pickup-name").value;
            const dataInput = document.getElementById("pickup-date").value;
            const hora = document.getElementById("pickup-time").value;
            const [year, month, day] = dataInput.split("-");
            const dataFormatada = `${day}/${month}/${year}`;

            mensagem += `*Tipo de Pedido:* Retirada\n\n*Nome para Retirada:* ${nome}\n*Data Agendada:* ${dataFormatada}\n*Hora Agendada:* ${hora}`;
        }

        const resultadoPagamento = obterPagamentos(total);
        if (resultadoPagamento.erro) {
            atualizarPagamento();
            document.getElementById('payment-second-amount').focus();
            alert(resultadoPagamento.erro);
            return;
        }
        const pagamentos = resultadoPagamento.pagamentos;
        let paymentInfo = pagamentos.length === 2
            ? `*Pagamento em duas formas:*\n${pagamentos.map(p => `- ${p.forma}: ${formatarMoeda(p.valor)}`).join('\n')}`
            : `*Forma de Pagamento:* ${pagamentos[0].forma}`;
        if (pagamentos.some(p => p.forma === 'Dinheiro')) {
            const troco = document.getElementById('troco-para').value;
            paymentInfo += troco ? `\n*Troco para:* ${formatarMoeda(Number(troco))}` : '\n*Troco:* Não precisa de troco';
        }
        mensagem += `\n\n${paymentInfo}`;
        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, "_blank");
    };

    // --- EVENT LISTENERS ---
    cartIcon.addEventListener("click", abrirCarrinho);
    cartIcon.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirCarrinho(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharCarrinho(); });
    closeCartBtn.addEventListener("click", fecharCarrinho);
    cartOverlay.addEventListener("click", fecharCarrinho);
    applyCouponBtn.addEventListener("click", applyCoupon);
    finishOrderBtn.addEventListener("click", finalizarPedido);
    viewCartBannerBtn.addEventListener("click", abrirCarrinho);

    // Event listener para botões de categoria (delegação, pois são renderizados dinamicamente)
    categoriesBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".category-btn");
        if (!btn) return;
        // Remove classe active de todos os botões
        categoriesBar
            .querySelectorAll(".category-btn")
            .forEach((b) => b.classList.remove("active"));
        // Adiciona classe active no botão clicado
        btn.classList.add("active");
        // Atualiza categoria ativa
        categoriaAtiva = btn.dataset.category;
        // Filtra e mostra produtos
        filtrarEMostrarProdutos();
    });

    // Event listener para campo de busca
    searchInput.addEventListener("input", (e) => {
        termoBusca = e.target.value;
        filtrarEMostrarProdutos();
    });

    document
        .querySelector(".products-container")
        .addEventListener("click", (e) => {
            if (e.target.matches(".product-button")) {
                const productCard = e.target.closest(".product-card");
                adicionarAoCarrinho(
                    Number.parseInt(productCard.dataset.id),
                    productCard,
                );
            }
        });
    cartBody.addEventListener("click", (e) => {
        const cartItem = e.target.closest(".cart-item");
        if (cartItem) {
            const produtoId = Number.parseInt(cartItem.dataset.id);
            if (e.target.matches(".quantity-btn"))
                alterarQuantidade(produtoId, e.target.dataset.action);
            if (e.target.matches(".remove-item-btn")) {
                carrinho = carrinho.filter((i) => i.id !== produtoId);
                atualizarCarrinho();
            }
        }
    });

    deliveryToggleBtns.forEach((btn) =>
        btn.addEventListener("click", () => {
            deliveryToggleBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            tipoEntrega = btn.dataset.option;
            if (tipoEntrega === "delivery") {
                deliveryForm.style.display = "block";
                pickupForm.style.display = "none";
            } else {
                deliveryForm.style.display = "none";
                pickupForm.style.display = "block";
            }
        }),
    );

    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
            atualizarPagamento();
            document
                .querySelectorAll(".payment-option")
                .forEach((label) => label.classList.remove("selected"));
            e.target.closest(".payment-option").classList.add("selected");
        });
    });

    document.getElementById('payment-split').addEventListener('change', atualizarPagamento);
    document.getElementById('payment-second').addEventListener('change', atualizarPagamento);
    document.getElementById('payment-second-amount').addEventListener('input', atualizarPagamento);

    // Remove o erro ao digitar
    document
        .querySelectorAll(
            "#delivery-form-container input[required], #pickup-form-container input[required], #pickup-form-container select[required]",
        )
        .forEach((input) => {
            input.addEventListener("input", () => {
                if (input.value.trim() !== "") input.classList.remove("error");
            });
        });

    // --- INICIALIZAÇÃO ---
    filtrarEMostrarProdutos();
    atualizarCarrinho();
    const compartilhado = new URLSearchParams(location.search).get('produto');
    if (compartilhado) {
        const card = document.getElementById(`produto-${compartilhado}`);
        if (card) {
            card.classList.add('shared-product');
            card.scrollIntoView({ block: 'center' });
        } else if (!erroProdutos) window.lojaUI.notificar('Este produto não está disponível no catálogo.');
    }
});
