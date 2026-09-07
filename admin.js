/*
===========================================================
ADMINISTRACIÓN
===========================================================
*/

let adminUser = null;
let adminProducts = [];

let sizeRows = [];


/*
===========================================================
DOM
===========================================================
*/

const loginScreen =
    document.getElementById("loginScreen");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginError =
    document.getElementById("loginError");

const adminPanel =
    document.getElementById("adminPanel");

const logoutBtn =
    document.getElementById("logoutBtn");

const newProductBtn =
    document.getElementById("newProductBtn");

const productFormCard =
    document.getElementById("productFormCard");

const productForm =
    document.getElementById("productForm");

const productId =
    document.getElementById("productId");

const formTitle =
    document.getElementById("formTitle");

const productCode =
    document.getElementById("productCode");

const productName =
    document.getElementById("productName");

const productCategory =
    document.getElementById("productCategory");

const productPrice =
    document.getElementById("productPrice");

const productOldPrice =
    document.getElementById("productOldPrice");

const productImage =
    document.getElementById("productImage");

const productImageUrl =
    document.getElementById("productImageUrl");

const productDescription =
    document.getElementById("productDescription");

const productActive =
    document.getElementById("productActive");

const productFeatured =
    document.getElementById("productFeatured");

const saveProductBtn =
    document.getElementById("saveProductBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const productFormMessage =
    document.getElementById("productFormMessage");

const adminSearch =
    document.getElementById("adminSearch");

const adminProductsContainer =
    document.getElementById(
        "adminProductsContainer"
    );

const addSizeBtn =
    document.getElementById("addSizeBtn");

const sizesContainer =
    document.getElementById(
        "sizesContainer"
    );

const noSizesMessage =
    document.getElementById(
        "noSizesMessage"
    );


/*
===========================================================
INICIO
===========================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);


async function initAdmin() {

    setupAdminEvents();

    await checkSession();

}


/*
===========================================================
SESION
===========================================================
*/

async function checkSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {
            throw error;
        }


        const session =
            data.session;


        if (
            session &&
            session.user
        ) {

            await handleUser(
                session.user
            );

        } else {

            showLogin();

        }


        supabaseClient
            .auth
            .onAuthStateChange(
                async (
                    event,
                    session
                ) => {

                    if (
                        session &&
                        session.user
                    ) {

                        await handleUser(
                            session.user
                        );

                    } else {

                        showLogin();

                    }

                }
            );


    } catch (error) {

        console.error(error);

        showLogin();

    }

}


/*
===========================================================
VERIFICAR ADMIN
===========================================================
*/

async function handleUser(user) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("admin_users")
                .select("id")
                .eq("id", user.id)
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {

            await supabaseClient.auth.signOut();

            showLoginError(
                "Este usuario no tiene permisos de administrador."
            );

            return;

        }


        adminUser =
            user;


        showAdminPanel();

        await loadAdminProducts();


    } catch (error) {

        console.error(error);

        showLoginError(
            error.message ||
            "No se pudo verificar el usuario."
        );

    }

}


/*
===========================================================
LOGIN
===========================================================
*/

async function login() {

    clearLoginError();


    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;


    if (!email || !password) {

        showLoginError(
            "Completá email y contraseña."
        );

        return;

    }


    try {

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
            throw error;
        }


        if (
            data &&
            data.user
        ) {

            await handleUser(
                data.user
            );

        }


    } catch (error) {

        console.error(error);

        showLoginError(
            getAuthErrorMessage(
                error
            )
        );

    }

}


/*
===========================================================
LOGOUT
===========================================================
*/

async function logout() {

    await supabaseClient
        .auth
        .signOut();

    showLogin();

}


/*
===========================================================
CARGAR PRODUCTOS
===========================================================
*/

async function loadAdminProducts() {

    adminProductsContainer.innerHTML = `

        <div class="admin-loading">
            Cargando productos...
        </div>

    `;


    try {

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
            throw error;
        }


        adminProducts =
            data || [];


        renderAdminProducts();


    } catch (error) {

        console.error(error);

        adminProductsContainer.innerHTML = `

            <div class="admin-message error">
                ${escapeHtml(error.message)}
            </div>

        `;

    }

}


/*
===========================================================
RENDER PRODUCTOS ADMIN
===========================================================
*/

function renderAdminProducts() {

    const search =
        adminSearch.value
            .trim()
            .toLowerCase();


    const filtered =
        adminProducts.filter(product => {

            if (!search) {
                return true;
            }


            return (

                String(
                    product.name || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    product.product_code || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    product.category || ""
                )
                .toLowerCase()
                .includes(search)

            );

        });


    if (!filtered.length) {

        adminProductsContainer.innerHTML = `

            <div class="admin-empty">
                No hay productos para mostrar.
            </div>

        `;

        return;

    }


    adminProductsContainer.innerHTML = "";


    filtered.forEach(product => {

        adminProductsContainer.appendChild(
            createAdminProduct(product)
        );

    });

}


