/*
===========================================================
CATÁLOGO PÚBLICO
===========================================================
*/

let products = [];
let cart = [];

let selectedCategory = "all";
let searchTerm = "";


/*
===========================================================
ELEMENTOS DOM
===========================================================
*/

const productsContainer =
    document.getElementById("productsContainer");

const emptyProducts =
    document.getElementById("emptyProducts");

const categoryFilters =
    document.getElementById("categoryFilters");

const searchInput =
    document.getElementById("searchInput");

const cartButton =
    document.getElementById("cartButton");

const cartCount =
    document.getElementById("cartCount");

const cartPanel =
    document.getElementById("cartPanel");

const cartOverlay =
    document.getElementById("cartOverlay");

const closeCartButton =
    document.getElementById("closeCartButton");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const checkoutButton =
    document.getElementById("checkoutButton");

const productModal =
    document.getElementById("productModal");

const closeProductModal =
    document.getElementById("closeProductModal");

const productModalContent =
    document.getElementById("productModalContent");


/*
===========================================================
INICIO
===========================================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    applyStoreConfig();

    loadCart();

    updateCartUI();

    await loadProducts();

    setupEvents();

});


/*
===========================================================
CONFIGURACIÓN DE TIENDA
===========================================================
*/

function applyStoreConfig() {

    const storeName =
        document.getElementById("storeName");

    const footerStoreName =
        document.getElementById("footerStoreName");

    const storeDescription =
        document.getElementById("storeDescription");

    const storeLogo =
        document.getElementById("storeLogo");

    if (storeName) {
        storeName.textContent =
            STORE_CONFIG.name;
    }

    if (footerStoreName) {
        footerStoreName.textContent =
            STORE_CONFIG.name;
    }

    if (storeDescription) {
        storeDescription.textContent =
            STORE_CONFIG.description;
    }

    if (
        storeLogo &&
        STORE_CONFIG.logo
    ) {
        storeLogo.src =
            STORE_CONFIG.logo;
    }

    const instagram =
        document.getElementById("instagramLink");

    const facebook =
        document.getElementById("facebookLink");

    const tiktok =
        document.getElementById("tiktokLink");

    if (instagram) {
        instagram.href =
            STORE_CONFIG.instagram || "#";
    }

    if (facebook) {
        facebook.href =
            STORE_CONFIG.facebook || "#";
    }

    if (tiktok) {
        tiktok.href =
            STORE_CONFIG.tiktok || "#";
    }

    const year =
        document.getElementById("currentYear");

    if (year) {
        year.textContent =
            new Date().getFullYear();
    }

}


/*
===========================================================
PRODUCTOS
===========================================================
*/

async function loadProducts() {

    showLoading();

    try {

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
            throw error;
        }


        products =
            data || [];


        buildCategories();

        renderProducts();


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

        productsContainer.innerHTML = `
            <div class="loading-container">
                <p>
                    No se pudieron cargar los productos.
                </p>
                <small style="color:#555">
                    ${escapeHtml(error.message || "")}
                </small>
            </div>
        `;

    }

}


/*
===========================================================
CATEGORÍAS
===========================================================
*/

function buildCategories() {

    const categories =
        [...new Set(
            products
                .map(product =>
                    product.category
                )
                .filter(Boolean)
        )]
        .sort();


    categoryFilters.innerHTML = `

        <button
            class="category-button active"
            data-category="all">

            Todos

        </button>

    `;


    categories.forEach(category => {

        const button =
            document.createElement("button");

        button.className =
            "category-button";

        button.dataset.category =
            category;

        button.textContent =
            category;

        categoryFilters.appendChild(button);

    });

}


/*
===========================================================
FILTRADO
===========================================================
*/

function getFilteredProducts() {

    return products.filter(product => {

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;


        const search =
            searchTerm.toLowerCase();


        const matchesSearch =
            !search ||
            String(product.name || "")
                .toLowerCase()
                .includes(search) ||

            String(product.product_code || "")
                .toLowerCase()
                .includes(search) ||

            String(product.description || "")
                .toLowerCase()
                .includes(search) ||

            String(product.category || "")
                .toLowerCase()
                .includes(search);


        return (
            matchesCategory &&
            matchesSearch
        );

    });

}


/*
===========================================================
RENDER PRODUCTOS
===========================================================
*/

function renderProducts() {

    const filtered =
        getFilteredProducts();


    productsContainer.innerHTML = "";


    if (!filtered.length) {

        emptyProducts.classList.remove(
            "hidden"
        );

        return;

    }


    emptyProducts.classList.add(
        "hidden"
    );


    filtered.forEach(product => {

        productsContainer.appendChild(
            createProductCard(product)
        );

    });

}


/*
===========================================================
NORMALIZAR TALLES
===========================================================
*/

