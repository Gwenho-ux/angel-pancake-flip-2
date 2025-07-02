// GameManager - Controls overall game state, QTE sequence, and score logic
class GameManager {
    constructor() {
        this.currentPlayer = '';
        this.score = 0;
        this.qteCount = 0;
        this.gameTimer = null;
        this.qteRound = null;
        this.scoreDisplay = null;
        this.dialogueBubble = document.getElementById('dialogue-bubble');
        this.gameTimerElement = document.getElementById('game-timer');
        this.qteContainer = document.getElementById('qte-container');
        
        // Pancake state management
        this.pancakeElement = document.getElementById('game-pancake');
        this.panElement = document.querySelector('.angel-placeholder');
        this.currentPancakeState = 'empty';
        this.pancakeStates = ['empty', 'raw', 'cooking', 'perfect', 'burnt'];
        this.pancakeFlipCount = 0;
        this.missedFlips = 0; // Track red zone/missed flips
        this.temporaryBurntState = false; // Track if showing temporary burnt state
        
        // New pancake tracking
        this.totalPancakes = 0; // Total successful pancakes
        this.currentPancakeScores = []; // Array to store QTE scores for current pancake
        this.currentPancakePhase = 0; // 0: pour, 1: first flip, 2: final flip
        this.pancakeCounterElement = null; // Will be created in init()
        
        this.qteTimeouts = [];
        this.isGameActive = false;
        this.gameTimerFrame = null;
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
    }

    init() {
        this.scoreDisplay = new ScoreDisplay(document.getElementById('current-score'));
        this.qteRound = new QTERound(this.qteContainer, (score, message) => {
            this.handleQTEComplete(score, message);
        });
        
        // Make GameManager accessible to QTERound for state checking
        this.qteRound.gameManager = this;
        window.gameManager = this;
        
        // Create pancake counter UI
        this.createPancakeCounter();
        
        // Ensure QTE starts disabled
        this.qteRound.disableQTE();
    }

    createPancakeCounter() {
        // Create pancake counter display element
        const gameHeader = document.querySelector('.game-header');
        const scoreDisplay = document.querySelector('.score-display');
        const timerDisplay = document.querySelector('.timer-display');
        
        // Create a container for all three displays in one line
        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats-container';
        
        // Move score display into stats container and add emoji
        scoreDisplay.parentNode.insertBefore(statsContainer, scoreDisplay);
        const scoreLabel = scoreDisplay.querySelector('.label');
        scoreLabel.innerHTML = 'SCORE';
        const scoreValue = scoreDisplay.querySelector('#current-score');
        scoreValue.innerHTML = '🏆 0';
        statsContainer.appendChild(scoreDisplay);
        
        // Create pancake counter with pancake emoji
        const pancakeCounter = document.createElement('div');
        pancakeCounter.className = 'pancake-counter';
        pancakeCounter.innerHTML = `
            <span class="label">PANCAKES</span>
            <span id="pancake-count">🥞 0</span>
        `;
        
        // Add pancake counter to stats container
        statsContainer.appendChild(pancakeCounter);
        
        // Move timer display to stats container and add clock emoji
        const timerLabel = timerDisplay.querySelector('.label');
        timerLabel.innerHTML = 'TIME';
        const timerValue = timerDisplay.querySelector('#game-timer');
        timerValue.innerHTML = '⏰ 60';
        statsContainer.appendChild(timerDisplay);
        
        // Add sound controls to game header for mobile
        const soundControls = document.createElement('div');
        soundControls.className = 'game-header-sound-controls';
        soundControls.innerHTML = `
            <button id="music-btn-header" class="music-button" title="Toggle Music">🎵</button>
            <button id="mute-btn-header" class="mute-button" title="Toggle All Sounds">🔊</button>
        `;
        gameHeader.appendChild(soundControls);
        
        this.pancakeCounterElement = document.getElementById('pancake-count');
    }

