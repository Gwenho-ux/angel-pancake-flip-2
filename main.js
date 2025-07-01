// Main entry point - Initialize game and set up all components
document.addEventListener('DOMContentLoaded', () => {
    // Create game manager
    const gameManager = new GameManager();
    
    // Create UI screens
    window.startScreen = new StartScreen(gameManager);
    window.leaderboard = new Leaderboard();
    window.resultScreen = new ResultScreen(gameManager);
    
    // Initialize game manager
    gameManager.init();
    
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
    
    // Add service worker for offline play (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, game will still work online
        });
    }
    
    console.log('🥞 Angel\'s Pancake Flip initialized! Have fun!');
}); 