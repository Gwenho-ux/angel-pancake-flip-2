// GameManager - Controls overall game state, QTE sequence, and score logic
class GameManager {
    constructor() {
        this.currentPlayer = '';
        this.score = 0;
        this.qteCount = 0;
        this.maxQTEs = 6;
        this.gameTimer = null;
        this.qteRound = null;
        this.scoreDisplay = null;
        this.dialogueBubble = document.getElementById('dialogue-bubble');
        this.gameTimerElement = document.getElementById('game-timer');
        this.qteContainer = document.getElementById('qte-container');
        
        // Pancake state management
        this.pancakeElement = document.getElementById('game-pancake');
        this.panElement = document.querySelector('.angel-placeholder');
        this.currentPancakeState = 'raw';
        this.pancakeStates = ['raw', 'cooking', 'perfect', 'burnt'];
        this.pancakeFlipCount = 0;
        
        this.qteTimeouts = [];
        this.isGameActive = false;
    }

    init() {
        this.scoreDisplay = new ScoreDisplay(document.getElementById('current-score'));
        this.qteRound = new QTERound(this.qteContainer, (score, message) => {
            this.handleQTEComplete(score, message);
        });
    }

    startGame(playerName) {
        this.currentPlayer = playerName;
        this.score = 0;
        this.qteCount = 0;
        this.isGameActive = true;
        
        // Reset pancake state
        this.currentPancakeState = 'raw';
        this.pancakeFlipCount = 0;
        this.updatePancakeVisual();
        
        this.scoreDisplay.reset();
        
        // Start 60-second game timer
        this.gameTimer = new Timer(60, 
            (remaining) => {
                this.gameTimerElement.textContent = Math.ceil(remaining);
            },
            () => {
                this.endGame();
            }
        );
        this.gameTimer.start();
        
        // Schedule QTEs at random intervals
        this.scheduleQTEs();
    }

    scheduleQTEs() {
        // Clear any existing timeouts
        this.qteTimeouts.forEach(timeout => clearTimeout(timeout));
        this.qteTimeouts = [];
        
        // Generate random times for 6 QTEs within 60 seconds
        // Ensure at least 6 seconds between QTEs (5s QTE + 1s buffer)
        const qteIntervals = [];
        let totalTime = 0;
        
        for (let i = 0; i < this.maxQTEs; i++) {
            // Random delay between 2-6 seconds
            const delay = Math.random() * 4000 + 2000;
            totalTime += delay;
            
            if (totalTime < 55000) { // Ensure last QTE can complete
                qteIntervals.push(totalTime);
            }
        }
        
        // Schedule each QTE
        qteIntervals.forEach((time, index) => {
            const timeout = setTimeout(() => {
                if (this.isGameActive) {
                    this.startQTE();
                }
            }, time);
            this.qteTimeouts.push(timeout);
        });
    }

    startQTE() {
        if (!this.isGameActive || this.qteCount >= this.maxQTEs) return;
        
        this.qteCount++;
        this.showDialogue("Flip the pancake!");
        
        // Update pancake state based on QTE count
        if (this.pancakeFlipCount < this.pancakeStates.length - 1) {
            this.currentPancakeState = this.pancakeStates[Math.min(this.pancakeFlipCount + 1, this.pancakeStates.length - 1)];
            this.updatePancakeVisual();
        }
        
        setTimeout(() => {
            this.hideDialogue();
            this.qteRound.start();
        }, 500);
    }

    handleQTEComplete(score, message) {
        this.scoreDisplay.addScore(score);
        this.score = this.scoreDisplay.targetScore;
        
        // Flip animation
        this.flipPancake();
        
        // Update pancake state based on performance
        if (score === 10) {
            // Perfect flip - maintain or improve state
            if (this.currentPancakeState === 'cooking') {
                this.currentPancakeState = 'perfect';
            }
        } else if (score === 0) {
            // Bad flip - risk of burning
            if (this.currentPancakeState === 'perfect' || this.currentPancakeState === 'cooking') {
                this.currentPancakeState = 'burnt';
            }
        }
        
        this.pancakeFlipCount++;
        
        this.showDialogue(message);
        setTimeout(() => {
            this.hideDialogue();
            this.updatePancakeVisual();
        }, 500);
        
        // Check if game should end
        if (this.qteCount >= this.maxQTEs) {
            setTimeout(() => this.endGame(), 1000);
        }
    }
    
    flipPancake() {
        // Add shaking animation to pan
        this.panElement.classList.add('shaking');
        
        // Add flipping animation to pancake
        this.pancakeElement.classList.add('flipping');
        
        setTimeout(() => {
            this.pancakeElement.classList.remove('flipping');
            this.panElement.classList.remove('shaking');
        }, 600);
    }
    
    updatePancakeVisual() {
        // Remove all state classes
        this.pancakeStates.forEach(state => {
            this.pancakeElement.classList.remove(state);
        });
        
        // Add current state class
        this.pancakeElement.classList.add(this.currentPancakeState);
    }

    showDialogue(message) {
        this.dialogueBubble.textContent = message;
        this.dialogueBubble.classList.add('show');
    }

    hideDialogue() {
        this.dialogueBubble.classList.remove('show');
    }

    endGame() {
        this.isGameActive = false;
        
        // Stop all timers and pending QTEs
        if (this.gameTimer) {
            this.gameTimer.stop();
        }
        
        this.qteTimeouts.forEach(timeout => clearTimeout(timeout));
        this.qteRound.destroy();
        
        // Get roast message based on score
        const roastMessage = this.getRoastMessage(this.score);
        
        // Transition to result screen with pancake state
        setTimeout(() => {
            window.resultScreen.show(this.score, roastMessage, this.currentPancakeState);
            window.leaderboard.addScore(this.currentPlayer, this.score);
        }, 500);
    }

    getRoastMessage(score) {
        if (score >= 50) {
            return "Wow, you're a pancake flipping master! Gordon Ramsay would be proud!";
        } else if (score >= 35) {
            return "Not bad! Your pancakes are edible, but don't quit your day job.";
        } else if (score >= 20) {
            return "Mediocre flipping skills. Your pancakes look like frisbees.";
        } else if (score >= 10) {
            return "That was painful to watch. Those pancakes are more like hockey pucks!";
        } else {
            return "Absolutely terrible! You've burnt every single pancake. Stick to cereal!";
        }
    }

    pauseGame() {
        this.isGameActive = false;
        if (this.gameTimer) {
            this.gameTimer.pause();
        }
    }

    resumeGame() {
        this.isGameActive = true;
        if (this.gameTimer) {
            this.gameTimer.resume();
        }
    }

    reset() {
        this.isGameActive = false;
        this.score = 0;
        this.qteCount = 0;
        
        // Reset pancake state
        this.currentPancakeState = 'raw';
        this.pancakeFlipCount = 0;
        this.updatePancakeVisual();
        
        if (this.gameTimer) {
            this.gameTimer.stop();
        }
        
        this.qteTimeouts.forEach(timeout => clearTimeout(timeout));
        this.qteTimeouts = [];
        
        if (this.qteRound) {
            this.qteRound.destroy();
        }
        
        this.scoreDisplay.reset();
        this.gameTimerElement.textContent = '60';
        this.hideDialogue();
    }
} 