/*
===========================================================
PRODUCTO ADMIN
===========================================================
*/

function createAdminProduct(product) {

    const element =
        document.createElement("div");

    element.className =
        "admin-product";


    const image =
        product.image_url ||
        "img/no-image.jpg";


    const sizes =
        normalizeSizes(
            product.sizes
        );


    const totalStock =
        sizes.reduce(
            (total, item) =>
                total + item.stock,
            0
        );


    element.innerHTML = `

        <div class="admin-product-image">

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(product.name || "")}"
                onerror="this.src='img/no-image.jpg'"
            >

        </div>


        <div class="admin-product-info">

            <div class="admin-product-top">

                <span class="admin-product-code">
                    ${escapeHtml(product.product_code || "-")}
                </span>


                <div class="admin-statuses">

                    ${
                        product.active
                            ? `
                                <span class="status active">
                                    ACTIVO
                                </span>
                            `
                            : `
                                <span class="status inactive">
                                    INACTIVO
                                </span>
                            `
                    }


                    ${
                        product.featured
                            ? `
                                <span class="status featured">
                                    DESTACADO
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <h3>
                ${escapeHtml(product.name || "")}
            </h3>


            <div class="admin-product-price">

                ${formatPrice(product.price)}

                ${
                    product.old_price
                        ? `
                            <span>
                                ${formatPrice(product.old_price)}
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="admin-stock-summary">

                <strong>
                    Stock total: ${totalStock}
                </strong>

                <div class="admin-stock-badges">

                    ${
                        sizes.length
                            ? sizes.map(item => `

                                <span
                                    class="stock-badge ${
                                        item.stock <= 0
                                            ? "out"
                                            : ""
                                    }"
                                >

                                    ${escapeHtml(item.size)}:
                                    ${item.stock}

                                </span>

                            `).join("")
                            : `
                                <span class="stock-badge">
                                    Sin talles
                                </span>
                            `
                    }

                </div>

            </div>


            <div class="admin-product-actions">

                <button
                    class="admin-secondary-button"
                    data-action="edit"
                    data-id="${product.id}"
                >
                    EDITAR
                </button>


                <button
                    class="admin-danger-button"
                    data-action="delete"
                    data-id="${product.id}"
                >
                    ELIMINAR
                </button>

            </div>

        </div>

    `;


    return element;

}


/*
===========================================================
NUEVO PRODUCTO
===========================================================
*/

