/**
 * auth.js - MODO 2 Authentication Module
 * Esqueleto para integración con Firebase Auth
 */

// Funciones placeholder - se implementarán al activar Firebase
export const authModule = {
  async login(email, password) {
    console.log('[AUTH] Login placeholder');
    // Implementar con Firebase Auth cuando esté listo
    return { success: false, message: 'Sistema de auth en mantenimiento' };
  },
  
  async register(userData) {
    console.log('[AUTH] Register placeholder');
    return { success: false, message: 'Registros cerrados temporalmente' };
  },
  
  async logout() {
    console.log('[AUTH] Logout placeholder');
    return { success: true };
  },
  
  getCurrentUser() {
    return null; // Placeholder
  }
};