function normalizeSizes(value) {

    if (!Array.isArray(value)) {
        return [];
    }


    return value
        .map(item => {

            if (
                typeof item === "object" &&
                item !== null
            ) {

                return {

                    size:
                        String(
                            item.size ?? ""
                        ).trim(),

                    stock:
                        Math.max(
                            0,
                            parseInt(
                                item.stock,
                                10
                            ) || 0
                        )

                };

            }


            return {

                size:
                    String(item).trim(),

                stock:
                    0

            };

        })
        .filter(item =>
            item.size !== ""
        );

}


/*
===========================================================
 STOCK POR TALLE
===========================================================
*/

function getStockForSize(
    product,
    size
) {

    const sizes =
        normalizeSizes(
            product.sizes
        );


    const found =
        sizes.find(item =>
            String(item.size) ===
            String(size)
        );


    return found
        ? found.stock
        : 0;

}


/*
===========================================================
 CREAR CARD
===========================================================
*/

function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className =
        "product-card";


    const sizes =
        normalizeSizes(
            product.sizes
        );


    const availableSizes =
        sizes.filter(
            item => item.stock > 0
        );


    let image =
        product.image_url ||
        "img/no-image.jpg";


    let sizesHTML = "";


    if (sizes.length) {

        sizesHTML = `

            <div class="product-stock-area">

                <div class="product-stock-title">
                    Talle
                </div>

                <select
                    class="size-select"
                    data-product-id="${product.id}"
                >

                    <option value="">
                        Seleccionar talle
                    </option>

                    ${sizes.map(item => `

                        <option
                            value="${escapeAttribute(item.size)}"
                            ${item.stock <= 0 ? "disabled" : ""}
                        >

                            ${escapeHtml(item.size)}
                            ${
                                item.stock > 0
                                    ? ` — ${item.stock} disponibles`
                                    : ` — Agotado`
                            }

                        </option>

                    `).join("")}

                </select>

            </div>

        `;

    } else {

        sizesHTML = `
            <div class="product-stock-area">
                <div class="product-stock-title">
                    Disponible
                </div>
            </div>
        `;

    }


    const canBuy =
        !sizes.length ||
        availableSizes.length > 0;


    card.innerHTML = `

        <div class="product-image">

            ${
                product.featured
                    ? `
                        <span class="product-badge">
                            DESTACADO
                        </span>
                    `
                    : ""
            }

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(product.name || "")}"
                loading="lazy"
                onerror="this.src='img/no-image.jpg'"
            >

        </div>


        <div class="product-info">

            <div class="product-code">
                ${escapeHtml(product.product_code || "")}
            </div>


            <h3 class="product-name">
                ${escapeHtml(product.name || "")}
            </h3>


            <p class="product-description">
                ${escapeHtml(product.description || "")}
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


            ${sizesHTML}


            <div class="product-actions">

                <button
                    class="product-action add-cart-button"
                    data-action="add"
                    data-id="${product.id}"
                    ${!canBuy ? "disabled" : ""}
                >

                    AGREGAR

                </button>


                <button
                    class="product-action buy-button"
                    data-action="buy"
                    data-id="${product.id}"
                    ${!canBuy ? "disabled" : ""}
                >

                    COMPRAR

                </button>

            </div>

        </div>

    `;


    /*
    -------------------------------------------------------
    Click sobre imagen / producto
    -------------------------------------------------------
    */

    card
        .querySelector(".product-image")
        .addEventListener(
            "click",
            () => openProductModal(product)
        );


    /*
    -------------------------------------------------------
    Agregar / comprar
    -------------------------------------------------------
    */

    card
        .querySelector(
            '[data-action="add"]'
        )
        .addEventListener(
            "click",
            () => addProductToCart(
                product.id,
                card
            )
        );


    card
        .querySelector(
            '[data-action="buy"]'
        )
        .addEventListener(
            "click",
            () => buyProductDirect(
                product.id,
                card
            )
        );


    return card;

}


/*
===========================================================
AGREGAR AL CARRITO
===========================================================
*/

function addProductToCart(
    productId,
    card
) {

    const product =
        products.find(
            item => item.id === productId
        );


    if (!product) {
        return;
    }


    const select =
        card.querySelector(".size-select");


    let size = "";


    if (select) {

        size =
            select.value;

        if (!size) {

            alert(
                "Seleccioná un talle."
            );

            return;

        }

    }


    const stock =
        size
            ? getStockForSize(
                product,
                size
            )
            : 999999;


    if (stock <= 0) {

        alert(
            "El talle seleccionado no tiene stock."
        );

        return;

    }


    const existing =
        cart.find(item =>
            item.productId === productId &&
            String(item.size) === String(size)
        );


    if (existing) {

        if (
            existing.quantity >= stock
        ) {

            alert(
                "No hay más unidades disponibles de ese talle."
            );

            return;

        }

        existing.quantity++;

    } else {

        cart.push({

            productId:
                product.id,

            name:
                product.name,

            code:
                product.product_code,

            price:
                Number(product.price) || 0,

            image:
                product.image_url ||
                "img/no-image.jpg",

            size:
                size,

            quantity:
                1

        });

    }


    saveCart();

    updateCartUI();

    openCart();

}


