// ============================================================
// ESTADO
// ============================================================

let currentUser = null;

let adminProducts = [];

let editingProductId = null;


// ============================================================
// ELEMENTOS
// ============================================================

const loginScreen =
    document.getElementById("loginScreen");

const adminPanel =
    document.getElementById("adminPanel");

const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");

const logoutBtn =
    document.getElementById("logoutBtn");

const productForm =
    document.getElementById("productForm");

const productFormCard =
    document.getElementById("productFormCard");

const productFormMessage =
    document.getElementById(
        "productFormMessage"
    );

const adminProductsContainer =
    document.getElementById(
        "adminProductsContainer"
    );

const adminSearch =
    document.getElementById(
        "adminSearch"
    );

const formTitle =
    document.getElementById(
        "formTitle"
    );


// ============================================================
// INICIO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function initializeAdmin() {

    const {
        data: {
            session
        }
    } =
        await supabaseClient
            .auth
            .getSession();


    if (session) {

        await handleAuthenticatedUser(
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

                if (session) {

                    await handleAuthenticatedUser(
                        session.user
                    );

                } else {

                    showLogin();

                }

            }
        );

}


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        loginError.textContent = "";

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;


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

            console.error(error);

            loginError.textContent =
                "Email o contraseña incorrectos.";

            return;

        }


        await handleAuthenticatedUser(
            data.user
        );

    }
);


// ============================================================
// COMPROBAR ADMIN
// ============================================================

async function handleAuthenticatedUser(
    user
) {

    currentUser = user;


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

        console.error(error);

        await supabaseClient
            .auth
            .signOut();

        showLogin();

        loginError.textContent =
            "No se pudo verificar el usuario.";

        return;

    }


    if (!data) {

        await supabaseClient
            .auth
            .signOut();

        showLogin();

        loginError.textContent =
            "Este usuario no tiene permisos de administrador.";

        return;

    }


    showAdminPanel();

    resetProductForm();

    await loadAdminProducts();

}


// ============================================================
// MOSTRAR LOGIN
// ============================================================

function showLogin() {

    loginScreen.style.display =
        "flex";

    adminPanel.classList.remove(
        "visible"
    );

}


// ============================================================
// MOSTRAR ADMIN
// ============================================================

function showAdminPanel() {

    loginScreen.style.display =
        "none";

    adminPanel.classList.add(
        "visible"
    );

}


// ============================================================
// LOGOUT
// ============================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();

    }
);


// ============================================================
// CARGAR PRODUCTOS
// ============================================================

async function loadAdminProducts() {

    adminProductsContainer.innerHTML = `
        <div class="loading">
            Cargando productos...
        </div>
    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        adminProductsContainer.innerHTML = `
            <div class="empty-state">
                <h3>Error</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        return;

    }


    adminProducts = data || [];

    renderAdminProducts();

}


// ============================================================
// RENDER ADMIN
// ============================================================

function renderAdminProducts() {

    const search =
        adminSearch.value
            .trim()
            .toLowerCase();


    const filtered =
        adminProducts.filter(product => {

            return (
                !search ||
                product.name
                    ?.toLowerCase()
                    .includes(search) ||
                product.product_code
                    ?.toLowerCase()
                    .includes(search) ||
                product.category
                    ?.toLowerCase()
                    .includes(search)
            );

        });


    if (!filtered.length) {

        adminProductsContainer.innerHTML = `
            <div class="empty-state">
                No hay productos para mostrar.
            </div>
        `;

        return;

    }


    adminProductsContainer.innerHTML =
        filtered.map(
            createAdminProduct
        ).join("");

}


// ============================================================
// PRODUCTO ADMIN
// ============================================================

