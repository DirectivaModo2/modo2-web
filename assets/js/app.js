/**
 * =============================================================================
 * app.js - MODO 2 Operating System
 * Landing Page Interactiva | Gamificación | SPA Navigation
 * =============================================================================
 * Versión: 1.0.0
 * Última actualización: 2026
 * Autor: Flyjoy / MODO 2
 * =============================================================================
 */

// =============================================================================
// 1. CONFIGURACIÓN GLOBAL
// =============================================================================

const CONFIG = {
  appName: 'MODO 2',
  version: '1.0.0',
  brand: 'modo2', // Cambiar a 'flyjoy' para activar paleta alternativa
  maxLevel: 10,
  xpPerVisit: 10,
  xpPerLevel: 100,
  storageKeys: {
    userData: 'modo2_user',
    visits: 'modo2_visits',
    privacy: 'modo2_privacy_accepted'
  },
  firebase: {
    enabled: false, // Cambiar a true cuando Firebase esté configurado
    config: null // Se poblará con firebase-config.js
  }
};

// =============================================================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN
// =============================================================================

const AppState = {
  currentUser: null,
  xp: 0,
  level: 0,
  visits: 0,
  currentPage: 'home',
  firebaseConnected: false,
  initialized: false,
  xpHistory: []
};

// =============================================================================
// 3. SISTEMA DE RANGOS Y NIVELES
// =============================================================================

const RANKS = {
  0: { name: 'INVITADO', color: '#8a8a8a', icon: '👤' },
  1: { name: 'OBSERVADOR', color: '#00f2ff', icon: '👁️' },
  2: { name: 'OBSERVADOR+', color: '#00f2ff', icon: '👁️✨' },
  3: { name: 'OBSERVADOR COTILLA', color: '#ff0057', icon: '🔍' },
  4: { name: 'PILOTO NOVEL', color: '#7b2cbf', icon: '🚁' },
  5: { name: 'PILOTO', color: '#7b2cbf', icon: '🚁✨' },
  6: { name: 'PILOTO EXPERTO', color: '#9d4edd', icon: '🚁⚡' },
  7: { name: 'COMANDANTE', color: '#ff6b6b', icon: '🎖️' },
  8: { name: 'COMANDANTE+', color: '#ff6b6b', icon: '🎖️✨' },
  9: { name: 'COMANDANTE ÉLITE', color: '#ffd93d', icon: '🏆' },
  10: { name: 'LEYENDA', color: '#ffd93d', icon: '👑' }
};

// =============================================================================
// 4. INICIALIZACIÓN DE LA APLICACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Función principal de inicialización
 * Se ejecuta cuando el DOM está completamente cargado
 */
function initApp() {
  try {
    console.log(`[${CONFIG.appName}] v${CONFIG.version} - Inicializando...`);
    
    // 1. Cargar datos persistidos
    loadUserData();
    
    // 2. Incrementar contador de visitas
    incrementVisits();
    
    // 3. Actualizar interfaz de usuario
    updateXPDisplay();
    updateUserInfo();
    
    // 4. Verificar estado de Firebase
    checkFirebaseStatus();
    
    // 5. Inicializar efectos visuales
    initEffects();
    
    // 6. Configurar event listeners globales
    initGlobalListeners();
    
    // 7. Mostrar banner de privacidad si es necesario
    checkPrivacyBanner();
    
    // 8. Marcar como inicializado
    AppState.initialized = true;
    
    console.log(`[${CONFIG.appName}] ✅ Inicialización completada`);
    
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error en inicialización:`, error);
    showFirebaseStatus('ERROR_INICIALIZACIÓN', 'error');
  }
}

// =============================================================================
// 5. GESTIÓN DE DATOS DE USUARIO (localStorage fallback)
// =============================================================================

/**
 * Carga los datos del usuario desde localStorage
 * @returns {Object} Datos del usuario o null si no existen
 */
function loadUserData() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKeys.userData);
    if (saved) {
      const data = JSON.parse(saved);
      AppState.currentUser = data.currentUser || null;
      AppState.xp = data.xp || 0;
      AppState.level = data.level || 0;
      AppState.xpHistory = data.xpHistory || [];
      console.log(`[${CONFIG.appName}] 📦 Datos cargados: Nivel ${AppState.level}, ${AppState.xp} XP`);
      return data;
    }
    console.log(`[${CONFIG.appName}] 📭 No hay datos guardados`);
    return null;
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error cargando datos:`, error);
    return null;
  }
}

