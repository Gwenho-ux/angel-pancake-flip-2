// GameManager - Controls overall game state, QTE sequence, and score logic
class GameManager {
    constructor() {
        this.currentPlayer = '';
        this.score = 0;
        this.qteCount = 0;
        this.maxQTEs = 10;
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
        this.missedFlips = 0; // Track red zone/missed flips
        
        this.qteTimeouts = [];
        this.isGameActive = false;
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
    }

    init() {
        this.scoreDisplay = new ScoreDisplay(document.getElementById('current-score'));
        this.qteRound = new QTERound(this.qteContainer, (score, message) => {
            this.handleQTEComplete(score, message);
        });
        
        // Ensure QTE starts disabled
        this.qteRound.disableQTE();
    }

    startGame(playerName) {
        this.currentPlayer = playerName;
        this.score = 0;
        this.qteCount = 0;
        this.isGameActive = true;
        
        // Reset pancake state
        this.currentPancakeState = 'raw';
        this.pancakeFlipCount = 0;
        this.missedFlips = 0;
        this.updatePancakeVisual();
        
        this.scoreDisplay.reset();
        
        // Start cooking sound loop during gameplay
        this.audioManager.startCookingSound();
        
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
        
        // Create truly random QTE intervals with guaranteed 2-second breaks
        const qteIntervals = [];
        const minBreakTime = 2000; // 2 seconds minimum break
        const qteTime = 3000; // 3 seconds for QTE
        const dialogueTime = 1000; // 1 second for dialogue
        const totalQTECycle = qteTime + dialogueTime; // Total time for one QTE cycle
        
        // Generate random intervals ensuring 2-second breaks
        let currentTime = Math.random() * 3000 + 2000; // Start between 2-5 seconds
        
        for (let i = 0; i < this.maxQTEs; i++) {
            if (currentTime + totalQTECycle < 58000) { // Ensure QTE can complete within 60s
                qteIntervals.push(currentTime);
                
                // Next QTE: random interval between 6-11 seconds from now
                // (3s QTE + 1s dialogue + 2-6s random break)
                currentTime += totalQTECycle + minBreakTime + Math.random() * 4000;
            }
        }
        
        // Schedule each QTE at its random interval
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
        
        setTimeout(() => {
            this.hideDialogue();
            this.qteRound.start();
        }, 1000); // Increased dialogue time for better pacing
    }

