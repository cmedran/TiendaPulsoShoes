/*
===========================================================
CONFIGURACIÓN GENERAL
===========================================================
*/

// IMPORTANTE:
// Conservá acá TU URL actual de Supabase.
// NO uses la service_role key.

const SUPABASE_URL = "https://fodhuzbwwcblkcfqgqvj.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZGh1emJ3d2NibGtjZnFncXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDEyMDAsImV4cCI6MjEwNDI3NzIwMH0.ieJbdhTlSdJjXlO4VTsSkkcsb2D4DOZihblqUyMXZi4";


// Número de WhatsApp del vendedor.
// Formato internacional, sin +, espacios ni guiones.
//
// Argentina:
// 549 + código de área + número
//
// Ejemplo:
// 5491123456789

const WHATSAPP_NUMBER = "5493425005264";


/*
===========================================================
CONFIGURACIÓN DE LA TIENDA
===========================================================
*/

const STORE_CONFIG = {

    name: "PULSO SHOES",

    description:
        "Calidad, estilo y diseño.",

    logo:
        "img/logo.png",

    primaryColor:
        "#CCFC03",

    secondaryColor:
        "#000000",

    currency:
        "ARS",

    locale:
        "es-AR",


    /*
    -------------------------------------------------------
    REDES SOCIALES
    -------------------------------------------------------
    */

    instagram:
        "#",

    facebook:
        "#",

    tiktok:
        "#"

};


/*
===========================================================
SUPABASE
===========================================================
*/

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/*
===========================================================
STORAGE
===========================================================
*/

const STORAGE_BUCKET =
    "product-images";


/*
===========================================================
LOCAL STORAGE
===========================================================
*/

const CART_STORAGE_KEY =
    "store_cart";