/**
 * Guarda los datos del usuario en localStorage
 */
function saveUserData() {
  try {
    const data = {
      currentUser: AppState.currentUser,
      xp: AppState.xp,
      level: AppState.level,
      xpHistory: AppState.xpHistory,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem(CONFIG.storageKeys.userData, JSON.stringify(data));
    console.log(`[${CONFIG.appName}] 💾 Datos guardados`);
    return true;
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error guardando datos:`, error);
    return false;
  }
}

/**
 * Gestiona el contador de visitas
 */
function incrementVisits() {
  try {
    let visits = parseInt(localStorage.getItem(CONFIG.storageKeys.visits)) || 0;
    visits++;
    localStorage.setItem(CONFIG.storageKeys.visits, visits.toString());
    AppState.visits = visits;
    
    // Añadir XP por visita (solo si no es la primera)
    if (visits > 1) {
      addXP(CONFIG.xpPerVisit, 'visita');
    }
    
    console.log(`[${CONFIG.appName}] 👁️ Visitas: ${visits}`);
    return visits;
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error en contador de visitas:`, error);
    return 0;
  }
}

// =============================================================================
// 6. SISTEMA DE GAMIFICACIÓN (XP, NIVELES, RANGOS)
// =============================================================================

/**
 * Añade experiencia al usuario
 * @param {number} amount - Cantidad de XP a añadir
 * @param {string} reason - Motivo de la ganancia de XP
 * @returns {boolean} Éxito de la operación
 */
function addXP(amount, reason = 'general') {
  try {
    const oldLevel = AppState.level;
    AppState.xp += amount;
    AppState.xpHistory.push({
      amount,
      reason,
      timestamp: new Date().toISOString(),
      totalAfter: AppState.xp
    });
    
    // Calcular nuevo nivel
    const newLevel = calculateLevel(AppState.xp);
    
    if (newLevel > oldLevel) {
      AppState.level = newLevel;
      console.log(`[${CONFIG.appName}] ⬆️ ¡SUBIDA DE NIVEL! ${oldLevel} → ${newLevel}`);
      
      // Mostrar notificación si sube de nivel
      if (newLevel === CONFIG.maxLevel) {
        showXpPopup();
      }
    }
    
    // Guardar y actualizar UI
    saveUserData();
    updateXPDisplay();
    
    return true;
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error añadiendo XP:`, error);
    return false;
  }
}

/**
 * Calcula el nivel basado en la experiencia total
 * @param {number} xp - Experiencia total
 * @returns {number} Nivel calculado (0-10)
 */
function calculateLevel(xp) {
  const level = Math.min(
    CONFIG.maxLevel,
    Math.floor(xp / CONFIG.xpPerLevel)
  );
  return Math.max(0, level);
}

/**
 * Obtiene la información del rango actual
 * @returns {Object} Datos del rango
 */
function getCurrentRank() {
  return RANKS[AppState.level] || RANKS[0];
}

/**
 * Actualiza la interfaz de XP en el DOM
 */
function updateXPDisplay() {
  try {
    // Elementos del DOM
    const xpFill = document.getElementById('xpFill');
    const xpText = document.getElementById('xpText');
    const levelDisplay = document.getElementById('levelDisplay');
    const userLevel = document.getElementById('userLevel');
    const userRank = document.getElementById('userRank');
    
    if (!xpFill || !xpText || !levelDisplay) return;
    
    // Calcular progreso
    const xpForNextLevel = CONFIG.xpPerLevel * (AppState.level + 1);
    const xpInCurrentLevel = AppState.xp % CONFIG.xpPerLevel;
    const progress = Math.min(100, (xpInCurrentLevel / CONFIG.xpPerLevel) * 100);
    
    // Actualizar barra de XP
    xpFill.style.width = `${progress}%`;
    xpText.textContent = `${AppState.xp} XP`;
    
    // Actualizar nivel y rango
    levelDisplay.textContent = `NIVEL ${AppState.level}`;
    
    const rank = getCurrentRank();
    if (userLevel) userLevel.textContent = rank.name;
    if (userRank) {
      userRank.textContent = `${rank.icon} ${rank.name}`;
      userRank.style.color = rank.color;
    }
    
    // Actualizar contador de visitas en popup si está abierto
    const visitCount = document.getElementById('visitCount');
    const xpCount = document.getElementById('xpCount');
    if (visitCount) visitCount.textContent = AppState.visits;
    if (xpCount) xpCount.textContent = AppState.xp;
    
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error actualizando XP UI:`, error);
  }
}