function createAdminProduct(product) {

    const image =
        product.image_url ||
        "https://placehold.co/100x100?text=Sin+imagen";


    return `

        <article class="admin-product">

            <img
                class="admin-product-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
                onerror="
                    this.src='https://placehold.co/100x100?text=Sin+imagen'
                "
            >


            <div class="admin-product-info">

                <div class="admin-product-code">
                    ${escapeHTML(
                        product.product_code
                    )}
                </div>

                <h3>
                    ${escapeHTML(product.name)}
                </h3>

                <div class="admin-product-meta">

                    ${
                        product.category
                            ? escapeHTML(
                                product.category
                            ) + " · "
                            : ""
                    }

                    ${formatPrice(
                        product.price
                    )}

                </div>


                <span
                    class="
                        admin-product-status
                        ${
                            product.active
                                ? "status-active"
                                : "status-inactive"
                        }
                    "
                >

                    ${
                        product.active
                            ? "ACTIVO"
                            : "INACTIVO"
                    }

                </span>

                ${
                    product.featured
                        ? `
                            <span
                                class="
                                    admin-product-status
                                    status-active
                                "
                            >
                                DESTACADO
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="admin-product-actions">

                <button
                    class="btn btn-outline edit-product"
                    data-id="${product.id}"
                    type="button"
                >
                    Editar
                </button>

                <button
                    class="btn btn-danger delete-product"
                    data-id="${product.id}"
                    type="button"
                >
                    Eliminar
                </button>

            </div>

        </article>

    `;

}


// ============================================================
// EVENTOS LISTADO
// ============================================================

adminProductsContainer.addEventListener(
    "click",
    async event => {

        const editButton =
            event.target.closest(
                ".edit-product"
            );

        const deleteButton =
            event.target.closest(
                ".delete-product"
            );


        if (editButton) {

            const product =
                adminProducts.find(
                    p =>
                        p.id ===
                        editButton.dataset.id
                );

            if (product) {

                loadProductIntoForm(
                    product
                );

            }

        }


        if (deleteButton) {

            await deleteProduct(
                deleteButton.dataset.id
            );

        }

    }
);


// ============================================================
// EDITAR PRODUCTO
// ============================================================

function loadProductIntoForm(product) {

    editingProductId =
        product.id;


    formTitle.textContent =
        "Editar producto";


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productCode"
    ).value =
        product.product_code || "";


    document.getElementById(
        "productName"
    ).value =
        product.name || "";


    document.getElementById(
        "productCategory"
    ).value =
        product.category || "";


    document.getElementById(
        "productPrice"
    ).value =
        product.price ?? "";


    document.getElementById(
        "productOldPrice"
    ).value =
        product.old_price ?? "";


    document.getElementById(
        "productSizes"
    ).value =
        Array.isArray(product.sizes)
            ? product.sizes.join(", ")
            : "";


    document.getElementById(
        "productImageUrl"
    ).value =
        product.image_url || "";


    document.getElementById(
        "productDescription"
    ).value =
        product.description || "";


    document.getElementById(
        "productActive"
    ).checked =
        product.active !== false;


    document.getElementById(
        "productFeatured"
    ).checked =
        product.featured === true;


    productFormCard.scrollIntoView({
        behavior: "smooth"
    });

}


// ============================================================
// NUEVO PRODUCTO
// ============================================================

document
    .getElementById("newProductBtn")
    .addEventListener(
        "click",
        resetProductForm
    );


document
    .getElementById("cancelEditBtn")
    .addEventListener(
        "click",
        resetProductForm
    );


function resetProductForm() {

    editingProductId = null;

    formTitle.textContent =
        "Nuevo producto";

    productForm.reset();

    document.getElementById(
        "productActive"
    ).checked = true;

    productFormMessage.textContent = "";

}


// ============================================================
// GUARDAR PRODUCTO
// ============================================================

productForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const saveButton =
            document.getElementById(
                "saveProductBtn"
            );


        saveButton.disabled = true;

        saveButton.textContent =
            "Guardando...";


        try {

            const productCode =
                document
                    .getElementById(
                        "productCode"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            const name =
                document
                    .getElementById(
                        "productName"
                    )
                    .value
                    .trim();


            const category =
                document
                    .getElementById(
                        "productCategory"
                    )
                    .value
                    .trim();


            const price =
                Number(
                    document
                        .getElementById(
                            "productPrice"
                        )
                        .value
                );


            const oldPriceValue =
                document
                    .getElementById(
                        "productOldPrice"
                    )
                    .value;


            const oldPrice =
                oldPriceValue === ""
                    ? null
                    : Number(oldPriceValue);


            const sizesText =
                document
                    .getElementById(
                        "productSizes"
                    )
                    .value
                    .trim();


            const sizes =
                sizesText
                    ? sizesText
                        .split(",")
                        .map(
                            size =>
                                size.trim()
                        )
                        .filter(Boolean)
                    : [];


            const description =
                document
                    .getElementById(
                        "productDescription"
                    )
                    .value
                    .trim();


            let imageUrl =
                document
                    .getElementById(
                        "productImageUrl"
                    )
                    .value
                    .trim();


            const active =
                document
                    .getElementById(
                        "productActive"
                    )
                    .checked;


            const featured =
                document
                    .getElementById(
                        "productFeatured"
                    )
                    .checked;


            if (!productCode) {

                throw new Error(
                    "El código del producto es obligatorio."
                );

            }


            if (!name) {

                throw new Error(
                    "El nombre del producto es obligatorio."
                );

            }


            if (
                Number.isNaN(price) ||
                price < 0
            ) {

                throw new Error(
                    "El precio no es válido."
                );

            }


            // --------------------------------------------
            // SUBIR IMAGEN
            // --------------------------------------------

            const imageFile =
                document
                    .getElementById(
                        "productImage"
                    )
                    .files[0];


            if (imageFile) {

                imageUrl =
                    await uploadProductImage(
                        imageFile
                    );

            }


            const productData = {

                product_code:
                    productCode,

                name:
                    name,

                description:
                    description || null,

                price:
                    price,

                old_price:
                    oldPrice,

                category:
                    category || null,

                image_url:
                    imageUrl || null,

                images:
                    imageUrl
                        ? [imageUrl]
                        : [],

                sizes:
                    sizes,

                featured:
                    featured,

                active:
                    active

            };


            let result;


            if (editingProductId) {

                result =
                    await supabaseClient
                        .from("products")
                        .update(
                            productData
                        )
                        .eq(
                            "id",
                            editingProductId
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

                throw result.error;

            }


            showAdminMessage(
                editingProductId
                    ? "Producto actualizado correctamente."
                    : "Producto creado correctamente.",
                true
            );


            resetProductForm();

            await loadAdminProducts();


        } catch (error) {

            console.error(error);

            showAdminMessage(
                getFriendlyError(
                    error
                ),
                false
            );

        } finally {

            saveButton.disabled = false;

            saveButton.textContent =
                "Guardar producto";

        }

    }
);


// ============================================================
// SUBIR IMAGEN A STORAGE
// ============================================================

async function uploadProductImage(
    file
) {

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
            "Formato de imagen no permitido. Utilizá JPG, PNG o WEBP."
        );

    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        throw new Error(
            "La imagen no puede superar los 5 MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const filePath =
        `products/${fileName}`;


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
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {

        console.error(
            "Storage error:",
            error
        );

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


// ============================================================
// ELIMINAR PRODUCTO
// ============================================================

async function deleteProduct(
    id
) {

    const product =
        adminProducts.find(
            p => p.id === id
        );


    if (!product) return;


    const confirmed =
        confirm(
            `¿Eliminar el producto "${product.name}"?`
        );


    if (!confirmed) return;


    const {
        error
    } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            getFriendlyError(
                error
            )
        );

        return;

    }


    await loadAdminProducts();

    showAdminMessage(
        "Producto eliminado correctamente.",
        true
    );

}


// ============================================================
// BUSCADOR ADMIN
// ============================================================

adminSearch.addEventListener(
    "input",
    renderAdminProducts
);


// ============================================================
// MENSAJES
// ============================================================

function showAdminMessage(
    message,
    success
) {

    productFormMessage.textContent =
        message;

    productFormMessage.style.color =
        success
            ? "var(--success)"
            : "var(--danger)";


    setTimeout(() => {

        productFormMessage.textContent =
            "";

    }, 5000);

}


// ============================================================
// ERRORES AMIGABLES
// ============================================================

function getFriendlyError(
    error
) {

    if (!error) {

        return "Ocurrió un error.";

    }


    if (
        error.code ===
        "23505"
    ) {

        return "El código del producto ya existe. Utilizá otro código.";

    }


    if (
        error.message?.includes(
            "Bucket not found"
        )
    ) {

        return `
            No se encontró el bucket "${STORAGE_BUCKET}".
            Ejecutá nuevamente el SQL de configuración de Storage.
        `;

    }


    if (
        error.message?.includes(
            "featured"
        )
    ) {

        return `
            La columna "featured" no existe en la tabla products.
            Ejecutá el SQL completo proporcionado.
        `;

    }


    return error.message ||
        "Ocurrió un error.";

}


// ============================================================
// FORMATO PRECIO
// ============================================================

function formatPrice(
    value
) {

    return new Intl.NumberFormat(
        STORE_CONFIG.locale,
        {
            style: "currency",
            currency: STORE_CONFIG.currency
        }
    ).format(
        Number(value) || 0
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}