    handleQTEComplete(score, message) {
        this.scoreDisplay.addScore(score);
        this.score = this.scoreDisplay.targetScore;
        
        // Play appropriate sound effects based on score
        if (score > 0) {
            this.audioManager.playFlipSound(); // Play flip sound for any successful flip
            this.flipPancake();
            // Increment flip count only for successful flips
            this.pancakeFlipCount++;
            
            // Play success sound and create sparkle effects AFTER pancake flip animation (600ms)
            if (score >= 3) {
                setTimeout(() => {
                    this.audioManager.playSuccessSound();
                    // Perfect flip (score 5) gets fancy sparkles, good flip gets regular sparkles
                    if (score === 5) {
                        this.createFancySparkleEffect();
                    } else {
                        this.createSparkleEffect();
                    }
                }, 650); // After flip animation completes (600ms) + small buffer
            } else if (score > 0) {
                // Regular flip (score 1-2) gets basic sparkles without sound AFTER flip
                setTimeout(() => {
                    this.createSparkleEffect();
                }, 650); // After flip animation completes
            }
        } else {
            // Play fail sound and effects AFTER attempted flip animation
            setTimeout(() => {
                this.audioManager.playFailSound();
                this.createFailEffect();
            }, 650); // After flip animation would complete
        }
        
        // Track missed/red zone flips (only count score 0 and negative scores)
        if (score === 0 || score < 0) {
            this.missedFlips++;
            console.log(`Red zone hit! Score: ${score}, Total missed flips: ${this.missedFlips}`);
        } else {
            console.log(`Good flip! Score: ${score}, Total missed flips: ${this.missedFlips}`);
        }
        
        // Update pancake state based on flip progression
        this.updatePancakeState();
        
        this.showDialogue(message);
        setTimeout(() => {
            this.hideDialogue();
            this.updatePancakeVisual();
        }, 2000); // Extended delay to allow effects to play after flip
        
        // Check if game should end
        if (this.qteCount >= this.maxQTEs) {
            setTimeout(() => this.endGame(), 2000);
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
    
    updatePancakeState() {
        // Pancake progression based on flip count and performance
        // Rules:
        // - If user gets 3+ red zone hits (score 0): burnt pancake
        // - Otherwise, progression based on flip count:
        //   * Flips 1-2: raw pancake (pancake_1.png)
        //   * Flips 3-4: cooking pancake (pancake_2.png) 
        //   * Flips 5-6: perfect pancake (pancake_3.png)
        
        console.log(`Flip ${this.pancakeFlipCount}: Missed flips: ${this.missedFlips}`);
        
        if (this.missedFlips >= 3) {
            // Too many red zone hits - burnt pancake
            this.currentPancakeState = 'burnt';
            console.log('Pancake burnt due to too many red zone hits');
        } else {
            // Normal progression based on flip count
            if (this.pancakeFlipCount <= 2) {
                this.currentPancakeState = 'raw';
                console.log('Pancake state: raw (early flips)');
            } else if (this.pancakeFlipCount <= 4) {
                this.currentPancakeState = 'cooking';
                console.log('Pancake state: cooking (middle flips)');
            } else {
                this.currentPancakeState = 'perfect';
                console.log('Pancake state: perfect (later flips)');
            }
        }
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

    createSparkleEffect() {
        const pancakeRect = this.pancakeElement.getBoundingClientRect();
        const panRect = this.panElement.getBoundingClientRect();
        
        // Create multiple sparkle particles
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-particle';
            sparkle.textContent = '✨';
            
            // Position sparkle at pancake center
            sparkle.style.position = 'absolute';
            sparkle.style.left = '50%';
            sparkle.style.top = '50%';
            sparkle.style.fontSize = '20px';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '10';
            
            // Random end positions
            const angle = (i / 8) * 2 * Math.PI;
            const distance = 50 + Math.random() * 30;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            sparkle.style.setProperty('--end-x', `${endX}px`);
            sparkle.style.setProperty('--end-y', `${endY}px`);
            
            this.panElement.appendChild(sparkle);
            
            // Animate sparkle
            sparkle.style.animation = 'sparkle 1s ease-out forwards';
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1000);
        }
    }

    createFancySparkleEffect() {
        const pancakeRect = this.pancakeElement.getBoundingClientRect();
        const panRect = this.panElement.getBoundingClientRect();
        
        // Create multiple waves of sparkles with different effects
        const sparkleTypes = ['✨', '⭐', '💫', '🌟', '✨'];
        const colors = ['gold', 'yellow', 'white', 'lightblue', 'pink'];
        
        // First wave - burst effect
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'fancy-sparkle-particle';
            sparkle.textContent = sparkleTypes[i % sparkleTypes.length];
            
            // Position sparkle at pancake center
            sparkle.style.position = 'absolute';
            sparkle.style.left = '50%';
            sparkle.style.top = '50%';
            sparkle.style.fontSize = `${25 + Math.random() * 15}px`;
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '10';
            sparkle.style.color = colors[i % colors.length];
            sparkle.style.textShadow = '0 0 10px currentColor';
            
            // Random end positions - larger burst
            const angle = (i / 12) * 2 * Math.PI + Math.random() * 0.5;
            const distance = 60 + Math.random() * 50;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            sparkle.style.setProperty('--end-x', `${endX}px`);
            sparkle.style.setProperty('--end-y', `${endY}px`);
            
            this.panElement.appendChild(sparkle);
            
            // Animate sparkle with fancy effect
            sparkle.style.animation = 'fancySparkle 1.5s ease-out forwards';
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1500);
        }
        