/**
 * Actualiza la información del usuario en el dashboard
 */
function updateUserInfo() {
  try {
    const userName = document.getElementById('userName');
    const loginBtn = document.getElementById('loginBtn');
    
    if (AppState.currentUser) {
      // Usuario logueado
      if (userName) userName.textContent = AppState.currentUser.name || 'PILOTO';
      if (loginBtn) {
        loginBtn.textContent = `${AppState.currentUser.name || 'PILOTO'} • ${getCurrentRank().name}`;
        loginBtn.onclick = openUserProfile;
      }
    } else {
      // Invitado
      if (userName) userName.textContent = 'INVITADO';
      if (loginBtn) {
        loginBtn.textContent = 'INVITADO / ACCESO RESTRINGIDO';
        loginBtn.onclick = openLoginModal;
      }
    }
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error actualizando info usuario:`, error);
  }
}

// =============================================================================
// 7. SISTEMA DE NAVEGACIÓN SPA
// =============================================================================

/**
 * Cambia a una página específica (Single Page Application)
 * @param {string} pageName - Nombre de la página a mostrar
 */
function showPage(pageName) {
  try {
    console.log(`[${CONFIG.appName}] 🔄 Navegando a: ${pageName}`);
    
    // Ocultar todas las páginas
    document.querySelectorAll('.content-page').forEach(page => {
      page.classList.remove('active');
    });
    
    // Mostrar la página seleccionada
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      AppState.currentPage = pageName;
      
      // Añadir XP por navegación (opcional)
      if (pageName !== AppState.currentPage) {
        addXP(2, `navegacion:${pageName}`);
      }
      
      // Actualizar estado activo en navegación
      updateNavActiveState(pageName);
      
      console.log(`[${CONFIG.appName}] ✅ Página activa: ${pageName}`);
    } else {
      console.warn(`[${CONFIG.appName}] ⚠️ Página no encontrada: ${pageName}-page`);
    }
    
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error en navegación:`, error);
  }
}

/**
 * Vuelve a la página de inicio
 */
function showHome() {
  showPage('home');
}

/**
 * Actualiza el estado visual de la navegación
 * @param {string} activePage - Página actualmente activa
 */
function updateNavActiveState(activePage) {
  // Implementación para destacar el icono activo
  // Se puede expandir según necesites
  console.log(`[${CONFIG.appName}] 🧭 Estado navegación: ${activePage}`);
}

// =============================================================================
// 8. GESTIÓN DE MODALES
// =============================================================================

/**
 * Abre el modal de registro
 */
function openModal() {
  const modal = document.getElementById('registerModal');
  if (modal) {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    // Enfocar primer input para accesibilidad
    setTimeout(() => {
      const firstInput = modal.querySelector('input:not([disabled])');
      if (firstInput) firstInput.focus();
    }, 100);
    console.log(`[${CONFIG.appName}] 🔓 Modal registro abierto`);
  }
}

/**
 * Cierra el modal de registro
 */
function closeModal() {
  const modal = document.getElementById('registerModal');
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    console.log(`[${CONFIG.appName}] 🔒 Modal registro cerrado`);
  }
}

