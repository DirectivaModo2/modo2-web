/**
=============================================================================
app.js - MODO 2 Operating System
Landing Page Interactiva | Gamificación | SPA Navigation
=============================================================================
Versión: 1.0.1 (CORREGIDO)
Última actualización: 2026
Autor: Flyjoy / MODO 2
=============================================================================
*/

// =============================================================================
// 1. CONFIGURACIÓN GLOBAL
// =============================================================================
const CONFIG = {
    appName: 'MODO 2',
    version: '1.0.1',
    brand: 'modo2',
    maxLevel: 10,
    xpPerVisit: 10,
    xpPerLevel: 100,
    storageKeys: {
        userData: 'modo2_user',
        visits: 'modo2_visits',
        privacy: 'modo2_privacy_accepted'
    },
    firebase: {
        enabled: false,
        config: null
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

function initApp() {
    try {
        console.log(`[${CONFIG.appName}] v${CONFIG.version} - Inicializando...`);
        
        loadUserData();
        incrementVisits();
        updateXPDisplay();
        updateUserInfo();
        checkFirebaseStatus();
        initEffects();
        initGlobalListeners();
        checkPrivacyBanner();
        
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

function incrementVisits() {
    try {
        let visits = parseInt(localStorage.getItem(CONFIG.storageKeys.visits)) || 0;
        visits++;
        localStorage.setItem(CONFIG.storageKeys.visits, visits.toString());
        AppState.visits = visits;
        
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
        
        const newLevel = calculateLevel(AppState.xp);
        if (newLevel > oldLevel) {
            AppState.level = newLevel;
            console.log(`[${CONFIG.appName}] ⬆️ ¡SUBIDA DE NIVEL! ${oldLevel} → ${newLevel}`);
            if (newLevel === CONFIG.maxLevel) {
                showXpPopup();
            }
        }
        
        saveUserData();
        updateXPDisplay();
        return true;
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error añadiendo XP:`, error);
        return false;
    }
}

function calculateLevel(xp) {
    const level = Math.min(CONFIG.maxLevel, Math.floor(xp / CONFIG.xpPerLevel));
    return Math.max(0, level);
}

function getCurrentRank() {
    return RANKS[AppState.level] || RANKS[0];
}

function updateXPDisplay() {
    try {
        const xpFill = document.getElementById('xpFill');
        const xpText = document.getElementById('xpText');
        const levelDisplay = document.getElementById('levelDisplay');
        const userLevel = document.getElementById('userLevel');
        const userRank = document.getElementById('userRank');
        
        if (!xpFill || !xpText || !levelDisplay) return;
        
        const xpForNextLevel = CONFIG.xpPerLevel * (AppState.level + 1);
        const xpInCurrentLevel = AppState.xp % CONFIG.xpPerLevel;
        const progress = Math.min(100, (xpInCurrentLevel / CONFIG.xpPerLevel) * 100);
        
        xpFill.style.width = `${progress}%`;
        xpText.textContent = `${AppState.xp} XP`;
        levelDisplay.textContent = `NIVEL ${AppState.level}`;
        
        const rank = getCurrentRank();
        if (userLevel) userLevel.textContent = rank.name;
        if (userRank) {
            userRank.textContent = `${rank.icon} ${rank.name}`;
            userRank.style.color = rank.color;
        }
        
        const visitCount = document.getElementById('visitCount');
        const xpCount = document.getElementById('xpCount');
        if (visitCount) visitCount.textContent = AppState.visits;
        if (xpCount) xpCount.textContent = AppState.xp;
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error actualizando XP UI:`, error);
    }
}

function updateUserInfo() {
    try {
        const userName = document.getElementById('userName');
        const loginBtn = document.getElementById('loginBtn');
        
        if (AppState.currentUser) {
            if (userName) userName.textContent = AppState.currentUser.name || 'PILOTO';
            if (loginBtn) {
                loginBtn.textContent = `${AppState.currentUser.name || 'PILOTO'} • ${getCurrentRank().name}`;
                loginBtn.onclick = openUserProfile;
            }
        } else {
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
function showPage(pageName) {
    try {
        console.log(`[${CONFIG.appName}] 🔄 Navegando a: ${pageName}`);
        
        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            AppState.currentPage = pageName;
            if (pageName !== AppState.currentPage) {
                addXP(2, `navegacion:${pageName}`);
            }
            updateNavActiveState(pageName);
            console.log(`[${CONFIG.appName}] ✅ Página activa: ${pageName}`);
        } else {
            console.warn(`[${CONFIG.appName}] ⚠️ Página no encontrada: ${pageName}-page`);
        }
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error en navegación:`, error);
    }
}

function showHome() {
    showPage('home');
}

function updateNavActiveState(activePage) {
    console.log(`[${CONFIG.appName}] 🧭 Estado navegación: ${activePage}`);
}

// =============================================================================
// 8. GESTIÓN DE MODALES
// =============================================================================
function openModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([disabled])');
            if (firstInput) firstInput.focus();
        }, 100);
        console.log(`[${CONFIG.appName}] 🔓 Modal registro abierto`);
    }
}

function closeModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        console.log(`[${CONFIG.appName}] 🔒 Modal registro cerrado`);
    }
}

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

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        console.log(`[${CONFIG.appName}] 🔒 Modal login cerrado`);
    }
}

// =============================================================================
// 9. MANEJO DE FORMULARIOS - CORREGIDO ✅
// =============================================================================

/**
 * Maneja el envío del formulario de registro
 * ✅ CORREGIDO: String con salto de línea usando \n
 */
function handleRegister(event) {
    event.preventDefault();
    
    console.log(`[${CONFIG.appName}] ⚠️ Registro temporalmente bloqueado`);
    
    // ✅ CORRECCIÓN: Usar \n en lugar de salto de línea real
    alert('>> SISTEMA BLOQUEADO <<\nPróximamente disponible.');
}

/**
 * Maneja el envío del formulario de login
 * ✅ CORREGIDO: String con salto de línea usando \n en el catch
 */
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberMe').checked;
        
        console.log(`[${CONFIG.appName}] 🔑 Intento de login: ${username}`);
        
        if (!username || !password) {
            alert('⚠️ Por favor, completa todos los campos');
            return;
        }
        
        // Modo demo: login simulado
        if (CONFIG.firebase.enabled === false) {
            console.log(`[${CONFIG.appName}] 🎭 Modo demo: login simulado`);
            
            const userName = username.split('@')[0].toUpperCase() || 'PILOTO';
            AppState.currentUser = {
                id: 'demo_user_' + Date.now(),
                name: userName,
                email: username,
                joined: new Date().toISOString()
            };
            
            addXP(25, 'login');
            updateUserInfo();
            updateXPDisplay();
            closeLoginModal();
            showFirebaseStatus('✅ SESIÓN INICIADA (DEMO)', 'success');
            return;
        }
        
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error en login:`, error);
        
        // ✅ CORRECCIÓN: Usar \n en lugar de salto de línea real
        alert('>> ERROR <<\n' + error.message);
        
        showFirebaseStatus('ERROR_LOGIN', 'error');
    }
}

function openUserProfile() {
    console.log(`[${CONFIG.appName}] 👤 Abriendo perfil de: ${AppState.currentUser?.name}`);
    alert(`👤 PERFIL DE USUARIO\n\nNombre: ${AppState.currentUser?.name || 'PILOTO'}\nNivel: ${AppState.level}\nXP: ${AppState.xp}\nRango: ${getCurrentRank().name}`);
}

// =============================================================================
// 10. EFECTOS VISUALES E INTERACTIVIDAD
// =============================================================================
function initEffects() {
    initDroneTrails();
    initGlitchEffects();
    initScanlines();
}

function initDroneTrails() {
    const container = document.getElementById('drone-trails-container');
    if (!container) {
        console.warn('[MODO 2] ⚠️ Elemento #drone-trails-container no existe en el HTML');
        return;
    }
    
    const particleCount = Math.min(15, Math.floor(window.innerWidth / 100));
    for (let i = 0; i < particleCount; i++) {
        createDroneTrail(container);
    }
    animateDroneTrails(container);
}

function createDroneTrail(container) {
    if (!container) {
        console.warn('[MODO 2] ⚠️ Drone trails container no encontrado');
        return;
    }
    
    try {
        const trail = document.createElement('div');
        trail.className = 'drone-trail';
        trail.style.cssText = `position: absolute; width: 2px; height: 2px; background: var(--accent); border-radius: 50%; opacity: 0.6; pointer-events: none; left: ${Math.random() * 100}%; top: ${Math.random() * 100}%; box-shadow: 0 0 10px var(--accent);`;
        container.appendChild(trail);
        animateTrail(trail);
    } catch (error) {
        console.error('[MODO 2] ❌ Error creando drone trail:', error);
    }
}

function animateTrail(trail) {
    const duration = 3000 + Math.random() * 4000;
    trail.animate([
        { transform: `translate(0, 0) scale(1)`, opacity: 0.6 },
        { transform: `translate(${(Math.random() - 0.5) * 100}px, ${-50 - Math.random() * 100}px) scale(0)`, opacity: 0 }
    ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
    });
    
    setTimeout(() => {
        if (trail.parentNode) {
            trail.parentNode.removeChild(trail);
            createDroneTrail(trail.parentNode);
        }
    }, duration);
}

function animateDroneTrails(container) {
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            createDroneTrail(container);
        }
    }, 800);
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearInterval(interval);
        }
    });
}

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