/*
===========================================================
COMPRA DIRECTA
===========================================================
*/

function buyProductDirect(
    productId,
    card
) {

    const product =
        products.find(
            item => item.id === productId
        );


    if (!product) {
        return;
    }


    const select =
        card.querySelector(".size-select");


    let size = "";


    if (select) {

        size =
            select.value;

        if (!size) {

            alert(
                "Seleccioná un talle."
            );

            return;

        }

    }


    const stock =
        size
            ? getStockForSize(
                product,
                size
            )
            : 999999;


    if (stock <= 0) {

        alert(
            "Ese talle está agotado."
        );

        return;

    }


    const price =
        Number(product.price) || 0;


    const message = `

Hola, quiero realizar el siguiente pedido:

Producto: ${product.name}

Código: ${product.product_code || "-"}

Talle: ${size || "Único"}

Cantidad: 1

Precio: ${formatPrice(price)}

Gracias.

`.trim();


    openWhatsApp(message);

}


/*
===========================================================
CARRITO
===========================================================
*/

function loadCart() {

    try {

        const stored =
            localStorage.getItem(
                CART_STORAGE_KEY
            );


        cart =
            stored
                ? JSON.parse(stored)
                : [];


        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch (error) {

        console.error(error);

        cart = [];

    }

}


function saveCart() {

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );

}


/*
===========================================================
ACTUALIZAR CARRITO
===========================================================
*/

function updateCartUI() {

    const quantity =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );


    cartCount.textContent =
        quantity;


    renderCart();

}


/*
===========================================================
RENDER CARRITO
===========================================================
*/