/**
 * Abre el modal de login
 */
function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const firstInput = modal.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
    console.log(`[${CONFIG.appName}] 🔐 Modal login abierto`);
  }
}

/**
 * Cierra el modal de login
 */
function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    console.log(`[${CONFIG.appName}] 🔒 Modal login cerrado`);
  }
}

/**
 * Maneja el envío del formulario de registro
 * @param {Event} event - Evento de submit
 */
function handleRegister(event) {
  event.preventDefault();
  
  // Sistema de registro actualmente deshabilitado
  console.log(`[${CONFIG.appName}] ⚠️ Registro temporalmente bloqueado`);
  
  // Mostrar mensaje al usuario
  alert('🔧 SISTEMA DE REGISTRO EN MANTENIMIENTO\n\nPróximamente disponible para socios fundadores.');
  
  // Aquí iría la lógica real cuando se active:
  /*
  try {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    // ... validaciones ...
    // Firebase: createUserWithEmailAndPassword(auth, email, password)
  } catch (error) {
    console.error('Error en registro:', error);
  }
  */
}

/**
 * Maneja el envío del formulario de login
 * @param {Event} event - Evento de submit
 */
function handleLogin(event) {
  event.preventDefault();
  try {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    
    console.log(`[${CONFIG.appName}] 🔑 Intento de login: ${username}`);

    // Validación básica
    if (!username || !password) {
      alert('⚠️ Por favor, completa todos los campos');
      return;
    }

    // Modo demo: login simulado (eliminar en producción)
    if (CONFIG.firebase.enabled === false) {
      console.log(`[${CONFIG.appName}] 🎭 Modo demo: login simulado`);
      
      // Crear usuario simulado - CORRECCIÓN AQUÍ
      const userName = username.split('@')[0].toUpperCase() || 'PILOTO';
      
      AppState.currentUser = {
        id: 'demo_user_' + Date.now(),
        name: userName,
        email: username,
        joined: new Date().toISOString()
      };
      
      // Añadir XP por login
      addXP(25, 'login');
      
      // Actualizar UI
      updateUserInfo();
      updateXPDisplay();
      
      // Cerrar modal
      closeLoginModal();
      
      // Mostrar mensaje de éxito
      showFirebaseStatus('✅ SESIÓN INICIADA (DEMO)', 'success');
      
      return;
    }
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error en login:`, error);
    showFirebaseStatus('ERROR_LOGIN', 'error');
  }
}
/**
 * Abre el perfil de usuario (placeholder)
 */
function openUserProfile() {
  console.log(`[${CONFIG.appName}] 👤 Abriendo perfil de: ${AppState.currentUser?.name}`);
  // Implementar según necesidades
  alert(`👤 PERFIL DE USUARIO\n\nNombre: ${AppState.currentUser?.name || 'PILOTO'}\nNivel: ${AppState.level}\nXP: ${AppState.xp}\nRango: ${getCurrentRank().name}`);
}

// =============================================================================
// 9. EFECTOS VISUALES E INTERACTIVIDAD
// =============================================================================

/**
 * Inicializa los efectos visuales de la página
 */
function initEffects() {
  initDroneTrails();
  initGlitchEffects();
  initScanlines();
}

/**
 * Efecto de estelas de drones en el background
 */
function initDroneTrails() {
  const container = document.getElementById('drone-trails-container');
  
  // Verificar que el contenedor existe en el HTML
  if (!container) {
    console.warn('[MODO 2] ⚠️ Elemento #drone-trails-container no existe en el HTML');
    console.warn('[MODO 2] 💡 Añade: <div id="drone-trails-container" aria-hidden="true"></div>');
    return; // Salir sin error
  }
  
  // Crear partículas de estela (limitadas para performance)
  const particleCount = Math.min(15, Math.floor(window.innerWidth / 100));
  
  for (let i = 0; i < particleCount; i++) {
    createDroneTrail(container);
  }
  
  // Animación continua
  animateDroneTrails(container);
}

/**
 * Crea una partícula de estela de drone
 * @param {HTMLElement} container - Contenedor donde añadir la partícula
 */
function createDroneTrail(container) {
  // Verificar que el contenedor existe
  if (!container) {
    console.warn('[MODO 2] ⚠️ Drone trails container no encontrado');
    return;
  }
  
  try {
    const trail = document.createElement('div');
    trail.className = 'drone-trail';
    trail.style.cssText = `
      position: absolute;
      width: 2px;
      height: 2px;
      background: var(--accent);
      border-radius: 50%;
      opacity: 0.6;
      pointer-events: none;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      box-shadow: 0 0 10px var(--accent);
    `;
    container.appendChild(trail);
    
    // Animar y remover después
    animateTrail(trail);
  } catch (error) {
    console.error('[MODO 2] ❌ Error creando drone trail:', error);
  }
}

/**
 * Anima una partícula de estela
 * @param {HTMLElement} trail - Elemento a animar
 */
function animateTrail(trail) {
  const duration = 3000 + Math.random() * 4000;
  const startX = parseFloat(trail.style.left);
  const startY = parseFloat(trail.style.top);
  
  trail.animate([
    { 
      transform: `translate(0, 0) scale(1)`,
      opacity: 0.6
    },
    { 
      transform: `translate(${(Math.random() - 0.5) * 100}px, ${-50 - Math.random() * 100}px) scale(0)`,
      opacity: 0
    }
  ], {
    duration,
    easing: 'ease-out',
    fill: 'forwards'
  });
  
  // Remover y recrear después de la animación
  setTimeout(() => {
    if (trail.parentNode) {
      trail.parentNode.removeChild(trail);
      createDroneTrail(trail.parentNode);
    }
  }, duration);
}

/**
 * Anima las estelas de drones continuamente
 * @param {HTMLElement} container - Contenedor de estelas
 */
function animateDroneTrails(container) {
  // Crear nueva partícula periódicamente
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      createDroneTrail(container);
    }
  }, 800);
  
  // Limpiar intervalo si la página se oculta
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearInterval(interval);
    }
  });
}

/**
 * Inicializa efectos glitch en elementos con clase .glitch
 */
function initGlitchEffects() {
  const glitchElements = document.querySelectorAll('.glitch');
  
  glitchElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.animationPlayState = 'running';
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.animationPlayState = 'paused';
    });
  });
}

/**
 * Controla el efecto de scanlines
 */
function initScanlines() {
  const scanlines = document.querySelector('.scanlines');
  if (!scanlines) return;
  
  // Permitir toggle con tecla 'S' (para desarrollo)
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 's' && e.ctrlKey) {
      e.preventDefault();
      scanlines.style.display = scanlines.style.display === 'none' ? 'block' : 'none';
      console.log(`[${CONFIG.appName}] 📺 Scanlines: ${scanlines.style.display === 'none' ? 'OFF' : 'ON'}`);
    }
  });
}

// =============================================================================
// 10. EVENT LISTERS GLOBALES
// =============================================================================

/**
 * Configura los event listeners globales de la aplicación
 */
function initGlobalListeners() {
  // Cerrar modales con tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeLoginModal();
      closeXpPopup();
    }
  });
  
  // Cerrar modales al hacer click fuera
  document.addEventListener('click', (e) => {
    const modals = ['registerModal', 'loginModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal && !modal.hidden && e.target === modal) {
        modalId === 'registerModal' ? closeModal() : closeLoginModal();
      }
    });
  });
  
  // Prevenir comportamiento por defecto en enlaces de navegación SPA
  document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
    });
  });
  
  // Efecto hover en botones (feedback visual)
  document.querySelectorAll('.submit-btn, .status-badge, .nav-icon-wrapper').forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (!this.disabled) {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
          this.style.transform = '';
        }, 100);
      }
    });
  });
  
  console.log(`[${CONFIG.appName}] 🎧 Event listeners globales activos`);
}

// =============================================================================
// 11. SISTEMA DE PRIVACIDAD Y COOKIES
// =============================================================================

/**
 * Verifica y muestra el banner de privacidad si es necesario
 */
function checkPrivacyBanner() {
  try {
    const banner = document.getElementById('privacyBanner');
    if (!banner) {
      console.warn('[MODO 2] ⚠️ Banner de privacidad no existe en HTML');
      return;
    }
    
    const accepted = localStorage.getItem(CONFIG.storageKeys.privacy);
    
    if (!accepted) {
      banner.hidden = false;
      banner.style.display = 'flex'; // Forzar visualización
      console.log('[MODO 2] 🔐 Banner de privacidad mostrado');
    } else {
      banner.hidden = true;
      console.log('[MODO 2] ✅ Privacidad ya aceptada');
    }
  } catch (error) {
    console.error('[MODO 2] ❌ Error en banner de privacidad:', error);
  }
}  

/**
 * Marca la privacidad como aceptada y oculta el banner
 */
function acceptPrivacy() {
  try {
    localStorage.setItem(CONFIG.storageKeys.privacy, 'true');
    const banner = document.getElementById('privacyBanner');
    if (banner) {
      banner.hidden = true;
    }
    console.log(`[${CONFIG.appName}] ✅ Privacidad aceptada`);
    
    // Añadir XP por aceptar (opcional)
    addXP(5, 'privacidad');
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error aceptando privacidad:`, error);
  }
}