function initScanlines() {
    const scanlines = document.querySelector('.scanlines');
    if (!scanlines) return;
    
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 's' && e.ctrlKey) {
            e.preventDefault();
            scanlines.style.display = scanlines.style.display === 'none' ? 'block' : 'none';
            console.log(`[${CONFIG.appName}] 📺 Scanlines: ${scanlines.style.display === 'none' ? 'OFF' : 'ON'}`);
        }
    });
}

// =============================================================================
// 11. EVENT LISTENERS GLOBALES
// =============================================================================
function initGlobalListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeLoginModal();
            closeXpPopup();
        }
    });
    
    document.addEventListener('click', (e) => {
        const modals = ['registerModal', 'loginModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && !modal.hidden && e.target === modal) {
                modalId === 'registerModal' ? closeModal() : closeLoginModal();
            }
        });
    });
    
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
    
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
// 12. SISTEMA DE PRIVACIDAD Y COOKIES
// =============================================================================
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
            banner.style.display = 'flex';
            console.log('[MODO 2] 🔐 Banner de privacidad mostrado');
        } else {
            banner.hidden = true;
            banner.style.display = 'none';
            console.log('[MODO 2] ✅ Privacidad ya aceptada');
        }
    } catch (error) {
        console.error('[MODO 2] ❌ Error en banner de privacidad:', error);
    }
}

