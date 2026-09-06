// ============================================================
// ESTADO
// ============================================================

let products = [];

let cart = JSON.parse(
    localStorage.getItem("store_cart") || "[]"
);


// ============================================================
// ELEMENTOS
// ============================================================

const productsGrid =
    document.getElementById("productsGrid");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const cartCounter =
    document.getElementById("cartCounter");

const cartOverlay =
    document.getElementById("cartOverlay");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const toast =
    document.getElementById("toast");


// ============================================================
// FORMATO DE PRECIO
// ============================================================

function formatPrice(value) {

    return new Intl.NumberFormat(
        STORE_CONFIG.locale,
        {
            style: "currency",
            currency: STORE_CONFIG.currency
        }
    ).format(Number(value) || 0);

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


// ============================================================
// CARGAR PRODUCTOS
// ============================================================

async function loadProducts() {

    productsGrid.innerHTML = `
        <div class="loading">
            Cargando productos...
        </div>
    `;

    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select("*")
        .eq("active", true)
        .order("featured", {
            ascending: false
        })
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        productsGrid.innerHTML = `
            <div class="empty-state">
                <h3>No se pudieron cargar los productos</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        return;
    }

    products = data || [];

    populateCategories();

    renderProducts();

}


// ============================================================
// CATEGORÍAS
// ============================================================

function populateCategories() {

    const categories = [
        ...new Set(
            products
                .map(product => product.category)
                .filter(Boolean)
        )
    ];

    categoryFilter.innerHTML = `
        <option value="">
            Todas las categorías
        </option>
    `;

    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categoryFilter.appendChild(option);

    });

}


// ============================================================
// RENDER PRODUCTOS
// ============================================================

function renderProducts() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const category =
        categoryFilter.value;

    const filtered =
        products.filter(product => {

            const matchesSearch =
                !search ||
                product.name
                    ?.toLowerCase()
                    .includes(search) ||
                product.product_code
                    ?.toLowerCase()
                    .includes(search) ||
                product.description
                    ?.toLowerCase()
                    .includes(search);

            const matchesCategory =
                !category ||
                product.category === category;

            return (
                matchesSearch &&
                matchesCategory
            );

        });


    if (!filtered.length) {

        productsGrid.innerHTML = `
            <div class="empty-state">
                <h3>No encontramos productos</h3>
                <p>Probá con otra búsqueda.</p>
            </div>
        `;

        return;
    }


    productsGrid.innerHTML =
        filtered.map(product =>
            createProductCard(product)
        ).join("");

}


// ============================================================
// CARD PRODUCTO
// ============================================================

function createProductCard(product) {

    const sizes =
        Array.isArray(product.sizes)
            ? product.sizes
            : [];

    const image =
        product.image_url ||
        "https://placehold.co/700x700?text=Sin+imagen";


    const sizeHTML =
        sizes.length
            ? `
                <select
                    class="size-select"
                    data-size-for="${product.id}"
                >
                    <option value="">
                        Seleccionar talle
                    </option>

                    ${sizes.map(size => `
                        <option value="${escapeHTML(size)}">
                            Talle ${escapeHTML(size)}
                        </option>
                    `).join("")}
                </select>
            `
            : "";


    return `
        <article
            class="product-card"
            data-product-id="${product.id}"
        >

            <div class="product-image">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                    onerror="
                        this.src='https://placehold.co/700x700?text=Sin+imagen'
                    "
                >

                ${
                    product.featured
                        ? `
                            <span class="product-featured">
                                DESTACADO
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="product-info">

                <div class="product-code">
                    Código: ${escapeHTML(product.product_code)}
                </div>

                ${
                    product.category
                        ? `
                            <div class="product-category">
                                ${escapeHTML(product.category)}
                            </div>
                        `
                        : ""
                }


                <h3 class="product-name">
                    ${escapeHTML(product.name)}
                </h3>


                <p class="product-description">
                    ${escapeHTML(
                        product.description || ""
                    )}
                </p>


                <div class="product-price">

                    <strong class="current-price">
                        ${formatPrice(product.price)}
                    </strong>

                    ${
                        product.old_price
                            ? `
                                <span class="old-price">
                                    ${formatPrice(product.old_price)}
                                </span>
                            `
                            : ""
                    }

                </div>


                ${sizeHTML}


                <button
                    class="btn btn-primary btn-full add-cart-btn"
                    data-id="${product.id}"
                    type="button"
                >
                    Agregar al carrito
                </button>


                <button
                    class="btn btn-outline btn-full direct-buy-btn"
                    data-id="${product.id}"
                    type="button"
                    style="margin-top:8px"
                >
                    Comprar ahora
                </button>

            </div>

        </article>
    `;

}


// ============================================================
// EVENTOS CATÁLOGO
// ============================================================

productsGrid.addEventListener(
    "click",
    event => {

        const addButton =
            event.target.closest(
                ".add-cart-btn"
            );

        const buyButton =
            event.target.closest(
                ".direct-buy-btn"
            );


        if (addButton) {

            const product =
                products.find(
                    p => p.id === addButton.dataset.id
                );

            if (!product) return;

            const size =
                getSelectedSize(product.id);

            if (
                Array.isArray(product.sizes) &&
                product.sizes.length &&
                !size
            ) {

                showToast(
                    "Seleccioná un talle."
                );

                return;
            }

            addToCart(product, size);

        }


        if (buyButton) {

            const product =
                products.find(
                    p => p.id === buyButton.dataset.id
                );

            if (!product) return;

            const size =
                getSelectedSize(product.id);

            if (
                Array.isArray(product.sizes) &&
                product.sizes.length &&
                !size
            ) {

                showToast(
                    "Seleccioná un talle."
                );

                return;
            }

            buyDirect(product, size);

        }

    }
);


// ============================================================
// TALLE SELECCIONADO
// ============================================================

function getSelectedSize(productId) {

    const select =
        document.querySelector(
            `[data-size-for="${productId}"]`
        );

    return select
        ? select.value
        : "";

}


// ============================================================
// AGREGAR CARRITO
// ============================================================

function addToCart(product, size = "") {

    const existing =
        cart.find(item =>
            item.productId === product.id &&
            item.size === size
        );


    if (existing) {

        existing.quantity++;

    } else {

        cart.push({

            productId: product.id,

            code: product.product_code,

            name: product.name,

            price: Number(product.price),

            image_url: product.image_url,

            size,

            quantity: 1

        });

    }


    saveCart();

    renderCart();

    showToast(
        "Producto agregado al carrito."
    );

}


// ============================================================
// COMPRA DIRECTA
// ============================================================

function buyDirect(product, size = "") {

    const temporaryCart = [

        {

            productId: product.id,

            code: product.product_code,

            name: product.name,

            price: Number(product.price),

            image_url: product.image_url,

            size,

            quantity: 1

        }

    ];


    openWhatsAppOrder(temporaryCart);

}


// ============================================================
// GUARDAR CARRITO
// ============================================================

function saveCart() {

    localStorage.setItem(
        "store_cart",
        JSON.stringify(cart)
    );

}


// ============================================================
// RENDER CARRITO
// ============================================================

function renderCart() {

    const totalItems =
        cart.reduce(
            (sum, item) =>
                sum + item.quantity,
            0
        );

    cartCounter.textContent =
        totalItems;


    if (!cart.length) {

        cartItems.innerHTML = `
            <div class="empty-state">
                <h3>Tu carrito está vacío</h3>
                <p>Agregá productos desde el catálogo.</p>
            </div>
        `;

        cartTotal.textContent =
            formatPrice(0);

        return;
    }


    cartItems.innerHTML =
        cart.map((item, index) => `

            <div class="cart-item">

                <img
                    class="cart-item-image"
                    src="${
                        escapeHTML(
                            item.image_url ||
                            "https://placehold.co/100x100"
                        )
                    }"
                    alt="${escapeHTML(item.name)}"
                >


                <div>

                    <div class="cart-item-name">
                        ${escapeHTML(item.name)}
                    </div>

                    <div class="cart-item-detail">
                        Código:
                        ${escapeHTML(item.code)}
                    </div>

                    ${
                        item.size
                            ? `
                                <div class="cart-item-detail">
                                    Talle:
                                    ${escapeHTML(item.size)}
                                </div>
                            `
                            : ""
                    }


                    <div class="cart-quantity">

                        <button
                            class="quantity-btn"
                            data-cart-action="decrease"
                            data-index="${index}"
                        >
                            −
                        </button>

                        <strong>
                            ${item.quantity}
                        </strong>

                        <button
                            class="quantity-btn"
                            data-cart-action="increase"
                            data-index="${index}"
                        >
                            +
                        </button>

                    </div>


                    <button
                        class="remove-item"
                        data-cart-action="remove"
                        data-index="${index}"
                    >
                        Eliminar
                    </button>

                </div>


                <div class="cart-item-price">
                    ${formatPrice(
                        item.price *
                        item.quantity
                    )}
                </div>

            </div>

        `).join("");


    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.quantity,
            0
        );

    cartTotal.textContent =
        formatPrice(total);

}


// ============================================================
// EVENTOS CARRITO
// ============================================================

cartItems.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-cart-action]"
            );

        if (!button) return;

        const index =
            Number(button.dataset.index);

        const action =
            button.dataset.cartAction;


        if (action === "increase") {

            cart[index].quantity++;

        }

        if (action === "decrease") {

            cart[index].quantity--;

            if (
                cart[index].quantity <= 0
            ) {

                cart.splice(index, 1);

            }

        }

        if (action === "remove") {

            cart.splice(index, 1);

        }


        saveCart();

        renderCart();

    }
);