    startGame(playerName) {
        this.currentPlayer = playerName;
        this.score = 0;
        this.qteCount = 0;
        this.isGameActive = true;
        this.gameStartTime = Date.now(); // Store start time for difficulty calculation
        
        // Add game-active class to body and container for mobile layout
        document.body.classList.add('game-active');
        document.getElementById('game-container').classList.add('game-active');
        
        // Reset pancake state
        this.currentPancakeState = 'empty';
        this.pancakeFlipCount = 0;
        this.missedFlips = 0;
        this.temporaryBurntState = false;
        this.totalPancakes = 0;
        this.currentPancakeScores = [];
        this.currentPancakePhase = 0;
        this.updatePancakeVisual();
        this.updatePancakeCounter();
        
        this.scoreDisplay.reset();
        
        // Start cooking sound loop during gameplay
        this.audioManager.startCookingSound();
        
        // Start 60-second game timer - optimized for performance
        this.gameTimerElement.textContent = '⏰ 60';
        const gameStartTime = Date.now();
        const gameDuration = 60000; // 60 seconds
        let lastDisplayedTime = 60;
        
        const updateGameTimer = () => {
            if (!this.isGameActive) return;
            
            const elapsed = Date.now() - gameStartTime;
            const remaining = Math.max(0, gameDuration - elapsed);
            const displayTime = Math.ceil(remaining / 1000);
            
            // Only update DOM if the displayed value changes
            if (displayTime !== lastDisplayedTime) {
                lastDisplayedTime = displayTime;
                this.gameTimerElement.textContent = `⏰ ${displayTime}`;
            }
            
            if (remaining > 0) {
                this.gameTimerFrame = requestAnimationFrame(updateGameTimer);
            } else {
                this.endGame();
            }
        };
        
        this.gameTimerFrame = requestAnimationFrame(updateGameTimer);
        
        // Schedule QTEs at random intervals
        this.scheduleQTEs();
    }

    scheduleQTEs() {
        // Clear any existing timeouts
        this.qteTimeouts.forEach(timeout => clearTimeout(timeout));
        this.qteTimeouts = [];
        
        // Start first QTE immediately
        setTimeout(() => {
            if (this.isGameActive) {
                this.startQTE();
            }
        }, 50); // Minimal delay to ensure game is ready
        
        // Create continuous QTE intervals with NO breaks
        const qteTime = 3000; // 3 seconds for QTE
        const totalQTECycle = qteTime; // Just QTE time, no dialogue delays
        
        // Generate continuous QTEs throughout the entire 60 seconds
        let currentTime = totalQTECycle; // Start immediately after first QTE
        
        // Keep scheduling QTEs until we run out of time
        while (currentTime < 60000) { // Schedule QTEs for the full 60 seconds
            const timeout = setTimeout(() => {
                if (this.isGameActive) {
                    this.startQTE();
                }
            }, currentTime);
            this.qteTimeouts.push(timeout);
            
            // Next QTE: NO break - start immediately after previous cycle
            currentTime += totalQTECycle;
        }
    }

    updatePancakeCounter() {
        if (this.pancakeCounterElement) {
            this.pancakeCounterElement.textContent = `🥞 ${this.totalPancakes}`;
        }
    }

    calculateDifficulty() {
        // Get elapsed time (0-60 seconds)
        const gameStartTime = this.gameStartTime || Date.now();
        const elapsed = Math.min((Date.now() - gameStartTime) / 1000, 60);
        const progress = elapsed / 60; // 0 to 1
        
        // Make changes visible immediately by adding QTE count factor
        const qteProgress = Math.min(this.qteCount / 20, 1); // Max difficulty after 20 QTEs
        const combinedProgress = Math.max(progress, qteProgress * 0.5); // Use whichever is higher
        
        // 1. Green zone gets smaller (70% -> 15%) - VERY dramatic change
        const greenZoneSize = 70 - (combinedProgress * 55);
        
        // 2. Yellow line COMPLETELY random position every time
        const minPos = 15 + (combinedProgress * 10); // Move away from edges as difficulty increases
        const maxPos = 85 - (combinedProgress * 10);
        const yellowPosition = minPos + (Math.random() * (maxPos - minPos));
        
        // 3. Speed increases (1x -> 2.5x)
        const speedMultiplier = 1 + (combinedProgress * 1.5);
        
        console.log(`🎯 Difficulty Update: QTE#${this.qteCount}, Time=${elapsed.toFixed(1)}s, Progress=${(combinedProgress*100).toFixed(1)}%, Green=${greenZoneSize.toFixed(1)}%, Yellow=${yellowPosition.toFixed(1)}%, Speed=${speedMultiplier.toFixed(2)}x`);
        
        return { greenZoneSize, yellowPosition, speedMultiplier };
    }