function acceptPrivacy() {
    try {
        localStorage.setItem(CONFIG.storageKeys.privacy, 'true');
        const banner = document.getElementById('privacyBanner');
        if (banner) {
            banner.hidden = true;
            banner.style.display = 'none';
        }
        console.log(`[${CONFIG.appName}] ✅ Privacidad aceptada`);
        addXP(5, 'privacidad');
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error aceptando privacidad:`, error);
    }
}

// =============================================================================
// 13. POPUP DE XP MÁXIMO
// =============================================================================
function showXpPopup() {
    try {
        const popup = document.getElementById('xpPopup');
        const overlay = document.getElementById('xpPopupOverlay');
        
        if (popup && overlay) {
            const visitCount = document.getElementById('visitCount');
            const xpCount = document.getElementById('xpCount');
            if (visitCount) visitCount.textContent = AppState.visits;
            if (xpCount) xpCount.textContent = AppState.xp;
            
            popup.hidden = false;
            popup.setAttribute('aria-hidden', 'false');
            overlay.hidden = false;
            overlay.setAttribute('aria-hidden', 'false');
            
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
// 14. ESTADO DE FIREBASE Y CONEXIÓN
// =============================================================================
function checkFirebaseStatus() {
    try {
        const statusEl = document.getElementById('firebaseStatus');
        if (!statusEl) return;
        
        if (CONFIG.firebase.enabled && typeof firebase !== 'undefined') {
            AppState.firebaseConnected = true;
            showFirebaseStatus('MAINFRAME: CONECTADO', 'success');
            console.log(`[${CONFIG.appName}] 🔗 Firebase conectado`);
        } else if (CONFIG.firebase.enabled) {
            showFirebaseStatus('MAINFRAME: CARGANDO...', 'warning');
            console.warn(`[${CONFIG.appName}] ⏳ Firebase cargando...`);
        } else {
            AppState.firebaseConnected = false;
            showFirebaseStatus('MODO OFFLINE • localStorage', 'offline');
            console.log(`[${CONFIG.appName}] 📴 Modo offline activo (localStorage)`);
        }
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error verificando Firebase:`, error);
        showFirebaseStatus('ERROR_CONEXIÓN', 'error');
    }
}

function showFirebaseStatus(message, type = 'info') {
    const statusEl = document.getElementById('firebaseStatus');
    if (!statusEl) return;
    
    const statusText = statusEl.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = message;
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
// 15. UTILIDADES Y HELPERS
// =============================================================================
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

function formatNumber(num) {
    return new Intl.NumberFormat('es-ES').format(num);
}

function getFormattedDate() {
    return new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function debugLog(...args) {
    if (CONFIG.version.includes('dev') || location.hostname === 'localhost') {
        console.log(`[${CONFIG.appName}]`, ...args);
    }
}

// =============================================================================
// 16. FUNCIONES PLACEHOLDER PARA FIREBASE (PREPARACIÓN)
// =============================================================================
async function syncUserData() {
    if (!CONFIG.firebase.enabled || !AppState.firebaseConnected) {
        console.log(`[${CONFIG.appName}] ⏭️ Sync saltado: Firebase no activo`);
        return;
    }
    try {
        console.log(`[${CONFIG.appName}] 🔄 Datos sincronizados con Firestore`);
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error sincronizando con Firestore:`, error);
    }
}

async function loadUserDataFromFirebase(userId) {
    if (!CONFIG.firebase.enabled || !AppState.firebaseConnected) {
        return null;
    }
    try {
        return null;
    } catch (error) {
        console.error(`[${CONFIG.appName}] ❌ Error cargando de Firestore:`, error);
        return null;
    }
}

// =============================================================================
// 17. EXPORTS PARA MÓDULOS
// =============================================================================
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

console.log(`[${CONFIG.appName}] ✅ app.js v${CONFIG.version} cargado completamente`);
