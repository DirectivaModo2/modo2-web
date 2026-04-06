/**
 * auth.js - MODO 2 Authentication Module
 * Versión: 1.0.0
 */

// Funciones placeholder - se implementarán al activar Firebase
const authModule = {
  async login(email, password) {
    console.log('[AUTH] Login placeholder');
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
    return null;
  }
};

console.log('[MODO 2] ✅ auth.js cargado');