    startQTE() {
        if (!this.isGameActive) return;
        
        this.qteCount++;
        
        // Calculate and apply progressive difficulty
        const difficulty = this.calculateDifficulty();
        this.qteRound.setDifficulty(difficulty.greenZoneSize, difficulty.yellowPosition, difficulty.speedMultiplier);
        
        // Different dialogue based on pancake phase (only 2 flips now)
        let dialogue = "";
        if (this.currentPancakePhase === 0) {
            dialogue = "First flip!";
            // Ensure pancake is raw when starting first flip
            if (this.currentPancakeState === 'empty') {
                this.currentPancakeState = 'raw';
                this.updatePancakeVisual();
            }
        } else {
            dialogue = "Final flip!";
        }
        
        // Show dialogue and start QTE immediately - no delay
        this.showDialogue(dialogue);
        this.qteRound.start();
        
        // Hide dialogue after 500ms
        setTimeout(() => {
            this.hideDialogue();
        }, 500);
    }

    handleQTEComplete(score, message) {
        this.scoreDisplay.addScore(score);
        this.score = this.scoreDisplay.targetScore;
        
        // Store the QTE score for current pancake
        this.currentPancakeScores.push(score);
        
        // Track missed/red zone flips (only count score 0 and negative scores)
        if (score === 0 || score < 0) {
            this.missedFlips++;
            console.log(`Red zone hit! Score: ${score}, Total missed flips: ${this.missedFlips}`);
            
            // Special case: timeout with pancake in pan (score 0 from timeout)
            if (score === 0 && message === 'Too slow!' && this.currentPancakeState !== 'empty') {
                this.handleTimeoutWithPancake();
                return;
            }
        } else {
            console.log(`Good flip! Score: ${score}, Total missed flips: ${this.missedFlips}`);
        }
        
        // Handle flip scenarios (only 2 flips now)
        if (score > 0) {
            // Successful flip
            this.audioManager.playFlipSound();
            this.flipPancake();
            this.pancakeFlipCount++;
            
            // Update pancake state after flip
            this.updatePancakeState();
            
            // Play success sound and effects
            setTimeout(() => {
                if (score === 10) {
                    this.audioManager.playSuccessSound();
                    this.createFancySparkleEffect();
                } else {
                    this.audioManager.playSuccessSound();
                    this.createSparkleEffect();
                }
            }, 300);
            
            this.currentPancakePhase++;
        } else {
            // Failed flip - handle burnt pancake scenarios
            this.handleBurntPancake();
            return; // Exit early as burnt pancake handling takes over
        }
        
        // Check if pancake is complete (2 QTEs done)
        if (this.currentPancakeScores.length === 2) {
            // After 2 flips, show flip animation, then perfect pancake, then fly to counter
            if (this.pancakeFlipCount >= 2) {
                // First show the flip animation for the final flip
                this.flipPancake();
                
                // After flip animation, show perfect pancake
                setTimeout(() => {
                    this.currentPancakeState = 'perfect';
                    this.updatePancakeVisual();
                    
                    // Show perfect pancake for 0.5 seconds, then fly to counter
                    setTimeout(() => {
                        this.animatePancakeToCounter(() => {
                            this.totalPancakes++;
                            this.updatePancakeCounter();
                            this.resetPancakeCounters();
                        });
                    }, 500); // Show perfect pancake for 0.5 seconds
                }, 600); // Wait for flip animation to complete (600ms)
            } else {
                this.completePancake();
            }
        }
        
        // Update pancake visual
        this.updatePancakeVisual();
    }
    
    handleBurntPancake() {
        // Play fail sound and effects immediately
        this.audioManager.playFailSound();
        this.createFailEffect();
        
        // Check if this is the second failed flip (burnt twice scenario)
        if (this.missedFlips >= 2) {
            // Show burnt pancake for 1 second then throw away
            this.currentPancakeState = 'burnt';
            this.updatePancakeVisual();
            this.createBurntSmoke();
            
            setTimeout(() => {
                this.animateBurntPancakeAway(() => {
                    this.resetPancakeCounters();
                });
            }, 1000);
        } else {
            // First failed flip - continue to next phase
            this.currentPancakePhase++;
        }
    }
    