function newProduct() {

    productForm.reset();


    productId.value =
        "";


    productActive.checked =
        true;


    productFeatured.checked =
        false;


    formTitle.textContent =
        "Nuevo producto";


    saveProductBtn.textContent =
        "GUARDAR PRODUCTO";


    sizeRows =
        [];


    renderSizeRows();


    clearFormMessage();


    productFormCard.classList.remove(
        "hidden"
    );


    productFormCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/*
===========================================================
EDITAR PRODUCTO
===========================================================
*/

function editProduct(id) {

    const product =
        adminProducts.find(
            item => item.id === id
        );


    if (!product) {
        return;
    }


    productId.value =
        product.id;


    productCode.value =
        product.product_code || "";


    productName.value =
        product.name || "";


    productCategory.value =
        product.category || "";


    productPrice.value =
        product.price ?? "";


    productOldPrice.value =
        product.old_price ?? "";


    productImage.value =
        "";


    productImageUrl.value =
        product.image_url || "";


    productDescription.value =
        product.description || "";


    productActive.checked =
        Boolean(product.active);


    productFeatured.checked =
        Boolean(product.featured);


    sizeRows =
        normalizeSizes(
            product.sizes
        );


    renderSizeRows();


    formTitle.textContent =
        "Editar producto";


    saveProductBtn.textContent =
        "ACTUALIZAR PRODUCTO";


    clearFormMessage();


    productFormCard.classList.remove(
        "hidden"
    );


    productFormCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/*
===========================================================
TALLES
===========================================================
*/

function addSizeRow(
    size = "",
    stock = 0
) {

    sizeRows.push({

        size:
            String(size),

        stock:
            Number(stock) || 0

    });


    renderSizeRows();

}


function removeSizeRow(index) {

    sizeRows.splice(
        index,
        1
    );


    renderSizeRows();

}


function renderSizeRows() {

    sizesContainer.innerHTML = "";


    noSizesMessage.classList.toggle(
        "hidden",
        sizeRows.length > 0
    );


    sizeRows.forEach(
        (row, index) => {

            const element =
                document.createElement("div");


            element.className =
                "size-stock-row";


            element.innerHTML = `

                <div>

                    <label>
                        Talle
                    </label>

                    <input
                        type="text"
                        class="size-number"
                        value="${escapeAttribute(row.size)}"
                        data-index="${index}"
                        data-field="size"
                        placeholder="38"
                    >

                </div>


                <div>

                    <label>
                        Stock
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="1"
                        value="${Number(row.stock) || 0}"
                        data-index="${index}"
                        data-field="stock"
                    >

                </div>


                <button
                    type="button"
                    class="remove-size-btn"
                    data-index="${index}"
                    title="Eliminar talle"
                >
                    ×
                </button>

            `;


            sizesContainer.appendChild(
                element
            );

        }
    );

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
VALIDAR TALLES
===========================================================
*/

function validateSizes() {

    const normalized =
        sizeRows.map(row => ({

            size:
                String(row.size || "")
                    .trim(),

            stock:
                Number(row.stock)

        }));


    const sizes =
        normalized.filter(
            row => row.size !== ""
        );


    if (
        sizes.length !==
        normalized.length
    ) {

        return {

            valid: false,

            message:
                "Todos los talles deben tener un valor."

        };

    }


    const duplicated =
        sizes.some(
            (item, index) =>
                sizes.findIndex(
                    other =>
                        String(
                            other.size
                        ).toLowerCase() ===
                        String(
                            item.size
                        ).toLowerCase()
                ) !== index
        );


    if (duplicated) {

        return {

            valid: false,

            message:
                "No puede haber talles repetidos."

        };

    }


    const invalidStock =
        sizes.some(
            item =>
                !Number.isInteger(
                    item.stock
                ) ||
                item.stock < 0
        );


    if (invalidStock) {

        return {

            valid: false,

            message:
                "El stock debe ser un número entero igual o mayor a 0."

        };

    }


    return {

        valid: true,

        sizes

    };

}


/*
===========================================================
GUARDAR PRODUCTO
===========================================================
*/

async function saveProduct() {

    clearFormMessage();


    const sizesValidation =
        validateSizes();


    if (!sizesValidation.valid) {

        showFormMessage(
            sizesValidation.message,
            "error"
        );

        return;

    }


    const name =
        productName.value.trim();


    const code =
        productCode.value.trim();


    const price =
        Number(
            productPrice.value
        );


    if (!name) {

        showFormMessage(
            "Ingresá el nombre del producto.",
            "error"
        );

        return;

    }


    if (!code) {

        showFormMessage(
            "Ingresá el código del producto.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        showFormMessage(
            "Ingresá un precio válido.",
            "error"
        );

        return;

    }


    saveProductBtn.disabled =
        true;


    saveProductBtn.textContent =
        "GUARDANDO...";


    try {

        /*
        ---------------------------------------------------
        Imagen
        ---------------------------------------------------
        */

        let imageUrl =
            productImageUrl.value.trim();


        if (
            productImage.files &&
            productImage.files[0]
        ) {

            imageUrl =
                await uploadProductImage(
                    productImage.files[0]
                );

        }


        /*
        ---------------------------------------------------
        Datos
        ---------------------------------------------------
        */

        const productData = {

            product_code:
                code,

            name:
                name,

            description:
                productDescription.value.trim(),

            price:
                price,

            old_price:
                productOldPrice.value
                    ? Number(
                        productOldPrice.value
                    )
                    : null,

            category:
                productCategory.value.trim() ||
                null,

            image_url:
                imageUrl || null,

            sizes:
                sizesValidation.sizes,

            active:
                productActive.checked,

            featured:
                productFeatured.checked

        };


        const id =
            productId.value;


        let result;


        if (id) {

            result =
                await supabaseClient
                    .from("products")
                    .update(productData)
                    .eq("id", id)
                    .select()
                    .single();

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert(
                        productData
                    )
                    .select()
                    .single();

        }


        if (result.error) {
            throw result.error;
        }


        showFormMessage(
            id
                ? "Producto actualizado correctamente."
                : "Producto creado correctamente.",
            "success"
        );


        await loadAdminProducts();


        setTimeout(
            () => {

                resetProductForm();

            },
            700
        );


    } catch (error) {

        console.error(error);


        let message =
            error.message ||
            "No se pudo guardar el producto.";


        if (
            error.code === "23505" ||
            message
                .toLowerCase()
                .includes("duplicate")
        ) {

            message =
                "El código de producto ya existe. Usá uno diferente.";

        }


        if (
            message
                .toLowerCase()
                .includes("bucket")
        ) {

            message =
                "No se encontró el bucket product-images.";

        }


        showFormMessage(
            message,
            "error"
        );

    } finally {

        saveProductBtn.disabled =
            false;


        saveProductBtn.textContent =
            productId.value
                ? "ACTUALIZAR PRODUCTO"
                : "GUARDAR PRODUCTO";

    }

}


/*
===========================================================
SUBIR IMAGEN
===========================================================
*/

async function uploadProductImage(file) {

    if (!file) {
        return null;
    }


    if (file.size > 5 * 1024 * 1024) {

        throw new Error(
            "La imagen no puede superar los 5 MB."
        );

    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Formato de imagen no válido. Usá JPG, PNG o WEBP."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const filePath =
        `products/${crypto.randomUUID()}.${extension}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


    if (error) {
        throw error;
    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(
                filePath
            );


    return data.publicUrl;

}


/*
===========================================================
ELIMINAR PRODUCTO
===========================================================
*/

async function deleteProduct(id) {

    const product =
        adminProducts.find(
            item => item.id === id
        );


    if (!product) {
        return;
    }


    const confirmation =
        confirm(
            `¿Querés eliminar "${product.name}"?`
        );


    if (!confirmation) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("products")
                .delete()
                .eq("id", id);


        if (error) {
            throw error;
        }


        await loadAdminProducts();


    } catch (error) {

        console.error(error);


        alert(
            "No se pudo eliminar el producto:\n\n" +
            error.message
        );

    }

}


/*
===========================================================
RESET FORM
===========================================================
*/

function resetProductForm() {

    productForm.reset();


    productId.value =
        "";


    productActive.checked =
        true;


    productFeatured.checked =
        false;


    sizeRows =
        [];


    renderSizeRows();


    formTitle.textContent =
        "Nuevo producto";


    saveProductBtn.textContent =
        "GUARDAR PRODUCTO";


    clearFormMessage();


    productFormCard.classList.add(
        "hidden"
    );

}


/*
===========================================================
MENSAJES
===========================================================
*/

function showFormMessage(
    message,
    type
) {

    productFormMessage.textContent =
        message;


    productFormMessage.className =
        `admin-message ${type}`;

}


function clearFormMessage() {

    productFormMessage.textContent =
        "";

    productFormMessage.className =
        "admin-message hidden";

}


function showLoginError(
    message
) {

    loginError.textContent =
        message;

    loginError.className =
        "admin-message error";

}


function clearLoginError() {

    loginError.textContent =
        "";

    loginError.className =
        "admin-message error hidden";

}


/*
===========================================================
PANTALLAS
===========================================================
*/

function showLogin() {

    loginScreen.classList.remove(
        "hidden"
    );

    adminPanel.classList.add(
        "hidden"
    );

}


function showAdminPanel() {

    loginScreen.classList.add(
        "hidden"
    );

    adminPanel.classList.remove(
        "hidden"
    );

}


/*
===========================================================
EVENTOS
===========================================================
*/

function setupAdminEvents() {

    loginForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            login();

        }
    );


    logoutBtn.addEventListener(
        "click",
        logout
    );


    newProductBtn.addEventListener(
        "click",
        newProduct
    );


    cancelEditBtn.addEventListener(
        "click",
        resetProductForm
    );


    productForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            saveProduct();

        }
    );


    adminSearch.addEventListener(
        "input",
        renderAdminProducts
    );


    addSizeBtn.addEventListener(
        "click",
        () => addSizeRow()
    );


    sizesContainer.addEventListener(
        "input",
        event => {

            const input =
                event.target;


            const index =
                Number(
                    input.dataset.index
                );


            const field =
                input.dataset.field;


            if (
                Number.isNaN(index) ||
                !field ||
                !sizeRows[index]
            ) {

                return;

            }


            if (
                field === "size"
            ) {

                sizeRows[index].size =
                    input.value;

            }


            if (
                field === "stock"
            ) {

                sizeRows[index].stock =
                    parseInt(
                        input.value,
                        10
                    ) || 0;

            }

        }
    );


    sizesContainer.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".remove-size-btn"
                );


            if (!button) {
                return;
            }


            removeSizeRow(
                Number(
                    button.dataset.index
                )
            );

        }
    );


    adminProductsContainer.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action === "edit"
            ) {

                editProduct(id);

            }


            if (
                action === "delete"
            ) {

                deleteProduct(id);

            }

        }
    );

}


/*
===========================================================
FORMATO
===========================================================
*/

function formatPrice(value) {

    return new Intl.NumberFormat(
        STORE_CONFIG.locale || "es-AR",
        {
            style: "currency",
            currency:
                STORE_CONFIG.currency || "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    );

}


/*
===========================================================
ERRORES LOGIN
===========================================================
*/

function getAuthErrorMessage(
    error
) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Email o contraseña incorrectos.";

    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "El email todavía no fue confirmado.";

    }


    return (
        error?.message ||
        "No se pudo iniciar sesión."
    );

}


/*
===========================================================
ESCAPE HTML
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