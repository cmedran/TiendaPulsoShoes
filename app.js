/* =====================================================
   CONFIGURACIÓN SUPABASE
===================================================== */

// REEMPLAZAR ESTOS DOS VALORES

const SUPABASE_URL =
    "https://fodhuzbwwcblkcfqgqvj.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZGh1emJ3d2NibGtjZnFncXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDEyMDAsImV4cCI6MjEwNDI3NzIwMH0.ieJbdhTlSdJjXlO4VTsSkkcsb2D4DOZihblqUyMXZi4";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* =====================================================
   CONFIGURACIÓN DE WHATSAPP
===================================================== */

// Colocar número del vendedor
// Formato internacional
// Argentina: 549 + código de área + número
//
// Ejemplo:
// 5491123456789

const WHATSAPP_NUMBER =
    "5493425005264";


/* =====================================================
   VARIABLES
===================================================== */

let products = [];

let cart =
    JSON.parse(
        localStorage.getItem("shoppingCart")
    ) || [];

let currentUser = null;


/* =====================================================
   INICIO
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();

        setupEvents();

        await checkUser();

        await loadProducts();

        renderCart();

    }
);


/* =====================================================
   NAVEGACIÓN
===================================================== */

function setupNavigation() {

    const menuButton =
        document.getElementById(
            "menu-toggle"
        );

    const nav =
        document.querySelector(".nav");


    menuButton.addEventListener(
        "click",
        () => {

            nav.classList.toggle(
                "active"
            );

        }
    );


    document
        .querySelectorAll(".nav a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    nav.classList.remove(
                        "active"
                    );

                }
            );

        });

}


/* =====================================================
   EVENTOS
===================================================== */

function setupEvents() {


    /* BUSCADOR */

    document
        .getElementById("search-product")
        .addEventListener(
            "input",
            renderProducts
        );


    /* CATEGORÍA */

    document
        .getElementById("category-filter")
        .addEventListener(
            "change",
            renderProducts
        );


    /* CHECKOUT */

    document
        .getElementById("checkout-button")
        .addEventListener(
            "click",
            sendOrderToWhatsApp
        );


    /* LOGIN */

    document
        .getElementById("login-form")
        .addEventListener(
            "submit",
            login
        );


    /* LOGOUT */

    document
        .getElementById("logout-button")
        .addEventListener(
            "click",
            logout
        );


    /* PRODUCT FORM */

    document
        .getElementById("product-form")
        .addEventListener(
            "submit",
            saveProduct
        );


    /* CANCELAR EDICIÓN */

    document
        .getElementById("cancel-edit")
        .addEventListener(
            "click",
            resetProductForm
        );


    /* MODAL */

    document
        .getElementById(
            "close-product-modal"
        )
        .addEventListener(
            "click",
            closeProductModal
        );


    document
        .querySelector(".modal-overlay")
        .addEventListener(
            "click",
            closeProductModal
        );

}


/* =====================================================
   CARGAR PRODUCTOS
===================================================== */

async function loadProducts() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("active", true)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        document.getElementById(
            "products-container"
        ).innerHTML = `

            <div class="loading">

                No se pudieron cargar
                los productos.

            </div>

        `;

        return;

    }


    products = data || [];


    populateCategories();

    renderProducts();

}


/* =====================================================
   CATEGORÍAS
===================================================== */

function populateCategories() {

    const select =
        document.getElementById(
            "category-filter"
        );


    const categories =
        [
            ...new Set(
                products
                    .map(
                        product =>
                            product.category
                    )
                    .filter(Boolean)
            )
        ];


    select.innerHTML = `

        <option value="all">
            Todas las categorías
        </option>

    `;


    categories.forEach(
        category => {

            select.innerHTML += `

                <option value="${escapeHtml(category)}">

                    ${escapeHtml(category)}

                </option>

            `;

        }
    );

}


/* =====================================================
   MOSTRAR PRODUCTOS
===================================================== */

