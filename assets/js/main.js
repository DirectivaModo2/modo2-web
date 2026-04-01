// assets/js/main.js - MODO 2 MAINFRAME
const firebaseConfig = {
    apiKey: "AIzaSyCkB54CuTQZ9sVj42eSIYjYA9s83WgTJHo",
    authDomain: "modo2-mainframe-b9f2e.firebaseapp.com",
    projectId: "modo2-mainframe-b9f2e",
    storageBucket: "modo2-mainframe-b9f2e.firebasestorage.app",
    messagingSenderId: "253905847546",
    appId: "1:253905847546:web:718d87ae9f723ae39c3543"
};

let app, auth, db;
let firebaseInitialized = false;

// Inicialización
try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    firebaseInitialized = true;
    updateFirebaseStatus('connected', 'MAINFRAME: CONECTADO'); [cite: 128]
} catch (error) {
    console.error('FIREBASE ERROR:', error);
    updateFirebaseStatus('error', 'MAINFRAME: ERROR'); [cite: 129]
}

function updateFirebaseStatus(status, text) {
    const el = document.getElementById('firebaseStatus');
    if (el) { 
        el.textContent = text;
        el.className = 'firebase-status ' + status; [cite: 130]
    }
}

// Lógica de XP y Niveles
function calculateLevel(totalXP) {
    for (let i = 1; i <= 200; i++) {
        if (totalXP < Math.floor(100 * Math.pow(i, 1.5))) return i - 1; [cite: 131, 132]
    }
    return 200;
}

function updateXPDisplay(userXP = 0) {
    const level = calculateLevel(userXP);
    const userRank = document.getElementById('userRank');
    const xpText = document.getElementById('xpText');
    const xpFill = document.getElementById('xpFill');
    const levelDisplay = document.getElementById('levelDisplay');

    if (xpText) xpText.textContent = userXP.toLocaleString() + ' XP'; [cite: 140]
    if (levelDisplay) levelDisplay.textContent = 'NIVEL ' + level; [cite: 141]
    // ... resto de la lógica de actualización visual [cite: 137, 138, 139]
}

// Control de Modales
function openModal() { document.getElementById('registerModal').classList.add('active'); }
function closeModal() { document.getElementById('registerModal').classList.remove('active'); }
function openLoginModal() { document.getElementById('loginModal').classList.add('active'); }
function closeLoginModal() { document.getElementById('loginModal').classList.remove('active'); }

// Navegación
function showPage(pageId) {
    document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active'); [cite: 171]
}

function showHome() {
    document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
    document.getElementById('home-page').classList.add('active'); [cite: 170]
}

// Evento de carga inicial
window.addEventListener('load', () => {
    updateXPDisplay(0);
    // Iniciar efectos visuales y listeners [cite: 185]
});
