// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9188';
export const WS_URL = API_URL.replace(/^http/, 'ws');
