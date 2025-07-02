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
        this.panElement = document.querySelector('.pan-container') || document.querySelector('.angel-placeholder');
        this.currentPancakeState = 'empty';
        this.pancakeStates = ['empty', 'raw', 'cooking', 'perfect', 'burnt'];
        this.pancakeFlipCount = 0;
        this.missedFlips = 0; // Track red zone/missed flips
        this.temporaryBurntState = false; // Track if showing temporary burnt state
        this.consecutiveMisses = 0; // Track consecutive misses for burnt logic
        
        // New pancake tracking
        this.totalPancakes = 0; // Total successful pancakes
// Removed currentPancakeScores - single flip system doesn't need it
        this.currentPancakePhase = 0; // 0: single flip only
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
        
        // Sound controls removed - only keep global controls at top-right
        
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
        this.consecutiveMisses = 0;
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
        this.nextQTEScheduled = false;
        
        // Start first QTE immediately
        setTimeout(() => {
            if (this.isGameActive) {
                this.startQTE();
            }
        }, 50); // Minimal delay to ensure game is ready
    }

    scheduleNextQTE() {
        // Only schedule next QTE if game is still active and none is scheduled
        if (!this.isGameActive || this.nextQTEScheduled) return;
        
        this.nextQTEScheduled = true;
        
        // Wait a bit before starting next QTE to allow for animations/cleanup
        const timeout = setTimeout(() => {
            this.nextQTEScheduled = false;
            if (this.isGameActive) {
                this.startQTE();
            }
        }, 1000); // 1 second gap between QTEs
        
        this.qteTimeouts.push(timeout);
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
        
        // 1. Green zone gets smaller (70% -> 15%) - VERY dramatic change - 15% HARDER
        const greenZoneSize = 60 - (combinedProgress * 45); // Now 60% -> 15% (was 70% -> 15%)
        
        // 2. Yellow line COMPLETELY random position every time
        const minPos = 15 + (combinedProgress * 10); // Move away from edges as difficulty increases
        const maxPos = 85 - (combinedProgress * 10);
        const yellowPosition = minPos + (Math.random() * (maxPos - minPos));
        
        // 3. Speed increases (1x -> 2.9x) - 15% HARDER  
        const speedMultiplier = 1 + (combinedProgress * 1.9); // Now 1x -> 2.9x (was 1x -> 2.5x)
        
        console.log(`🎯 Difficulty Update: QTE#${this.qteCount}, Time=${elapsed.toFixed(1)}s, Progress=${(combinedProgress*100).toFixed(1)}%, Green=${greenZoneSize.toFixed(1)}%, Yellow=${yellowPosition.toFixed(1)}%, Speed=${speedMultiplier.toFixed(2)}x`);
        
        return { greenZoneSize, yellowPosition, speedMultiplier };
    }

    startQTE() {
        if (!this.isGameActive) return;
        
        this.qteCount++;
        
        // Calculate and apply progressive difficulty
        const difficulty = this.calculateDifficulty();
        this.qteRound.setDifficulty(difficulty.greenZoneSize, difficulty.yellowPosition, difficulty.speedMultiplier);
        
        // Single flip only - simple dialogue
        let dialogue = "Flip it!";
        console.log(`🎯 startQTE: Starting single flip QTE`);
        
        // Ensure pancake is raw when starting flip
        if (this.currentPancakeState === 'empty') {
            this.currentPancakeState = 'raw';
            this.updatePancakeVisual();
        }
        
        console.log(`🎯 startQTE: Will show dialogue "${dialogue}"`);
        
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
        
        console.log(`🥞 SINGLE FLIP RESULT: Score = ${score}, Message = "${message}"`);
        console.log(`🔍 DEBUG: Score type = ${typeof score}, Score === 0? ${score === 0}, Score < 0? ${score < 0}`);
        console.log(`🔍 DEBUG: Message = "${message}", Message is Missed? ${message === "Missed!"}, Message is Too slow? ${message === "Too slow!"}`);
        
        // SINGLE FLIP LOGIC: 1 FLIP = 1 PANCAKE  
        // Check for ANY failure condition
        const isMiss = (score === 0 || score < 0 || message === "Missed!" || message === "Too slow!");
        console.log(`🔍 DEBUG: isMiss = ${isMiss}`);
        
        if (isMiss) {
            // MISS/RED ZONE: Immediate burnt pancake (since it's only 1 flip per pancake)
            console.log('❌ MISS: Pancake burnt and thrown away (single flip system)');
            this.audioManager.playFailSound();
            this.createFailEffect();
            this.showDialogue("Burnt!");
            
            // Show burnt pancake
            this.currentPancakeState = 'burnt';
            this.updatePancakeVisual();
            this.createBurntSmoke();
            
            setTimeout(() => {
                this.hideDialogue();
                this.animateBurntPancakeAway(() => {
                    this.resetPancakeCounters(); // Auto-refill with new pancake
                    this.scheduleNextQTE(); // Schedule next QTE after burnt pancake cleanup
                });
            }, 1000);
            
        } else if (score === 10) {
            // PERFECT HIT (Yellow line): Big sparkles + fly to counter
            console.log('🌟 PERFECT HIT: Big sparkles + perfect pancake');
            this.audioManager.playSuccessSound();
            this.audioManager.playFlipSound();
            this.flipPancake();
            
            // Show perfect pancake
            this.currentPancakeState = 'perfect';
            this.updatePancakeVisual();
            
            // Big sparkle effect
            this.createPerfectSparkleEffect();
            
            // After flip animation, fly to counter
            setTimeout(() => {
                this.animatePancakeToCounter(() => {
                    this.totalPancakes++;
                    this.updatePancakeCounter();
                    this.resetPancakeCounters(); // Auto-refill with new pancake
                    this.scheduleNextQTE(); // Schedule next QTE after perfect hit
                });
            }, 600);
            
        } else {
            // GREEN ZONE HIT: Small sparkles + fly to counter
            console.log('✨ GREEN HIT: Small sparkles + perfect pancake');
            this.audioManager.playSuccessSound();
            this.audioManager.playFlipSound();
            this.flipPancake();
            
            // Show perfect pancake
            this.currentPancakeState = 'perfect';
            this.updatePancakeVisual();
            
            // Small sparkle effect for green zone hits
            this.createGoodSparkleEffect();
            
            // After flip animation, fly to counter
            setTimeout(() => {
                this.animatePancakeToCounter(() => {
                    this.totalPancakes++;
                    this.updatePancakeCounter();
                    this.resetPancakeCounters(); // Auto-refill with new pancake
                    this.scheduleNextQTE(); // Schedule next QTE after green hit
                });
            }, 600);
        }
    }
    

    


    resetPancakeCounters() {
        this.currentPancakePhase = 0;
        this.temporaryBurntState = false;
        
        // Auto-refill with new raw pancake for continuous cooking
        this.currentPancakeState = 'raw';
        this.updatePancakeVisual();
        
        console.log('🥞 New pancake auto-refilled in pan!');
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
        // Simple single-flip logic - pancake state is handled directly in handleQTEComplete
        // This method is kept for compatibility but doesn't need to do much
        console.log(`Pancake state: ${this.currentPancakeState}`);
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

    createGoodSparkleEffect() {
        console.log('✨ Creating GOOD sparkle effect for regular success...');
        
        // Get the pancake's position on screen
        const pancakeRect = this.pancakeElement.getBoundingClientRect();
        
        // Create fewer, simpler sparkles for good flips (4 sparkles)
        for (let i = 0; i < 4; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'good-sparkle-particle';
            sparkle.textContent = '✨';
            
            // Position sparkles at the pancake's screen position
            sparkle.style.cssText = `
                position: fixed;
                left: ${pancakeRect.left + pancakeRect.width / 2}px;
                top: ${pancakeRect.top + pancakeRect.height / 2}px;
                font-size: 25px;
                pointer-events: none;
                z-index: 10000;
                color: #FFD700;
                text-shadow: 0 0 8px #FFD700;
                transform: translate(-50%, -50%);
            `;
            
            // Smaller burst pattern for good flips
            const angle = (i / 4) * 2 * Math.PI;
            const distance = 40 + Math.random() * 20;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            sparkle.style.setProperty('--end-x', `${endX}px`);
            sparkle.style.setProperty('--end-y', `${endY}px`);
            
            document.body.appendChild(sparkle);
            
            // Shorter animation for good flips
            sparkle.style.animation = 'sparkle 1.5s ease-out forwards';
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1500);
        }
        
        console.log('✨ Good sparkle effect created!');
    }



    createPerfectSparkleEffect() {
        console.log('✨ Creating PERFECT sparkle effect for perfect score!');
        
        // Get the pancake's position on screen
        const pancakeRect = this.pancakeElement.getBoundingClientRect();
        
        // Create many sparkle particles for perfect effect (12 sparkles, all ✨)
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'perfect-sparkle-particle';
            sparkle.textContent = '✨';
            
            // Position sparkle at pancake center on screen
            sparkle.style.cssText = `
                position: fixed;
                left: ${pancakeRect.left + pancakeRect.width / 2}px;
                top: ${pancakeRect.top + pancakeRect.height / 2}px;
                font-size: ${35 + Math.random() * 15}px;
                pointer-events: none;
                z-index: 10000;
                color: #FFD700;
                text-shadow: 0 0 15px #FFD700;
                transform: translate(-50%, -50%);
            `;
            
            // Large burst pattern for perfect flips
            const angle = (i / 12) * 2 * Math.PI + Math.random() * 0.3;
            const distance = 70 + Math.random() * 50;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            sparkle.style.setProperty('--end-x', `${endX}px`);
            sparkle.style.setProperty('--end-y', `${endY}px`);
            
            document.body.appendChild(sparkle);
            
            // Longer animation for perfect flips with staggered timing
            const delay = Math.random() * 300; // 0-300ms delay
            sparkle.style.animationDelay = `${delay}ms`;
            sparkle.style.animation = 'sparkle 2.5s ease-out forwards';
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 2500 + delay);
        }
        
        // Add "PERFECT!" text floating up
        const perfectText = document.createElement('div');
        perfectText.textContent = 'PERFECT!';
        perfectText.style.cssText = `
            position: fixed;
            left: ${pancakeRect.left + pancakeRect.width / 2}px;
            top: ${pancakeRect.top + pancakeRect.height / 2 - 80}px;
            transform: translateX(-50%);
            font-size: 2.5em;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700;
            z-index: 20000;
            animation: floatUp 2s ease-out forwards;
        `;
        document.body.appendChild(perfectText);
        
        setTimeout(() => {
            if (perfectText.parentNode) {
                perfectText.parentNode.removeChild(perfectText);
            }
        }, 2000);
        
        console.log('🌟 Perfect sparkle effect created!');
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