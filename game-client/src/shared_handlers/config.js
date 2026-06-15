// Shared base URL for all Flask REST calls made by the shared handler hooks.
// Override at build time with VITE_FLASK_API_URL.
export const API_BASE_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000';

// The /shared prefix is where shared_handlers_bp is mounted.
export const SHARED_API_BASE = `${API_BASE_URL}/shared`;