// =============================================================================
// 12. POPUP DE XP MÁXIMO
// =============================================================================

/**
 * Muestra el popup de nivel máximo alcanzado
 */
function showXpPopup() {
  try {
    const popup = document.getElementById('xpPopup');
    const overlay = document.getElementById('xpPopupOverlay');
    
    if (popup && overlay) {
      // Actualizar stats en el popup
      const visitCount = document.getElementById('visitCount');
      const xpCount = document.getElementById('xpCount');
      if (visitCount) visitCount.textContent = AppState.visits;
      if (xpCount) xpCount.textContent = AppState.xp;
      
      // Mostrar
      popup.hidden = false;
      popup.setAttribute('aria-hidden', 'false');
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      
      // Enfocar botón para accesibilidad
      setTimeout(() => {
        const btn = popup.querySelector('button');
        if (btn) btn.focus();
      }, 100);
      
      console.log(`[${CONFIG.appName}] 🎉 Popup XP máximo mostrado`);
    }
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error mostrando popup XP:`, error);
  }
}

/**
 * Cierra el popup de XP máximo
 */
function closeXpPopup() {
  try {
    const popup = document.getElementById('xpPopup');
    const overlay = document.getElementById('xpPopupOverlay');
    
    if (popup) {
      popup.hidden = true;
      popup.setAttribute('aria-hidden', 'true');
    }
    if (overlay) {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
    }
    
    console.log(`[${CONFIG.appName}] 🔒 Popup XP cerrado`);
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error cerrando popup XP:`, error);
  }
}