        // Second wave - delayed inner sparkles
        setTimeout(() => {
            for (let i = 0; i < 6; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'fancy-sparkle-inner';
                sparkle.textContent = '🌟';
                
                sparkle.style.position = 'absolute';
                sparkle.style.left = '50%';
                sparkle.style.top = '50%';
                sparkle.style.fontSize = '30px';
                sparkle.style.pointerEvents = 'none';
                sparkle.style.zIndex = '11';
                sparkle.style.color = 'gold';
                sparkle.style.textShadow = '0 0 15px gold';
                
                // Smaller circle pattern
                const angle = (i / 6) * 2 * Math.PI;
                const distance = 25 + Math.random() * 20;
                const endX = Math.cos(angle) * distance;
                const endY = Math.sin(angle) * distance;
                
                sparkle.style.setProperty('--end-x', `${endX}px`);
                sparkle.style.setProperty('--end-y', `${endY}px`);
                
                this.panElement.appendChild(sparkle);
                
                // Animate with rotation
                sparkle.style.animation = 'fancySparkleInner 1.2s ease-out forwards';
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 1200);
            }
        }, 200);
        
        // Add screen glow effect
        const gameContainer = document.getElementById('game-container');
        gameContainer.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
        setTimeout(() => {
            gameContainer.style.boxShadow = '';
        }, 1000);
    }

    createFailEffect() {
        const pancakeRect = this.pancakeElement.getBoundingClientRect();
        const panRect = this.panElement.getBoundingClientRect();
        
        // Create smoke particles
        for (let i = 0; i < 5; i++) {
            const smoke = document.createElement('div');
            smoke.className = 'fail-particle';
            smoke.textContent = '💨';
            
            // Position smoke at pancake center
            smoke.style.position = 'absolute';
            smoke.style.left = '50%';
            smoke.style.top = '50%';
            smoke.style.fontSize = '24px';
            smoke.style.pointerEvents = 'none';
            smoke.style.zIndex = '10';
            
            // Random end positions
            const angle = Math.random() * 2 * Math.PI;
            const distance = 30 + Math.random() * 40;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance - 20; // Drift upward
            
            smoke.style.setProperty('--end-x', `${endX}px`);
            smoke.style.setProperty('--end-y', `${endY}px`);
            
            this.panElement.appendChild(smoke);
            
            // Animate smoke
            smoke.style.animation = 'failSmoke 1.2s ease-out forwards';
            
            // Remove smoke after animation
            setTimeout(() => {
                if (smoke.parentNode) {
                    smoke.parentNode.removeChild(smoke);
                }
            }, 1200);
        }
        
        // Create big X mark
        const xMark = document.createElement('div');
        xMark.className = 'fail-x';
        xMark.textContent = '❌';
        xMark.style.position = 'absolute';
        xMark.style.left = '50%';
        xMark.style.top = '50%';
        xMark.style.fontSize = '40px';
        xMark.style.pointerEvents = 'none';
        xMark.style.zIndex = '11';
        
        this.panElement.appendChild(xMark);
        
        // Animate X mark
        xMark.style.animation = 'failX 1s ease-out forwards';
        
        // Add screen shake effect
        document.getElementById('game-container').classList.add('screen-shake');
        setTimeout(() => {
            document.getElementById('game-container').classList.remove('screen-shake');
        }, 500);
        
        // Remove X mark after animation
        setTimeout(() => {
            if (xMark.parentNode) {
                xMark.parentNode.removeChild(xMark);
            }
        }, 1000);
    }

    endGame() {
        this.isGameActive = false;
        
        // Stop cooking sound
        this.audioManager.stopCookingSound();
        
        // Stop all timers and pending QTEs
        if (this.gameTimer) {
            this.gameTimer.stop();
        }
        
        this.qteTimeouts.forEach(timeout => clearTimeout(timeout));
        
        // Properly disable and destroy QTE
        if (this.qteRound) {
            this.qteRound.disableQTE();
            this.qteRound.destroy();
        }
        
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
        
        // Stop all audio
        this.audioManager.stopCookingSound();
        
        // Reset pancake state
        this.currentPancakeState = 'raw';
        this.pancakeFlipCount = 0;
        this.missedFlips = 0;
        this.updatePancakeVisual();
        
        if (this.gameTimer) {
            this.gameTimer.stop();
        }
        
        this.qteTimeouts.forEach(timeout => clearTimeout(timeout));
        this.qteTimeouts = [];
        
        // Properly disable and reset QTE
        if (this.qteRound) {
            this.qteRound.disableQTE();
            this.qteRound.destroy();
        }
        
        this.scoreDisplay.reset();
        this.gameTimerElement.textContent = '60';
        this.hideDialogue();
    }
} 