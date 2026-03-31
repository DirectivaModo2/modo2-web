// main.js

// Basic visual effects for HUD-style interactions

// Function to create a visual effect
function createVisualEffect(element) {
    element.style.transition = 'transform 0.3s ease';
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 300);
}

// Function to log HUD interactions
function logHUDInteraction(action) {
    console.log(`[HUD Interaction] Action: ${action} at ${new Date().toISOString()}`);
}

// Example of usage
const hudElement = document.getElementById('hud');
if (hudElement) {
    // Adding event listeners
    hudElement.addEventListener('click', () => {
        logHUDInteraction('HUD Element Clicked');
        createVisualEffect(hudElement);
    });
}