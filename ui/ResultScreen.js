// ResultScreen - Displays game results and roast messages
class ResultScreen {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.screen = document.getElementById('result-screen');
        this.finalScoreElement = document.getElementById('final-score-value');
        this.roastMessageElement = document.getElementById('roast-message');
        this.resultPancakeElement = document.getElementById('result-pancake');
        
        this.playAgainButton = new Button(document.getElementById('play-again-btn'), () => this.playAgain());
        this.backToMenuButton = new Button(document.getElementById('back-to-menu-btn'), () => this.backToMenu());
    }

    show(score, roastMessage, pancakeState = 'perfect') {
        this.hideAllScreens();
        this.screen.classList.add('active');
        // Make container shorter for result screen
        document.getElementById('game-container').classList.add('result-screen-active');
        
        // Update pancake visual
        this.updatePancakeVisual(pancakeState);
        
        // Display score with animation
        this.animateScore(score);
        
        // Display roast message with typewriter effect
        this.typewriterEffect(roastMessage);
        
        // Check if it's a new high score
        if (window.leaderboard.isHighScore(score)) {
            this.showHighScoreEffect();
        }
    }

    updatePancakeVisual(state) {
        // Remove all state classes
        ['raw', 'cooking', 'perfect', 'burnt'].forEach(s => {
            this.resultPancakeElement.classList.remove(s);
        });
        
        // Add current state class
        this.resultPancakeElement.classList.add(state);
    }

    animateScore(score) {
        let currentScore = 0;
        const increment = Math.ceil(score / 30); // Complete in ~30 frames
        
        const animate = () => {
            currentScore += increment;
            if (currentScore >= score) {
                currentScore = score;
                this.finalScoreElement.textContent = score;
                
                // Add bounce effect
                this.finalScoreElement.style.animation = 'pulse 0.5s ease-out';
                return;
            }
            
            this.finalScoreElement.textContent = currentScore;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    typewriterEffect(message) {
        this.roastMessageElement.textContent = '';
        let index = 0;
        
        const type = () => {
            if (index < message.length) {
                this.roastMessageElement.textContent += message[index];
                index++;
                setTimeout(type, 30);
            }
        };
        
        setTimeout(type, 500); // Start after score animation
    }

    showHighScoreEffect() {
        // Add glowing effect to score
        this.finalScoreElement.style.animation = 'glow 2s ease-in-out infinite';
        
        // Add "NEW HIGH SCORE!" text
        const highScoreText = document.createElement('div');
        highScoreText.textContent = 'NEW HIGH SCORE!';
        highScoreText.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 1.5em;
            color: #FFD700;
            text-shadow: 0 0 20px #FFD700;
            animation: pulse 1s ease-in-out infinite;
        `;
        this.screen.appendChild(highScoreText);
    }

    playAgain() {
        // Reset everything and go back to start screen instead of restarting game
        this.gameManager.reset();
        this.hide();
        window.startScreen.reset();
        window.startScreen.show();
    }

    backToMenu() {
        // Reset everything and go to start screen
        this.gameManager.reset();
        this.hide();
        window.startScreen.reset();
        window.startScreen.show();
    }

    hide() {
        this.screen.classList.remove('active');
        // Remove shorter container class when leaving result screen
        document.getElementById('game-container').classList.remove('result-screen-active');
        // Remove any high score effects
        const highScoreText = this.screen.querySelector('div[style*="NEW HIGH SCORE"]');
        if (highScoreText) {
            highScoreText.remove();
        }
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
} 