    handleTimeoutWithPancake() {
        // User didn't click when there was a pancake - burn it and throw away
        this.currentPancakeState = 'burnt';
        this.updatePancakeVisual();
        
        // Play fail sound and effects
        this.audioManager.playFailSound();
        this.createFailEffect();
        this.createBurntSmoke();
        
        // After 1 second, throw away burnt pancake
        setTimeout(() => {
            this.animateBurntPancakeAway(() => {
                this.resetPancakeCounters();
            });
        }, 1000);
    }

    resetPancakeCounters() {
        this.currentPancakeScores = [];
        this.currentPancakePhase = 0;
        this.pancakeFlipCount = 0;
        this.missedFlips = 0;
        this.temporaryBurntState = false;
        this.currentPancakeState = 'empty';
        this.updatePancakeVisual();
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
    
    completePancake() {
        // Calculate total score for this pancake
        const totalScore = this.currentPancakeScores.reduce((sum, score) => sum + score, 0);
        
        // Check if both flips were missed (pancakeFlipCount = 0 means no successful flips)
        const bothFlipsMissed = this.pancakeFlipCount === 0;
        
        // Determine pancake grade
        let grade = '';
        let isCounted = false;
        
        if (bothFlipsMissed) {
            // Both flips missed - burnt pancake, not counted
            grade = 'Burnt!';
            isCounted = false;
            // Show burnt pancake immediately
            this.currentPancakeState = 'burnt';
            this.updatePancakeVisual();
        } else if (totalScore >= 18) { // Perfect: 2x9+ scores
            grade = 'Perfect!';
            isCounted = true;
        } else if (totalScore >= 12) { // Good: 2x6+ scores  
            grade = 'Good!';
            isCounted = true;
        } else if (totalScore >= 6) { // Mid: 2x3+ scores
            grade = 'Mid!';
            isCounted = true;
        } else if (totalScore >= 1) {
            grade = 'Burnt!';
            isCounted = false;
        } else {
            grade = 'Trash!';
            isCounted = false;
        }
        
        // Show floating text with grade
        this.showPancakeGrade(grade, isCounted);
        
        // Wait 0.3 second to show the final pancake state
        setTimeout(() => {
            if (bothFlipsMissed) {
                // Both flips missed - animate pancake flying to the right and fading out
                this.animateBurntPancakeAway(() => {
                    // Reset counters after burnt pancake flies away
                    this.pancakeFlipCount = 0;
                    this.missedFlips = 0;
                    this.temporaryBurntState = false;
                    
                    // No need to show hint - next QTE will handle it
                });
            } else if (isCounted) {
                // Successful pancake - animate flying to counter
                this.animatePancakeToCounter(() => {
                    this.totalPancakes++;
                    this.updatePancakeCounter();
                    
                    // Reset counters (pan already empty from animation)
                    this.pancakeFlipCount = 0;
                    this.missedFlips = 0;
                    this.temporaryBurntState = false;
                    
                    // No need to show hint - next QTE will handle it
                });
            } else {
                // For other failed pancakes, just reset after showing
                this.currentPancakeState = 'empty';
                this.updatePancakeVisual();
                this.pancakeFlipCount = 0;
                this.missedFlips = 0;
                this.temporaryBurntState = false;
                
                // No need to show hint - next QTE will handle it
            }
        }, 300); // Wait 0.3 second before flying/resetting
        
        // Reset for next pancake
        this.currentPancakeScores = [];
        this.currentPancakePhase = 0;
        
        console.log(`Pancake complete! Total score: ${totalScore}, Grade: ${grade}, Counted: ${isCounted}, Both flips missed: ${bothFlipsMissed}`);
    }

    showPancakeGrade(grade, isSuccess) {
        const floatingText = document.createElement('div');
        floatingText.className = 'pancake-grade-text';
        floatingText.textContent = grade;
        
        // Style based on success/failure
        if (isSuccess) {
            if (grade === 'Perfect!') {
                floatingText.style.color = '#FFD700';
                floatingText.style.textShadow = '0 0 10px #FFD700';
            } else if (grade === 'Good!') {
                floatingText.style.color = '#00D4FF';
                floatingText.style.textShadow = '0 0 10px #00D4FF';
            } else {
                floatingText.style.color = '#B026FF';
                floatingText.style.textShadow = '0 0 10px #B026FF';
            }
        } else {
            floatingText.style.color = '#FF0099';
            floatingText.style.textShadow = '0 0 10px #FF0099';
            
            // Add smoke effect for burnt/trash
            if (grade === 'Burnt!' || grade === 'Trash!') {
                this.createBurntSmoke();
            }
        }
        
        // Position above pan
        floatingText.style.cssText += `
            position: absolute;
            left: 50%;
            top: -30px;
            transform: translateX(-50%);
            font-size: 2em;
            font-weight: bold;
            z-index: 20;
            animation: floatUp 2s ease-out forwards;
        `;
        
        this.panElement.appendChild(floatingText);
        
        // Remove after animation
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 2000);
    }

