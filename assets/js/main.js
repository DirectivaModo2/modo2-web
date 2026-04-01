  <script>
                              // assets/js/main.js
/* 
 * MODO 2 - FIREBASE MAINFRAME
 * Project: modo2-mainframe-b9f2e
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkB54CuTQZ9sVj42eSIYjYA9s83WgTJHo",
    authDomain: "modo2-mainframe-b9f2e.firebaseapp.com",
    projectId: "modo2-mainframe-b9f2e",
    storageBucket: "modo2-mainframe-b9f2e.firebasestorage.app",
    messagingSenderId: "253905847546",
    appId: "1:253905847546:web:718d87ae9f723ae39c3543"
};

// Initialize Firebase
let app, auth, db;
let firebaseInitialized = false;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    firebaseInitialized = true;
    updateFirebaseStatus('connected', 'MAINFRAME: CONECTADO');
    console.log('>> FIREBASE MAINFRAME: ONLINE <<');
} catch (error) {
    console.error('>> FIREBASE ERROR:', error);
    updateFirebaseStatus('error', 'MAINFRAME: ERROR');
}

function updateFirebaseStatus(status, text) {
    const el = document.getElementById('firebaseStatus');
    if (el) {
        el.textContent = text;
        el.className = 'firebase-status ' + status;
    }
}

// Progression System
let xp = 0;
let level = 0;
let currentUserData = null;
let xpPopupShown = localStorage.getItem('modo2_xp_popup_shown') || 'false';
let availableSpots = 40;

function calculateLevel(totalXP) {
    for (let i = 1; i <= 200; i++) {
        if (totalXP < Math.floor(100 * Math.pow(i, 1.5))) return i - 1;
    }
    return 200;
}

function getRank(lvl) {
    if (lvl === 0) return 'INVITADO';
    if (lvl <= 3) return 'CADETE - RECLUTA';
    if (lvl <= 6) return 'CADETE - INICIADO';
    if (lvl <= 10) return 'CADETE - ASPIRANTE';
    if (lvl <= 15) return 'PILOTO NOVEL - OBSERVADOR';
    if (lvl <= 22) return 'PILOTO NOVEL - OBS. COTILLA';
    if (lvl <= 30) return 'PILOTO NOVEL - OBS. CONCIENZUDO';
    if (lvl <= 40) return 'ESPECIALISTA - TÉCNICO';
    if (lvl <= 50) return 'ESPECIALISTA - ANALISTA';
    if (lvl <= 60) return 'ESPECIALISTA - OPERADOR';
    if (lvl <= 80) return 'VETERANO';
    if (lvl <= 100) return 'VETERANO ÉLITE';
    if (lvl <= 150) return 'LEYENDA';
    return 'LEYENDA VIVA';
}

function updateXPDisplay(userXP = 0) {
    xp = userXP;
    level = calculateLevel(xp);
    
    const nextLevelXP = Math.floor(100 * Math.pow(level + 1, 1.5));
    const prevLevelXP = level > 0 ? Math.floor(100 * Math.pow(level, 1.5)) : 0;
    const percentage = Math.min(((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100, 100);
    
    const xpFill = document.getElementById('xpFill');
    const xpText = document.getElementById('xpText');
    const levelDisplay = document.getElementById('levelDisplay');
    const userRank = document.getElementById('userRank');
    
    if (xpFill) xpFill.style.width = percentage + '%';
    if (xpText) xpText.textContent = xp.toLocaleString() + ' XP';
    if (levelDisplay) levelDisplay.textContent = 'NIVEL ' + level;
    if (userRank) userRank.textContent = getRank(level);
    
    if (xp >= 1000 && xpPopupShown !== 'true') showXpPopup();
}

function showXpPopup() {
    document.getElementById('xpPopup').classList.add('active');
    document.getElementById('xpPopupOverlay').classList.add('active');
    localStorage.setItem('modo2_xp_popup_shown', 'true');
}

function closeXpPopup() {
    document.getElementById('xpPopup').classList.remove('active');
    document.getElementById('xpPopupOverlay').classList.remove('active');
}

// Modal Functions
function openLoginModal() { document.getElementById('loginModal').classList.add('active'); }
function closeLoginModal() { document.getElementById('loginModal').classList.remove('active'); }
function openModal() { document.getElementById('registerModal').classList.add('active'); }
function closeModal() { document.getElementById('registerModal').classList.remove('active'); }

// Registration
async function handleRegister(e) {
    e.preventDefault();
    if (!firebaseInitialized) { alert('>> MAINFRAME DESCONECTADO <<'); return; }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '>> PROCESANDO...';

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(
            document.getElementById('regEmail').value,
            document.getElementById('regPassword').value
        );
        
        await db.collection('users').doc(userCredential.user.uid).set({
            displayName: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            membership: document.getElementById('regMembership').value,
            level: 0, xp: 0, rank: 'INVITADO', status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('>> REGISTRO COMPLETADO <<\nPENDIENTE DE VALIDACIÓN');
        closeModal();
        document.getElementById('registerForm').reset();
    } catch (error) {
        alert('>> ERROR <<\n' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '>> PROCEDER';
    }
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    if (!firebaseInitialized) { alert('>> MAINFRAME DESCONECTADO <<'); return; }

    const btn = document.getElementById('loginBtnSubmit');
    btn.disabled = true;
    btn.textContent = '>> AUTENTICANDO...';

    try {
        await auth.setPersistence(
            document.getElementById('rememberMe').checked 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION
        );

        const userCredential = await auth.signInWithEmailAndPassword(
            document.getElementById('loginUsername').value,
            document.getElementById('loginPassword').value
        );

        const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            document.getElementById('userName').textContent = (currentUserData.displayName || userCredential.user.email).toUpperCase();
            document.getElementById('userLevel').textContent = 'NIVEL ' + (currentUserData.level || 0);
            
            const loginBtn = document.getElementById('loginBtn');
            loginBtn.textContent = currentUserData.status === 'connected' ? 'CONECTADO' : 'PENDIENTE';
            loginBtn.className = 'status-badge ' + (currentUserData.status === 'connected' ? 'connected' : 'pending');
            loginBtn.onclick = handleLogout;
            
            updateXPDisplay(currentUserData.xp || 0);
            closeLoginModal();
            displayUserDataInTable();
        }
    } catch (error) {
        alert('>> ERROR <<\n' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '>> CONECTAR';
    }
}

// Logout
async function handleLogout() {
    if (!firebaseInitialized) return;
    await auth.signOut();
    currentUserData = null;
    
    document.getElementById('userName').textContent = 'INVITADO';
    document.getElementById('userLevel').textContent = 'ACCESO RESTRINGIDO';
    document.getElementById('userRank').textContent = '--';
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = 'INVITADO / ACCESO RESTRINGIDO';
    loginBtn.className = 'status-badge';
    loginBtn.onclick = openLoginModal;
    
    updateXPDisplay(0);
    alert('>> SESIÓN CERRADA <<');
}

// Auth State Listener
if (firebaseInitialized) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                currentUserData = userDoc.data();
                document.getElementById('userName').textContent = (currentUserData.displayName || user.email).toUpperCase();
                document.getElementById('userLevel').textContent = 'NIVEL ' + (currentUserData.level || 0);
                
                const loginBtn = document.getElementById('loginBtn');
                loginBtn.textContent = currentUserData.status === 'connected' ? 'CONECTADO' : 'PENDIENTE';
                loginBtn.className = 'status-badge ' + (currentUserData.status === 'connected' ? 'connected' : 'pending');
                loginBtn.onclick = handleLogout;
                
                updateXPDisplay(currentUserData.xp || 0);
            }
        }
    });
}

// User DB Display
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            if (this.classList.contains('connected') || this.classList.contains('pending')) {
                const dbPanel = document.getElementById('userDbPanel');
                dbPanel.classList.toggle('active');
                if (firebaseInitialized && currentUserData) displayUserDataInTable();
            }
        });
    }
});

function displayUserDataInTable() {
    const tbody = document.getElementById('userDbBody');
    if (tbody && currentUserData) {
        tbody.innerHTML = `<tr>
            <td>${currentUserData.displayName || 'N/A'}</td>
            <td>${auth.currentUser?.email || 'N/A'}</td>
            <td class="${currentUserData.status === 'connected' ? 'text-green' : 'text-amber'}">${currentUserData.status?.toUpperCase() || 'PENDING'}</td>
            <td>${currentUserData.level || 0}</td>
            <td>${currentUserData.rank || 'INVITADO'}</td>
            <td>${(currentUserData.xp || 0).toLocaleString()}</td>
        </tr>`;
    }
}

// Page Navigation
function showHome() {
    document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
    document.getElementById('home-page').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPage(pageId) {
    document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Typewriter
const texts = {
    'typewriter-1': "Somos una 'Crew' de élite dedicada a la profesionalización del vuelo con UAS en Aragón. Nuestra misión es elevar el estándar técnico y garantizar la legalidad operativa bajo el Artículo 16.",
    'typewriter-legal': "El Ayuntamiento está informado. AESA ha dado visto bueno inicial. Capital destinado a Estudio SORA, manuales y seguro RC. Operamos bajo Art. 16."
};

function typeWriter(elementId, text, speed = 20) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let i = 0;
    el.innerHTML = "";
    function type() {
        if (i < text.length) { el.innerHTML += text.charAt(i); i++; setTimeout(type, speed); }
    }
    type();
}

// Drone Trails
const colors = ['#00f2ff', '#ff0055', '#00f2ff', '#008080'];
const trailsContainer = document.getElementById('drone-trails-container');

function createDroneTrail() {
    const trail = document.createElement('div');
    trail.className = 'drone-trail';
    const startY = Math.random() * window.innerHeight;
    const startFromLeft = Math.random() > 0.5;
    const length = 100 + Math.random() * 300;
    const duration = 4 + Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    trail.style.cssText = `width: ${length}px; height: 1px;
        background: linear-gradient(${startFromLeft ? 'to right' : 'to left'}, ${color}, transparent);
        top: ${startY}px; ${startFromLeft ? 'left' : 'right'}: -300px;
        box-shadow: 0 0 10px ${color};`;
    
    trailsContainer.appendChild(trail);
    
    const startTime = Date.now();
    function animate() {
        const progress = (Date.now() - startTime) / (duration * 1000);
        if (progress < 1) {
            const opacity = Math.max(0, Math.min(1, progress < 0.2 ? progress / 0.2 : (1 - progress) / 0.3)) * 0.4;
            trail.style.opacity = opacity;
            const moveDistance = progress * (window.innerWidth + length);
            trail.style[startFromLeft ? 'left' : 'right'] = `${-length + moveDistance}px`;
            requestAnimationFrame(animate);
        } else {
            trail.remove();
        }
    }
    requestAnimationFrame(animate);
}

function startDroneTrails() {
    createDroneTrail();
    setTimeout(startDroneTrails, 3000 + Math.random() * 5000);
}

// Initialize
window.addEventListener('load', () => {
    updateXPDisplay(0);
    typeWriter('typewriter-1', texts['typewriter-1']);
    typeWriter('typewriter-legal', texts['typewriter-legal']);
    setTimeout(startDroneTrails, 1000);
    
    // Modal close on outside click
    document.getElementById('registerModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
    document.getElementById('loginModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeLoginModal(); });
    document.getElementById('xpPopupOverlay').addEventListener('click', closeXpPopup);
});


              </script>
                        </body>
                        </html>
                    
