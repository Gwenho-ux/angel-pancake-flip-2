// ResultScreen - Displays game results and roast messages
class ResultScreen {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.screen = document.getElementById('result-screen');
        this.roastMessageElement = document.getElementById('roast-message');
        
        this.backToMenuButton = new Button(document.getElementById('back-to-menu-btn'), () => this.backToMenu());
    }

    show(score, roastMessage, pancakeState = 'perfect', totalPancakes = 0) {
        this.hideAllScreens();
        this.screen.classList.add('active');
        // Make container shorter for result screen
        document.getElementById('game-container').classList.add('result-screen-active');
        
        // Determine result category for image and sound
        const resultCategory = this.getResultCategory(score, totalPancakes);
        
        // Update result image
        this.updateResultImage(resultCategory);
        
        // Play appropriate sound
        this.playResultSound(score, totalPancakes);
        
        // Display score and pancake count in one line
        this.displayScoreAndPancakes(score, totalPancakes);
        
        // Display roast message with typewriter effect
        this.typewriterEffect(roastMessage);
        
        // Check if it's a new high score
        if (window.leaderboard.isHighScore(score)) {
            this.showHighScoreEffect();
        }
    }

    getResultCategory(score, totalPancakes) {
        // Perfect: High score (80+) AND good pancake count (5+)
        if (score >= 80 && totalPancakes >= 5) {
            return 'perfect';
        }
        // Good: Decent score (40+) OR reasonable pancakes (3+)
        else if (score >= 40 || totalPancakes >= 3) {
            return 'good';
        }
        // Bad: Low score and few pancakes
        else {
            return 'burnt';
        }
    }

    updateResultImage(resultCategory) {
        // Create or update result image element
        let resultImage = this.screen.querySelector('.result-image');
        if (!resultImage) {
            resultImage = document.createElement('img');
            resultImage.className = 'result-image';
            
            // Insert at the beginning of the screen
            this.screen.insertBefore(resultImage, this.screen.firstChild);
        }
        
        // Set appropriate image source
        const imageMap = {
            'perfect': 'assets/Perfect.png',
            'good': 'assets/Good.png',
            'burnt': 'assets/Burnt.png'
        };
        
        resultImage.src = imageMap[resultCategory];
        resultImage.alt = `${resultCategory} result`;
    }

    playResultSound(score, totalPancakes) {
        if (!window.audioManager) return;
        
        const resultCategory = this.getResultCategory(score, totalPancakes);
        
        // Play appropriate sound with a slight delay for dramatic effect
        setTimeout(() => {
            switch (resultCategory) {
                case 'perfect':
                    window.audioManager.playPerfectResultSound();
                    break;
                case 'good':
                    window.audioManager.playGoodResultSound();
                    break;
                case 'burnt':
                    window.audioManager.playBadResultSound();
                    break;
            }
        }, 300);
    }

    displayScoreAndPancakes(score, totalPancakes) {
        // Create or update combined stats container
        let statsContainer = this.screen.querySelector('.result-stats-container');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.className = 'result-stats-container';
            
            // Insert after result image
            const resultImage = this.screen.querySelector('.result-image');
            if (resultImage) {
                resultImage.parentNode.insertBefore(statsContainer, resultImage.nextSibling);
            } else {
                this.screen.insertBefore(statsContainer, this.screen.firstChild);
            }
        }
        
        // Create combined display with game-style pink boxes
        statsContainer.innerHTML = `
            <div class="result-stats-line">
                <div class="score-display">
                    <span class="label">FINAL SCORE</span>
                    <span class="score-value" id="animated-score">🏆 0</span>
                </div>
                <div class="score-display">
                    <span class="label">PANCAKES MADE</span>
                    <span class="score-value">🥞 ${totalPancakes}</span>
                </div>
            </div>
        `;
        
        // Animate the score
        this.animateScore(score);
    }

    animateScore(score) {
        const animatedScoreElement = document.getElementById('animated-score');
        if (!animatedScoreElement) return;
        
        let currentScore = 0;
        const increment = Math.ceil(score / 30); // Complete in ~30 frames
        
        const animate = () => {
            currentScore += increment;
            if (currentScore >= score) {
                currentScore = score;
                animatedScoreElement.textContent = `🏆 ${score}`;
                
                // Add bounce effect
                animatedScoreElement.style.animation = 'pulse 0.5s ease-out';
                return;
            }
            
            animatedScoreElement.textContent = `🏆 ${currentScore}`;
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
        const animatedScoreElement = document.getElementById('animated-score');
        if (animatedScoreElement) {
            animatedScoreElement.style.animation = 'glow 2s ease-in-out infinite';
        }
        
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