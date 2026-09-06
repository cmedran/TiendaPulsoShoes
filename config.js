// ============================================================
// CONFIGURACIÓN GENERAL DE LA TIENDA
// ============================================================

// URL de tu proyecto Supabase
const SUPABASE_URL = "https://fodhuzbwwcblkcfqgqvj.supabase.co";

// IMPORTANTE:
// Utilizá la clave ANON / PUBLISHABLE KEY.
// NUNCA coloques aquí la service_role key.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZGh1emJ3d2NibGtjZnFncXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDEyMDAsImV4cCI6MjEwNDI3NzIwMH0.ieJbdhTlSdJjXlO4VTsSkkcsb2D4DOZihblqUyMXZi4";

// Número de WhatsApp del vendedor.
// Formato internacional, SIN +, espacios ni guiones.
// Ejemplo Argentina: 5491123456789
const WHATSAPP_NUMBER = "5493425005264";

// ============================================================
// CONFIGURACIÓN VISUAL / COMERCIAL
// ============================================================

const STORE_CONFIG = {
    name: "TU TIENDA",
    description: "Calidad, estilo y diseño.",
    
    // Colocá tu logo en:
    // /img/logo.png
    logo: "img/logo.png",

    primaryColor: "#CCFC03",
    secondaryColor: "#000000",

    currency: "ARS",
    locale: "es-AR"
};

// ============================================================
// SUPABASE
// ============================================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ============================================================
// STORAGE
// ============================================================

const STORAGE_BUCKET = "product-images";