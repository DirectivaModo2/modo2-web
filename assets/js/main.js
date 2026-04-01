/**
 * ================================================================
 * MODO 2 - MAINFRAME OPERATIONS
 * PROYECTO: Sistema de Gestión de Crew y Progresión UAS
 * ================================================================
 */

// 1. CONFIGURACIÓN DEL MAINFRAME (Tus credenciales)
const firebaseConfig = {
    apiKey: "AIzaSyCkB54CuTQZ9sVj42eSIYjYA9s83WgTJHo",
    authDomain: "modo2-mainframe-b9f2e.firebaseapp.com",
    projectId: "modo2-mainframe-b9f2e",
    storageBucket: "modo2-mainframe-b9f2e.firebasestorage.app",
    messagingSenderId: "253905847546",
    appId: "1:253905847546:web:718d87ae9f723ae39c3543"
};

// Inicialización de Firebase
let app, auth, db;
let firebaseInitialized = false;
let currentUserData = null;

try {
    // Al usar los scripts "-compat", usamos la sintaxis estándar de Firebase v8/v9
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    firebaseInitialized = true;
    console.log('>> MAINFRAME MODO 2: ONLINE <<');
} catch (error) {
    console.error('>> CRITICAL ERROR: MAINFRAME OFFLINE', error);
}

/**
 * 2. SISTEMA DE PROGRESIÓN Y NIVELES
 */
function calculateLevel(totalXP) {
    if (totalXP <= 0) return 0;
    // Curva: nivel = (XP / 100)^(1 / 1.5)
    return Math.min(200, Math.floor(Math.pow(totalXP / 100, 1 / 1.5)));
}

function getRank(lvl) {
    if (lvl === 0) return 'INVITADO';
    if (lvl <= 10) return 'CADETE';
    if (lvl <= 30) return 'PILOTO NOVEL';
    if (lvl <= 60) return 'ESPECIALISTA';
    if (lvl <= 100) return 'VETERANO ÉLITE';
    return 'LEYENDA VIVA';
}

function updateXPDisplay(userXP = 0) {
    const level = calculateLevel(userXP);
    const nextLevelXP = Math.floor(100 * Math.pow(level + 1, 1.5));
    const prevLevelXP = level > 0 ? Math.floor(100 * Math.pow(level, 1.5)) : 0;
    
    const progress = ((userXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
    
    // Actualización de DOM
    const fill = document.getElementById('xpFill');
    const text = document.getElementById('xpText');
    const lvlDisp = document.getElementById('levelDisplay');
    const rankDisp = document.getElementById('userRank');

    if (fill) fill.style.width = `${Math.max(0, Math.min(progress, 100))}%`;
    if (text) text.textContent = `${userXP.toLocaleString()} XP`;
    if (lvlDisp) lvlDisp.textContent = `NIVEL ${level}`;
    if (rankDisp) rankDisp.textContent = getRank(level);
}

/**
 * 3. CONTROL DE INTERFAZ Y MODALES
 */
function openModal() { document.getElementById('registerModal').classList.add('active'); }
function closeModal() { document.getElementById('registerModal').classList.remove('active'); }
function openLoginModal() { document.getElementById('loginModal').classList.add('active'); }
function closeLoginModal() { document.getElementById('loginModal').classList.remove('active'); }

function showPage(pageId) {
    document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`${pageId}-page`);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * 4. EFECTOS VISUALES (CYBERPUNK UI)
 */
const texts = {
    'typewriter-1': "Somos una 'Crew' de élite dedicada a la profesionalización del vuelo con UAS en Aragón. Elevamos el estándar técnico y legal.",
    'typewriter-legal': "Operación bajo Art. 16. Proyecto Origen en fase de adjudicación. Mainframe activo."
};

function typeWriter(elementId, text, speed = 25) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let i = 0;
    el.innerHTML = "";
    function type() {
        if (i < text.length) {
            el.innerHTML += text.charAt(i++);
            setTimeout(type, speed);
        }
    }
    type();
}

function createDroneTrail() {
    const container = document.getElementById('drone-trails-container');
    if (!container) return;
    const trail = document.createElement('div');
    trail.className = 'drone-trail';
    const startY = Math.random() * window.innerHeight;
    trail.style.top = `${startY}px`;
    container.appendChild(trail);
    setTimeout(() => trail.remove(), 4000);
}

/**
 * 5. INICIALIZACIÓN Y OBSERVAR SESIÓN
 */
window.addEventListener('load', () => {
    // Ciclos visuales
    setInterval(createDroneTrail, 4000);
    typeWriter('typewriter-1', texts['typewriter-1']);
    
    // Contador de plazas (Simulación de tiempo real)
    const availableSpots = document.getElementById('availableSpots');
    if (availableSpots) {
        let spots = 40;
        const interval = setInterval(() => {
            if (spots <= 27) clearInterval(interval);
            availableSpots.textContent = spots--;
        }, 150);
    }

    // Cerrar modales al clickear fuera
    window.onclick = (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            closeModal();
            closeLoginModal();
        }
    };

    // Escuchar cambios de usuario en Firebase
    if (firebaseInitialized) {
        auth.onAuthStateChanged(async (user) => {
            const loginBtn = document.getElementById('loginBtn');
            const userNameDisp = document.getElementById('userName');

            if (user) {
                // Usuario conectado
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserData = userDoc.data();
                    if (userNameDisp) userNameDisp.textContent = currentUserData.displayName.toUpperCase();
                    updateXPDisplay(currentUserData.xp || 0);
                    
                    if (loginBtn) {
                        loginBtn.textContent = "CONECTADO";
                        loginBtn.className = "status-badge connected";
                    }
                }
            } else {
                // Usuario desconectado
                if (userNameDisp) userNameDisp.textContent = "INVITADO";
                updateXPDisplay(0);
                if (loginBtn) {
                    loginBtn.textContent = "INVITADO / ACCESO RESTRINGIDO";
                    loginBtn.className = "status-badge pending";
                }
            }
        });
    }
});