    animatePancakeToCounter(callback) {
        // Clone the pancake for animation
        const flyingPancake = this.pancakeElement.cloneNode(true);
        flyingPancake.id = '';
        flyingPancake.classList.add('flying-pancake');
        
        // Get positions
        const pancakeRect = this.pancakeElement.getBoundingClientRect();
        const counterRect = this.pancakeCounterElement.getBoundingClientRect();
        const gameRect = document.getElementById('game-container').getBoundingClientRect();
        
        // Set initial position
        flyingPancake.style.cssText = `
            position: absolute;
            left: ${pancakeRect.left - gameRect.left}px;
            top: ${pancakeRect.top - gameRect.top}px;
            width: ${pancakeRect.width}px;
            height: ${pancakeRect.height}px;
            z-index: 100;
            transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
        `;
        
        document.getElementById('game-container').appendChild(flyingPancake);
        
        // Hide original pancake immediately when flying starts
        this.currentPancakeState = 'empty';
        this.updatePancakeVisual();
        
        // Trigger animation after a frame
        requestAnimationFrame(() => {
            flyingPancake.style.left = `${counterRect.left - gameRect.left + counterRect.width / 2 - 25}px`;
            flyingPancake.style.top = `${counterRect.top - gameRect.top + counterRect.height / 2 - 25}px`;
            flyingPancake.style.width = '50px';
            flyingPancake.style.height = '50px';
            flyingPancake.style.transform = 'rotate(360deg)';
        });
        
        // Clean up and callback
        setTimeout(() => {
            flyingPancake.remove();
            
            // Add pulse effect to counter
            this.pancakeCounterElement.parentElement.style.animation = 'pulse 0.5s ease-out';
            setTimeout(() => {
                this.pancakeCounterElement.parentElement.style.animation = '';
            }, 500);
            
            if (callback) callback();
        }, 800);
    }

    animateBurntPancakeAway(callback) {
        // Clone the pancake for animation
        const flyingPancake = this.pancakeElement.cloneNode(true);
        flyingPancake.id = '';
        flyingPancake.classList.add('flying-burnt-pancake');
        
        // Get positions
        const pancakeRect = this.pancakeElement.getBoundingClientRect();
        const gameRect = document.getElementById('game-container').getBoundingClientRect();
        
        // Set initial position
        flyingPancake.style.cssText = `
            position: absolute;
            left: ${pancakeRect.left - gameRect.left}px;
            top: ${pancakeRect.top - gameRect.top}px;
            width: ${pancakeRect.width}px;
            height: ${pancakeRect.height}px;
            z-index: 100;
            transition: all 0.8s ease-out;
        `;
        
        document.getElementById('game-container').appendChild(flyingPancake);
        
        // Hide original pancake immediately when flying starts
        this.currentPancakeState = 'empty';
        this.updatePancakeVisual();
        
        // Trigger animation after a frame - fly to the right and fade out
        requestAnimationFrame(() => {
            flyingPancake.style.left = `${gameRect.width + 100}px`; // Fly off screen to the right
            flyingPancake.style.top = `${pancakeRect.top - gameRect.top + Math.random() * 50 - 25}px`; // Slight vertical variation
            flyingPancake.style.opacity = '0'; // Fade out
            flyingPancake.style.transform = 'rotate(180deg) scale(0.8)'; // Rotate and shrink slightly
        });
        
        // Clean up and callback
        setTimeout(() => {
            flyingPancake.remove();
            
            if (callback) callback();
        }, 800); // Same duration as the transition
    }

    createBurntSmoke() {
        // Create smoke effect for burnt pancakes
        for (let i = 0; i < 3; i++) {
            const smoke = document.createElement('div');
            smoke.textContent = '💨';
            smoke.style.cssText = `
                position: absolute;
                left: ${40 + Math.random() * 20}%;
                top: 50%;
                font-size: 30px;
                opacity: 0.7;
                z-index: 15;
                animation: smokeRise 2s ease-out forwards;
                animation-delay: ${i * 0.2}s;
            `;
            
            this.panElement.appendChild(smoke);
            
            setTimeout(() => {
                if (smoke.parentNode) {
                    smoke.parentNode.removeChild(smoke);
                }
            }, 2500);
        }
    }