// =============================================================================
// 13. ESTADO DE FIREBASE Y CONEXIÓN
// =============================================================================

/**
 * Verifica y muestra el estado de conexión con Firebase
 */
function checkFirebaseStatus() {
  try {
    const statusEl = document.getElementById('firebaseStatus');
    if (!statusEl) return;
    
    if (CONFIG.firebase.enabled && typeof firebase !== 'undefined') {
      // Firebase está habilitado y cargado
      AppState.firebaseConnected = true;
      showFirebaseStatus('MAINFRAME: CONECTADO', 'success');
      console.log(`[${CONFIG.appName}] 🔗 Firebase conectado`);
      
      // Aquí iría: onAuthStateChanged(auth, (user) => { ... });
      
    } else if (CONFIG.firebase.enabled) {
      // Firebase habilitado pero no cargado
      showFirebaseStatus('MAINFRAME: CARGANDO...', 'warning');
      console.warn(`[${CONFIG.appName}] ⏳ Firebase cargando...`);
      
    } else {
      // Firebase deshabilitado (modo offline)
      AppState.firebaseConnected = false;
      showFirebaseStatus('MODO OFFLINE • localStorage', 'offline');
      console.log(`[${CONFIG.appName}] 📴 Modo offline activo (localStorage)`);
    }
    
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error verificando Firebase:`, error);
    showFirebaseStatus('ERROR_CONEXIÓN', 'error');
  }
}

/**
 * Muestra un mensaje de estado de Firebase
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de estado: 'success' | 'warning' | 'error' | 'offline'
 */
function showFirebaseStatus(message, type = 'info') {
  const statusEl = document.getElementById('firebaseStatus');
  if (!statusEl) return;
  
  const statusText = statusEl.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = message;
    
    // Actualizar color del indicador
    const indicator = statusText.querySelector('span') || statusText;
    const colors = {
      success: '#00f2ff',
      warning: '#ffd93d',
      error: '#ff3b3b',
      offline: '#8a8a8a',
      info: '#00f2ff'
    };
    indicator.style.color = colors[type] || colors.info;
  }
  
  console.log(`[${CONFIG.appName}] 📡 Estado: ${message}`);
}

// =============================================================================
// 14. UTILIDADES Y HELPERS
// =============================================================================

/**
 * Función debounce para optimizar eventos frecuentes
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
function formatNumber(num) {
  return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Obtiene la fecha actual formateada
 * @returns {string} Fecha en formato DD/MM/YYYY
 */
function getFormattedDate() {
  return new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Log seguro que solo funciona en desarrollo
 * @param {...any} args - Argumentos para console.log
 */
function debugLog(...args) {
  if (CONFIG.version.includes('dev') || location.hostname === 'localhost') {
    console.log(`[${CONFIG.appName}]`, ...args);
  }
}

// =============================================================================
// 15. FUNCIONES PLACEHOLDER PARA FIREBASE (PREPARACIÓN)
// =============================================================================

/**
 * [PLACEHOLDER] Sincroniza datos del usuario con Firestore
 * Se activará cuando Firebase esté configurado
 */
async function syncUserData() {
  if (!CONFIG.firebase.enabled || !AppState.firebaseConnected) {
    console.log(`[${CONFIG.appName}] ⏭️ Sync saltado: Firebase no activo`);
    return;
  }
  
  try {
    // import { doc, setDoc } from 'firebase/firestore';
    // import { db } from './firebase-config.js';
    
    /*
    await setDoc(doc(db, 'users', AppState.currentUser.id), {
      xp: AppState.xp,
      level: AppState.level,
      visits: AppState.visits,
      xpHistory: AppState.xpHistory.slice(-50), // Últimos 50 registros
      lastSync: new Date().toISOString()
    }, { merge: true });
    */
    
    console.log(`[${CONFIG.appName}] 🔄 Datos sincronizados con Firestore`);
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error sincronizando con Firestore:`, error);
  }
}

/**
 * [PLACEHOLDER] Carga datos del usuario desde Firestore
 */
async function loadUserDataFromFirebase(userId) {
  if (!CONFIG.firebase.enabled || !AppState.firebaseConnected) {
    return null;
  }
  
  try {
    // import { doc, getDoc } from 'firebase/firestore';
    // import { db } from './firebase-config.js';
    
    /*
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    */
    
    return null;
  } catch (error) {
    console.error(`[${CONFIG.appName}] ❌ Error cargando de Firestore:`, error);
    return null;
  }
}

// =============================================================================
// 16. EXPORTS PARA MÓDULOS (si se usa import/export en el futuro)
// =============================================================================

// Para compatibilidad con módulos ES6 en el futuro:
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    AppState,
    RANKS,
    initApp,
    addXP,
    calculateLevel,
    getCurrentRank,
    showPage,
    openModal,
    closeModal,
    openLoginModal,
    closeLoginModal,
    handleLogin,
    handleRegister,
    acceptPrivacy,
    closeXpPopup,
    debounce,
    formatNumber
  };
}

// Fin del archivo app.js
console.log(`[${CONFIG.appName}] ✅ app.js cargado completamente`);