function renderProducts() {

    const container =
        document.getElementById(
            "products-container"
        );


    const search =
        document
            .getElementById(
                "search-product"
            )
            .value
            .toLowerCase();


    const category =
        document
            .getElementById(
                "category-filter"
            )
            .value;


    const filtered =
        products.filter(
            product => {

                const matchesSearch =

                    product.name
                        .toLowerCase()
                        .includes(search) ||

                    (
                        product.description ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =

                    category === "all" ||

                    product.category ===
                        category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    if (!filtered.length) {

        container.innerHTML = `

            <div class="loading">

                No encontramos productos.

            </div>

        `;

        return;

    }


    container.innerHTML =
        filtered
            .map(
                product =>
                    createProductCard(product)
            )
            .join("");


    document
        .querySelectorAll(
            ".product-card"
        )
        .forEach(card => {

            const productId =
                card.dataset.id;

            setupProductCard(
                productId
            );

        });

}


/* =====================================================
   CARD PRODUCTO
===================================================== */

function createProductCard(product) {

    const sizes =
        Array.isArray(product.sizes)
            ? product.sizes
            : [];


    return `

        <article
            class="product-card"
            data-id="${product.id}">

            <div class="product-image">

                <img
                    src="${escapeHtml(
                        product.image_url ||
                        "https://via.placeholder.com/600"
                    )}"
                    alt="${escapeHtml(
                        product.name
                    )}"
                    loading="lazy">

            </div>


            <div class="product-info">

                <span class="product-category">

                    ${escapeHtml(
                        product.category ||
                        "General"
                    )}

                </span>


                <h3 class="product-name">

                    ${escapeHtml(
                        product.name
                    )}

                </h3>


                <p class="product-description">

                    ${escapeHtml(
                        product.description ||
                        ""
                    )}

                </p>


                <div class="product-price">

                    ${formatPrice(
                        product.price
                    )}

                </div>


                <div class="sizes">

                    ${
                        sizes.length

                        ?

                        sizes.map(
                            size => `

                                <button
                                    class="size-option"
                                    data-size="${escapeHtml(
                                        String(size)
                                    )}">

                                    ${escapeHtml(
                                        String(size)
                                    )}

                                </button>

                            `
                        ).join("")

                        :

                        `<span class="product-category">
                            Talle único
                        </span>`
                    }

                </div>


                <div class="product-actions">

                    <button
                        class="btn btn-secondary btn-view">

                        Ver

                    </button>

                    <button
                        class="btn btn-primary btn-add">

                        Agregar

                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =====================================================
   EVENTOS CARD
===================================================== */

function setupProductCard(productId) {

    const card =
        document.querySelector(
            `.product-card[data-id="${productId}"]`
        );


    if (!card)
        return;


    let selectedSize = null;


    card
        .querySelectorAll(
            ".size-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        card
                            .querySelectorAll(
                                ".size-option"
                            )
                            .forEach(
                                btn =>
                                    btn.classList.remove(
                                        "selected"
                                    )
                            );


                        button.classList.add(
                            "selected"
                        );


                        selectedSize =
                            button.dataset.size;

                    }
                );

            }
        );


    card
        .querySelector(
            ".btn-add"
        )
        .addEventListener(
            "click",
            () => {

                addToCart(
                    productId,
                    selectedSize
                );

            }
        );


    card
        .querySelector(
            ".btn-view"
        )
        .addEventListener(
            "click",
            () => {

                openProductModal(
                    productId
                );

            }
        );

}


/* =====================================================
   AGREGAR AL CARRITO
===================================================== */

function addToCart(
    productId,
    size
) {

    const product =
        products.find(
            p =>
                p.id === productId
        );


    if (!product)
        return;


    const sizes =
        Array.isArray(product.sizes)
            ? product.sizes
            : [];


    if (
        sizes.length &&
        !size
    ) {

        alert(
            "Seleccioná un talle."
        );

        return;

    }


    const existing =
        cart.find(
            item =>
                item.productId ===
                    productId &&
                item.size ===
                    size
        );


    if (existing) {

        existing.quantity++;

    } else {

        cart.push({

            productId:
                productId,

            size:
                size || "Único",

            quantity:
                1

        });

    }


    saveCart();

    renderCart();

    alert(
        "Producto agregado al carrito."
    );

}


/* =====================================================
   GUARDAR CARRITO
===================================================== */

function saveCart() {

    localStorage.setItem(
        "shoppingCart",
        JSON.stringify(cart)
    );

}


/* =====================================================
   RENDER CARRITO
===================================================== */

function renderCart() {

    const container =
        document.getElementById(
            "cart-container"
        );


    const cartItems =
        cart
            .map(item => {

                const product =
                    products.find(
                        p =>
                            p.id ===
                            item.productId
                    );

                if (!product)
                    return null;

                return {
                    ...item,
                    product
                };

            })
            .filter(Boolean);


    updateCartCount();


    if (!cartItems.length) {

        container.innerHTML = `

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

                <a
                    href="#catalogo"
                    class="btn btn-primary">

                    Ver catálogo

                </a>

            </div>

        `;

        updateCartTotals(0);

        return;

    }


    container.innerHTML =
        cartItems
            .map(
                item =>
                    createCartItem(item)
            )
            .join("");


    cartItems.forEach(
        item => {

            const element =
                document.querySelector(
                    `[data-cart-id="${item.productId}-${item.size}"]`
                );


            element
                .querySelector(".minus")
                .addEventListener(
                    "click",
                    () => changeQuantity(
                        item.productId,
                        item.size,
                        -1
                    )
                );


            element
                .querySelector(".plus")
                .addEventListener(
                    "click",
                    () => changeQuantity(
                        item.productId,
                        item.size,
                        1
                    )
                );


            element
                .querySelector(".remove-item")
                .addEventListener(
                    "click",
                    () => removeFromCart(
                        item.productId,
                        item.size
                    )
                );

        }
    );


    const total =
        cartItems.reduce(
            (
                sum,
                item
            ) =>
                sum +
                (
                    Number(
                        item.product.price
                    ) *
                    item.quantity
                ),
            0
        );


    updateCartTotals(total);

}


/* =====================================================
   ITEM CARRITO
===================================================== */

function createCartItem(item) {

    return `

        <div
            class="cart-item"
            data-cart-id="${item.productId}-${item.size}">

            <img
                class="cart-item-image"
                src="${escapeHtml(
                    item.product.image_url ||
                    "https://via.placeholder.com/200"
                )}"
                alt="${escapeHtml(
                    item.product.name
                )}">


            <div>

                <div class="cart-item-name">

                    ${escapeHtml(
                        item.product.name
                    )}

                </div>

                <div class="cart-item-size">

                    Talle:
                    ${escapeHtml(
                        item.size
                    )}

                </div>

                <div class="cart-item-price">

                    ${formatPrice(
                        item.product.price
                    )}

                </div>


                <div class="quantity-controls">

                    <button class="minus">
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button class="plus">
                        +
                    </button>

                    <button
                        class="remove-item">

                        Eliminar

                    </button>

                </div>

            </div>


            <strong>

                ${formatPrice(
                    Number(
                        item.product.price
                    ) *
                    item.quantity
                )}

            </strong>

        </div>

    `;

}


/* =====================================================
   CANTIDAD
===================================================== */

function changeQuantity(
    productId,
    size,
    change
) {

    const item =
        cart.find(
            item =>
                item.productId ===
                    productId &&
                item.size ===
                    size
        );


    if (!item)
        return;


    item.quantity += change;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                i =>
                    !(
                        i.productId ===
                            productId &&
                        i.size ===
                            size
                    )
            );

    }


    saveCart();

    renderCart();

}


/* =====================================================
   ELIMINAR
===================================================== */

function removeFromCart(
    productId,
    size
) {

    cart =
        cart.filter(
            item =>
                !(
                    item.productId ===
                        productId &&
                    item.size ===
                        size
                )
        );


    saveCart();

    renderCart();

}


/* =====================================================
   CONTADOR
===================================================== */

function updateCartCount() {

    const count =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                item.quantity,
            0
        );


    document.getElementById(
        "cart-count"
    ).textContent =
        count;

}


/* =====================================================
   TOTALES
===================================================== */

function updateCartTotals(
    total
) {

    document.getElementById(
        "cart-subtotal"
    ).textContent =
        formatPrice(total);


    document.getElementById(
        "cart-total"
    ).textContent =
        formatPrice(total);

}


/* =====================================================
   WHATSAPP
===================================================== */

function sendOrderToWhatsApp() {

    if (!cart.length) {

        alert(
            "El carrito está vacío."
        );

        return;

    }


    let message =
        "Hola! Quiero realizar el siguiente pedido:%0A%0A";


    let total = 0;


    cart.forEach(
        item => {

            const product =
                products.find(
                    p =>
                        p.id ===
                        item.productId
                );


            if (!product)
                return;


            const subtotal =
                Number(
                    product.price
                ) *
                item.quantity;


            total += subtotal;


            message +=

                `• ${product.name}` +
                `%0A` +

                `  Talle: ${item.size}` +
                `%0A` +

                `  Cantidad: ${item.quantity}` +
                `%0A` +

                `  Precio: ${formatPrice(product.price)}` +
                `%0A%0A`;

        }
    );


    message +=
        `TOTAL: ${formatPrice(total)}`;


    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;


    window.open(
        url,
        "_blank"
    );

}


/* =====================================================
   MODAL PRODUCTO
===================================================== */

function openProductModal(
    productId
) {

    const product =
        products.find(
            p =>
                p.id === productId
        );


    if (!product)
        return;


    const sizes =
        Array.isArray(product.sizes)
            ? product.sizes
            : [];


    document.getElementById(
        "product-modal-body"
    ).innerHTML = `

        <img
            src="${escapeHtml(
                product.image_url
            )}"
            style="
                width:100%;
                max-height:400px;
                object-fit:cover;
                border-radius:10px;
            ">


        <span
            class="section-label"
            style="margin-top:20px">

            ${escapeHtml(
                product.category ||
                ""
            )}

        </span>


        <h2>

            ${escapeHtml(
                product.name
            )}

        </h2>


        <p style="margin:15px 0">

            ${escapeHtml(
                product.description ||
                ""
            )}

        </p>


        <div class="product-price">

            ${formatPrice(
                product.price
            )}

        </div>


        <div class="sizes">

            ${
                sizes
                    .map(
                        size => `

                            <span
                                class="size-option">

                                ${escapeHtml(
                                    String(size)
                                )}

                            </span>

                        `
                    )
                    .join("")
            }

        </div>

    `;


    document
        .getElementById(
            "product-modal"
        )
        .classList.remove(
            "hidden"
        );

}


/* =====================================================
   CERRAR MODAL
===================================================== */

function closeProductModal() {

    document
        .getElementById(
            "product-modal"
        )
        .classList.add(
            "hidden"
        );

}


/* =====================================================
   AUTH
===================================================== */

async function checkUser() {

    const {
        data
    } =
        await supabaseClient
            .auth
            .getSession();


    currentUser =
        data.session?.user ||
        null;


    updateAdminInterface();

}


/* =====================================================
   LOGIN
===================================================== */

async function login(event) {

    event.preventDefault();


    const email =
        document
            .getElementById(
                "login-email"
            )
            .value;


    const password =
        document
            .getElementById(
                "login-password"
            )
            .value;


    const message =
        document.getElementById(
            "login-message"
        );


    message.textContent =
        "Ingresando...";


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInWithPassword({

                email,
                password

            });


    if (error) {

        message.textContent =
            "Email o contraseña incorrectos.";

        return;

    }


    currentUser =
        data.user;


    message.textContent =
        "";


    updateAdminInterface();

    await loadAdminProducts();

}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    await supabaseClient
        .auth
        .signOut();


    currentUser =
        null;


    updateAdminInterface();

}


/* =====================================================
   INTERFAZ ADMIN
===================================================== */

function updateAdminInterface() {

    const loginSection =
        document.getElementById(
            "admin-login"
        );


    const panel =
        document.getElementById(
            "admin-panel"
        );


    if (currentUser) {

        loginSection.classList.add(
            "hidden"
        );

        panel.classList.remove(
            "hidden"
        );


        loadAdminProducts();

    } else {

        loginSection.classList.remove(
            "hidden"
        );

        panel.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   PRODUCTOS ADMIN
===================================================== */

async function loadAdminProducts() {

    if (!currentUser)
        return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    renderAdminProducts(
        data || []
    );

}


/* =====================================================
   TABLA ADMIN
===================================================== */

function renderAdminProducts(
    adminProducts
) {

    const table =
        document.getElementById(
            "admin-products-table"
        );


    document.getElementById(
        "admin-product-count"
    ).textContent =
        `${adminProducts.length} productos`;


    table.innerHTML =
        adminProducts
            .map(
                product => `

                    <tr>

                        <td>

                            <img
                                class="admin-product-image"
                                src="${escapeHtml(
                                    product.image_url ||
                                    "https://via.placeholder.com/100"
                                )}">

                            ${escapeHtml(
                                product.name
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                product.category ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${formatPrice(
                                product.price
                            )}

                        </td>


                        <td>

                            ${
                                product.active

                                ?

                                `<span class="status status-active">
                                    Activo
                                </span>`

                                :

                                `<span class="status status-inactive">
                                    Oculto
                                </span>`
                            }

                        </td>


                        <td>

                            <div class="admin-actions">

                                <button
                                    class="admin-action"
                                    onclick="editProduct('${product.id}')">

                                    Editar

                                </button>


                                <button
                                    class="admin-action"
                                    onclick="toggleProduct('${product.id}', ${product.active})">

                                    ${
                                        product.active
                                        ? "Ocultar"
                                        : "Activar"
                                    }

                                </button>

                            </div>

                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =====================================================
   GUARDAR PRODUCTO
===================================================== */

async function saveProduct(
    event
) {

    event.preventDefault();


    if (!currentUser) {

        alert(
            "Debes iniciar sesión."
        );

        return;

    }


    const id =
        document.getElementById(
            "product-id"
        ).value;


    const name =
        document.getElementById(
            "product-name"
        ).value.trim();


    const category =
        document.getElementById(
            "product-category"
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                "product-price"
            ).value
        );


    const image =
        document.getElementById(
            "product-image"
        ).value.trim();


    const description =
        document.getElementById(
            "product-description"
        ).value.trim();


    const active =
        document.getElementById(
            "product-active"
        ).checked;


    const sizes =
        [
            ...document.querySelectorAll(
                "#sizes-selector input:checked"
            )
        ]
            .map(
                checkbox =>
                    checkbox.value
            );


    const productData = {

        name,

        category,

        price,

        image_url:
            image,

        description,

        sizes,

        active

    };


    let result;


    if (id) {

        result =
            await supabaseClient
                .from("products")
                .update(
                    productData
                )
                .eq(
                    "id",
                    id
                );

    } else {

        result =
            await supabaseClient
                .from("products")
                .insert(
                    productData
                );

    }


    if (result.error) {

        console.error(
            result.error
        );


        document.getElementById(
            "product-message"
        ).textContent =
            "Error al guardar el producto.";

        return;

    }


    document.getElementById(
        "product-message"
    ).textContent =
        "Producto guardado correctamente.";


    resetProductForm();

    await loadAdminProducts();

    await loadProducts();

}


/* =====================================================
   EDITAR PRODUCTO
===================================================== */

async function editProduct(
    id
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq(
                "id",
                id
            )
            .single();


    if (error) {

        console.error(error);

        return;

    }


    document.getElementById(
        "product-id"
    ).value =
        data.id;


    document.getElementById(
        "product-name"
    ).value =
        data.name;


    document.getElementById(
        "product-category"
    ).value =
        data.category || "";


    document.getElementById(
        "product-price"
    ).value =
        data.price;


    document.getElementById(
        "product-image"
    ).value =
        data.image_url || "";


    document.getElementById(
        "product-description"
    ).value =
        data.description || "";


    document.getElementById(
        "product-active"
    ).checked =
        data.active;


    const sizes =
        Array.isArray(data.sizes)
            ? data.sizes
            : [];


    document
        .querySelectorAll(
            "#sizes-selector input"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    sizes.includes(
                        checkbox.value
                    );

            }
        );


    document.getElementById(
        "form-title"
    ).textContent =
        "Editar producto";


    document
        .getElementById(
            "product-form"
        )
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =====================================================
   ACTIVAR / DESACTIVAR
===================================================== */

async function toggleProduct(
    id,
    currentStatus
) {

    const {
        error
    } =
        await supabaseClient
            .from("products")
            .update({

                active:
                    !currentStatus

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "No se pudo modificar el producto."
        );

        return;

    }


    await loadAdminProducts();

    await loadProducts();

}


/* =====================================================
   RESET FORMULARIO
===================================================== */

function resetProductForm() {

    document
        .getElementById(
            "product-form"
        )
        .reset();


    document.getElementById(
        "product-id"
    ).value = "";


    document.getElementById(
        "form-title"
    ).textContent =
        "Nuevo producto";


    document.getElementById(
        "product-active"
    ).checked =
        true;


    document.getElementById(
        "product-message"
    ).textContent =
        "";

}


/* =====================================================
   FORMATO PRECIO
===================================================== */

function formatPrice(
    price
) {

    return new Intl.NumberFormat(
        "es-AR",
        {

            style:
                "currency",

            currency:
                "ARS",

            maximumFractionDigits:
                0

        }
    ).format(
        Number(price) || 0
    );

}


/* =====================================================
   SEGURIDAD HTML
===================================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   SUPABASE AUTH STATE
===================================================== */

supabaseClient
    .auth
    .onAuthStateChange(
        (
            event,
            session
        ) => {

            currentUser =
                session?.user ||
                null;


            updateAdminInterface();

        }
    );