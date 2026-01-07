// Centralized configuration
export const API_URL = import.meta.env.VITE_API_URL || "https://final-crm-backend.onrender.com/api";
export const APP_VERSION = "1.0.1"; // Bump this version whenever you deploy to verify changes
console.log(`App Version: ${APP_VERSION} | API URL: ${API_URL}`);