// Main entry point - Initialize game and set up all components
document.addEventListener('DOMContentLoaded', () => {
    // Create game manager
    const gameManager = new GameManager();
    
    // Make audioManager globally available for buttons and other components
    window.audioManager = gameManager.audioManager;
    
    // Create UI screens
    window.startScreen = new StartScreen(gameManager);
    window.leaderboard = new Leaderboard();
    window.resultScreen = new ResultScreen(gameManager);
    
    // Initialize game manager
    gameManager.init();
    
    // Start background music (will be enabled on first user interaction)
    let audioInitialized = false;
    const initializeAudio = () => {
        if (!audioInitialized) {
            gameManager.audioManager.enableAudio();
            gameManager.audioManager.playBackgroundMusic();
            audioInitialized = true;
        }
    };
    
    // Enable audio on first user interaction
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
    document.addEventListener('keydown', initializeAudio, { once: true });
    
    // Show start screen
    window.startScreen.show();
    
    // Add keyboard shortcuts for development
    document.addEventListener('keydown', (e) => {
        // Press 'R' to reset game (dev mode)
        if (e.key === 'r' && e.ctrlKey) {
            gameManager.reset();
            window.startScreen.show();
        }
        
        // Press 'L' to view leaderboard
        if (e.key === 'l' && e.ctrlKey) {
            window.leaderboard.show();
        }
    });
    
    // Prevent context menu on right click for better mobile experience
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Handle visibility change (pause game when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameManager.isGameActive) {
            gameManager.pauseGame();
        } else if (!document.hidden && gameManager.isGameActive) {
            gameManager.resumeGame();
        }
    });
    
    // Add touch support for mobile
    const tapButton = document.getElementById('tap-btn');
    if (tapButton) {
        // Prevent double-tap zoom on mobile
        tapButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            tapButton.click();
        });
    }
    
    // Add music button functionality for all music buttons
    const getMusicButtons = () => [
        document.getElementById('music-btn'), 
        document.getElementById('music-btn-global'),
        document.getElementById('music-btn-header')
    ].filter(btn => btn);
    
    // Use event delegation for dynamically created buttons
    document.addEventListener('click', (e) => {
        if (e.target.matches('#music-btn, #music-btn-global, #music-btn-header')) {
            const isMusicMuted = gameManager.audioManager.toggleMusic();
            const newText = isMusicMuted ? '🎶' : '🎵';
            
            // Update all music buttons
            getMusicButtons().forEach(btn => {
                btn.textContent = newText;
                btn.classList.toggle('muted', isMusicMuted);
            });
            
            // Re-initialize audio if needed
            if (!isMusicMuted && !audioInitialized) {
                initializeAudio();
            }
        }
    });
    
    // Add mute button functionality for all mute buttons
    const getMuteButtons = () => [
        document.getElementById('mute-btn'), 
        document.getElementById('mute-btn-global'),
        document.getElementById('mute-btn-header')
    ].filter(btn => btn);
    
    // Use event delegation for dynamically created buttons
    document.addEventListener('click', (e) => {
        if (e.target.matches('#mute-btn, #mute-btn-global, #mute-btn-header')) {
            const isMuted = gameManager.audioManager.toggleMute();
            const newText = isMuted ? '🔇' : '🔊';
            
            // Update all mute buttons
            getMuteButtons().forEach(btn => {
                btn.textContent = newText;
                btn.classList.toggle('muted', isMuted);
            });
            
            // Re-initialize audio if needed
            if (!isMuted && !audioInitialized) {
                initializeAudio();
            }
        }
    });
    
    // Add service worker for offline play (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, game will still work online
        });
    }
    
    console.log('🥞 Angel\'s Pancake Flip initialized! Have fun!');
}); 