    updatePancakeState() {
        // Don't update if pancake is empty (hasn't been poured yet)
        if (this.currentPancakeState === 'empty') {
            return;
        }
        
        // Don't update if temporarily showing burnt state
        if (this.temporaryBurntState) {
            return;
        }
        
        // New pancake progression rules:
        // - If user gets any successful flip: perfect pancake
        // - Only burns if both flips are missed (will be handled in completePancake)
        
        console.log(`Flip ${this.pancakeFlipCount}: Missed flips: ${this.missedFlips}`);
        
        // If we have any successful flips, show perfect pancake
        if (this.pancakeFlipCount > 0) {
            this.currentPancakeState = 'perfect';
            console.log('Pancake state: perfect (after any successful flip)');
        } else {
            // Stay raw until first successful flip
            this.currentPancakeState = 'raw';
            console.log('Pancake state: raw (no successful flips yet)');
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
        
        // Create more sparkles than regular effect but keep it simple
        const sparkleTypes = ['✨', '⭐', '💫', '🌟'];
        const colors = ['gold', 'yellow', 'white', 'lightblue'];
        
        // Create more sparkle particles than regular effect
        for (let i = 0; i < 16; i++) {
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
            sparkle.style.textShadow = `0 0 10px currentColor`;
            
            // Random end positions - slightly larger burst than regular
            const angle = (i / 16) * 2 * Math.PI + Math.random() * 0.2;
            const distance = 60 + Math.random() * 40;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            sparkle.style.setProperty('--end-x', `${endX}px`);
            sparkle.style.setProperty('--end-y', `${endY}px`);
            
            this.panElement.appendChild(sparkle);
            
            // Use the same sparkle animation as regular sparkles
            sparkle.style.animation = 'sparkle 1.2s ease-out forwards';
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1200);
        }
        
        // Add a simple "PERFECT!" text floating up
        const perfectText = document.createElement('div');
        perfectText.textContent = 'PERFECT!';
        perfectText.style.cssText = `
            position: absolute;
            left: 50%;
            top: -80px;
            transform: translateX(-50%);
            font-size: 2.5em;
            font-weight: bold;
            color: gold;
            text-shadow: 0 0 10px gold;
            z-index: 20;
            animation: floatUp 1.5s ease-out forwards;
        `;
        this.panElement.appendChild(perfectText);
        
        setTimeout(() => {
            if (perfectText.parentNode) {
                perfectText.parentNode.removeChild(perfectText);
            }
        }, 1500);
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
        
        // Remove game-active class from body and container
        document.body.classList.remove('game-active');
        document.getElementById('game-container').classList.remove('game-active');
        
        // Stop cooking sound
        this.audioManager.stopCookingSound();
        
        // Stop all timers and pending QTEs
        if (this.gameTimerFrame) {
            cancelAnimationFrame(this.gameTimerFrame);
            this.gameTimerFrame = null;
        }
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
        
        // Transition to result screen with pancake state and count
        setTimeout(() => {
            window.resultScreen.show(this.score, roastMessage, this.currentPancakeState, this.totalPancakes);
            window.leaderboard.addScore(this.currentPlayer, this.score, this.totalPancakes);
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
        
        // Remove game-active class from body and container
        document.body.classList.remove('game-active');
        document.getElementById('game-container').classList.remove('game-active');
        
        // Stop all audio
        this.audioManager.stopCookingSound();
        
        // Reset pancake state
        this.currentPancakeState = 'empty';
        this.pancakeFlipCount = 0;
        this.missedFlips = 0;
        this.temporaryBurntState = false;
        this.totalPancakes = 0;
        this.currentPancakeScores = [];
        this.currentPancakePhase = 0;
        this.updatePancakeVisual();
        this.updatePancakeCounter();
        
        if (this.gameTimerFrame) {
            cancelAnimationFrame(this.gameTimerFrame);
            this.gameTimerFrame = null;
        }
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
        this.gameTimerElement.textContent = '⏰ 60';
        this.hideDialogue();
    }
} 