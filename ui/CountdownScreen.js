// CountdownScreen - Manages the countdown before game starts
class CountdownScreen {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.screen = document.getElementById('countdown-screen');
        this.countdownNumber = document.getElementById('countdown-number');
        this.guideImage = document.getElementById('guide-image');
        this.currentCount = 3;
        this.countdownInterval = null;
        
        this.init();
    }

    init() {
        // Set the correct guide image based on device
        const isMobile = window.innerWidth <= 768;
        this.guideImage.src = isMobile ? 'assets/guide-mobile.png' : 'assets/guide-desktop.png';
        
        // Update image on window resize
        window.addEventListener('resize', () => {
            const isMobile = window.innerWidth <= 768;
            this.guideImage.src = isMobile ? 'assets/guide-mobile.png' : 'assets/guide-desktop.png';
        });
    }

    show(playerName) {
        this.hideAllScreens();
        this.screen.classList.add('active');
        this.currentCount = 3;
        this.countdownNumber.textContent = '3';
        
        // Add body class for countdown screen
        document.body.classList.add('countdown-active');
        
        // Start countdown after a brief delay
        setTimeout(() => {
            this.startCountdown(playerName);
        }, 500);
    }

    hide() {
        this.screen.classList.remove('active');
        document.body.classList.remove('countdown-active');
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    startCountdown(playerName) {
        // Play click sound for each countdown number
        if (window.audioManager) {
            window.audioManager.playClickSound();
        }
        
        this.countdownInterval = setInterval(() => {
            this.currentCount--;
            
            if (this.currentCount > 0) {
                // Update number with animation
                this.countdownNumber.classList.add('countdown-animate');
                setTimeout(() => {
                    this.countdownNumber.textContent = this.currentCount;
                    this.countdownNumber.classList.remove('countdown-animate');
                    
                    // Play click sound
                    if (window.audioManager) {
                        window.audioManager.playClickSound();
                    }
                }, 100);
            } else {
                // Countdown finished, start the game
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                
                // Show "GO!" briefly
                this.countdownNumber.classList.add('countdown-go');
                this.countdownNumber.textContent = 'GO!';
                
                // Play start sound
                if (window.audioManager) {
                    window.audioManager.playPourSound();
                }
                
                // Transition to game after showing GO!
                setTimeout(() => {
                    this.hide();
                    document.getElementById('game-screen').classList.add('active');
                    
                    // Start the actual game
                    this.gameManager.startGame(playerName);
                }, 700);
            }
        }, 1000);
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
} 