// ============================================================
// ABRIR / CERRAR CARRITO
// ============================================================

document
    .getElementById("openCartBtn")
    .addEventListener(
        "click",
        () => {

            cartOverlay.classList.add(
                "active"
            );

        }
    );


document
    .getElementById("closeCartBtn")
    .addEventListener(
        "click",
        closeCart
    );


cartOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target === cartOverlay
        ) {

            closeCart();

        }

    }
);


function closeCart() {

    cartOverlay.classList.remove(
        "active"
    );

}


// ============================================================
// VACIAR
// ============================================================

document
    .getElementById("clearCartBtn")
    .addEventListener(
        "click",
        () => {

            if (!cart.length) return;

            cart = [];

            saveCart();

            renderCart();

        }
    );


// ============================================================
// WHATSAPP
// ============================================================

document
    .getElementById("checkoutBtn")
    .addEventListener(
        "click",
        () => {

            if (!cart.length) {

                showToast(
                    "El carrito está vacío."
                );

                return;
            }

            openWhatsAppOrder(cart);

        }
    );


function openWhatsAppOrder(orderItems) {

    if (
        !WHATSAPP_NUMBER ||
        WHATSAPP_NUMBER.includes("XXXX")
    ) {

        alert(
            "Configurá WHATSAPP_NUMBER en config.js"
        );

        return;

    }


    let message =
        `Hola! Quiero realizar el siguiente pedido:\n\n`;


    let total = 0;


    orderItems.forEach(item => {

        const subtotal =
            item.price *
            item.quantity;

        total += subtotal;


        message +=
            `• ${item.name}\n`;

        message +=
            `  Código: ${item.code}\n`;

        if (item.size) {

            message +=
                `  Talle: ${item.size}\n`;

        }

        message +=
            `  Cantidad: ${item.quantity}\n`;

        message +=
            `  Precio: ${formatPrice(item.price)}\n`;

        message +=
            `  Subtotal: ${formatPrice(subtotal)}\n\n`;

    });


    message +=
        `TOTAL: ${formatPrice(total)}\n\n`;

    message +=
        `Quedo a la espera de confirmación. ¡Gracias!`;


    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=` +
        encodeURIComponent(message);


    window.open(
        url,
        "_blank"
    );

}


// ============================================================
// BÚSQUEDA
// ============================================================

searchInput.addEventListener(
    "input",
    renderProducts
);


categoryFilter.addEventListener(
    "change",
    renderProducts
);


// ============================================================
// INICIO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCart();

        loadProducts();

    }
);