function renderCart() {

    if (!cart.length) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <div class="empty-cart-icon">
                    🛒
                </div>

                <h3>
                    Tu carrito está vacío
                </h3>

                <p>
                    Agregá productos desde el catálogo.
                </p>

            </div>

        `;


        cartTotal.textContent =
            formatPrice(0);


        checkoutButton.disabled =
            true;


        checkoutButton.style.opacity =
            "0.4";


        return;

    }


    checkoutButton.disabled =
        false;

    checkoutButton.style.opacity =
        "1";


    cartItems.innerHTML = "";


    let total = 0;


    cart.forEach((item, index) => {

        const subtotal =
            item.price *
            item.quantity;


        total += subtotal;


        const element =
            document.createElement("div");


        element.className =
            "cart-item";


        element.innerHTML = `

            <div class="cart-item-image">

                <img
                    src="${escapeAttribute(item.image)}"
                    alt="${escapeAttribute(item.name)}"
                    onerror="this.src='img/no-image.jpg'"
                >

            </div>


            <div>

                <div class="cart-item-name">
                    ${escapeHtml(item.name)}
                </div>

                <div class="cart-item-details">

                    Código:
                    ${escapeHtml(item.code || "-")}

                    <br>

                    Talle:
                    ${escapeHtml(item.size || "Único")}

                </div>


                <div class="cart-item-price">
                    ${formatPrice(subtotal)}
                </div>


                <div class="cart-item-actions">

                    <button
                        class="quantity-button"
                        data-cart-action="minus"
                        data-index="${index}"
                    >
                        −
                    </button>


                    <span class="quantity-value">
                        ${item.quantity}
                    </span>


                    <button
                        class="quantity-button"
                        data-cart-action="plus"
                        data-index="${index}"
                    >
                        +
                    </button>


                    <button
                        class="remove-cart-item"
                        data-cart-action="remove"
                        data-index="${index}"
                    >
                        Eliminar
                    </button>

                </div>

            </div>

        `;


        cartItems.appendChild(element);

    });


    cartTotal.textContent =
        formatPrice(total);

}


/*
===========================================================
CANTIDAD CARRITO
===========================================================
*/

function changeCartQuantity(
    index,
    amount
) {

    const item =
        cart[index];


    if (!item) {
        return;
    }


    let maxStock =
        999999;


    const product =
        products.find(
            product =>
                product.id ===
                item.productId
        );


    if (
        product &&
        item.size
    ) {

        maxStock =
            getStockForSize(
                product,
                item.size
            );

    }


    const newQuantity =
        item.quantity + amount;


    if (newQuantity <= 0) {

        cart.splice(index, 1);

    } else if (
        newQuantity <= maxStock
    ) {

        item.quantity =
            newQuantity;

    } else {

        alert(
            "No hay más stock disponible."
        );

    }


    saveCart();

    updateCartUI();

}


/*
===========================================================
CHECKOUT WHATSAPP
===========================================================
*/

function checkoutWhatsApp() {

    if (!cart.length) {
        return;
    }


    let message =
        `Hola, quiero realizar el siguiente pedido:\n\n`;


    let total = 0;


    cart.forEach((item, index) => {

        const subtotal =
            item.price *
            item.quantity;


        total += subtotal;


        message +=
            `${index + 1}. ${item.name}\n`;


        message +=
            `Código: ${item.code || "-"}\n`;


        message +=
            `Talle: ${item.size || "Único"}\n`;


        message +=
            `Cantidad: ${item.quantity}\n`;


        message +=
            `Precio unitario: ${formatPrice(item.price)}\n`;


        message +=
            `Subtotal: ${formatPrice(subtotal)}\n\n`;

    });


    message +=
        `TOTAL: ${formatPrice(total)}\n\n`;


    message +=
        `Gracias.`;


    openWhatsApp(message);

}


/*
===========================================================
WHATSAPP
===========================================================
*/

function openWhatsApp(message) {

    const number =
        String(
            WHATSAPP_NUMBER || ""
        )
        .replace(/\D/g, "");


    if (!number) {

        alert(
            "El número de WhatsApp no está configurado."
        );

        return;

    }


    const url =
        "https://wa.me/" +
        number +
        "?text=" +
        encodeURIComponent(message);


    window.open(
        url,
        "_blank"
    );

}


/*
===========================================================
MODAL PRODUCTO
===========================================================
*/

function openProductModal(product) {

    const image =
        product.image_url ||
        "img/no-image.jpg";


    productModalContent.innerHTML = `

        <div class="modal-product">

            <div class="modal-product-image">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(product.name || "")}"
                    onerror="this.src='img/no-image.jpg'"
                >

            </div>


            <div class="modal-product-info">

                <span class="section-label">
                    ${escapeHtml(product.category || "PRODUCTO")}
                </span>


                <h2>
                    ${escapeHtml(product.name || "")}
                </h2>


                <p class="description">
                    ${escapeHtml(product.description || "")}
                </p>


                <div class="price">
                    ${formatPrice(product.price)}
                </div>

            </div>

        </div>

    `;


    productModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeModal() {

    productModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/*
===========================================================
CARRITO PANEL
===========================================================
*/

function openCart() {

    cartPanel.classList.add(
        "open"
    );

    cartOverlay.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeCart() {

    cartPanel.classList.remove(
        "open"
    );

    cartOverlay.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/*
===========================================================
EVENTOS
===========================================================
*/

function setupEvents() {

    searchInput.addEventListener(
        "input",
        event => {

            searchTerm =
                event.target.value.trim();

            renderProducts();

        }
    );


    categoryFilters.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".category-button"
                );


            if (!button) {
                return;
            }


            selectedCategory =
                button.dataset.category;


            document
                .querySelectorAll(
                    ".category-button"
                )
                .forEach(btn =>
                    btn.classList.remove(
                        "active"
                    )
                );


            button.classList.add(
                "active"
            );


            renderProducts();

        }
    );


    cartButton.addEventListener(
        "click",
        openCart
    );


    closeCartButton.addEventListener(
        "click",
        closeCart
    );


    cartOverlay.addEventListener(
        "click",
        closeCart
    );


    checkoutButton.addEventListener(
        "click",
        checkoutWhatsApp
    );


    closeProductModal.addEventListener(
        "click",
        closeModal
    );


    productModal
        .querySelector(".modal-backdrop")
        .addEventListener(
            "click",
            closeModal
        );


    cartItems.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-cart-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.cartAction;


            const index =
                Number(
                    button.dataset.index
                );


            if (action === "plus") {

                changeCartQuantity(
                    index,
                    1
                );

            }


            if (action === "minus") {

                changeCartQuantity(
                    index,
                    -1
                );

            }


            if (action === "remove") {

                cart.splice(
                    index,
                    1
                );


                saveCart();

                updateCartUI();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeCart();

                closeModal();

            }

        }
    );

}


/*
===========================================================
LOADING
===========================================================
*/

function showLoading() {

    productsContainer.innerHTML = `

        <div class="loading-container">

            <div class="loader"></div>

            <p>
                Cargando productos...
            </p>

        </div>

    `;

}


/*
===========================================================
FORMATO PRECIO
===========================================================
*/

function formatPrice(value) {

    const number =
        Number(value) || 0;


    return new Intl.NumberFormat(
        STORE_CONFIG.locale || "es-AR",
        {
            style: "currency",
            currency:
                STORE_CONFIG.currency || "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(number);

}


/*
===========================================================
SEGURIDAD HTML
===========================================================
*/

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char])
        );

}


function escapeAttribute(value) {

    return escapeHtml(value);

}