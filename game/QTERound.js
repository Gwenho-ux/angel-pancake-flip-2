// QTERound - Handles individual Quick Time Event logic and visuals
class QTERound {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.marker = document.getElementById('marker');
        this.tapButton = document.getElementById('tap-btn');
        this.qteTimerFill = document.getElementById('qte-timer-fill');
        
        this.markerPosition = 0;
        this.markerDirection = 1;
        this.baseSpeed = 2.0; // Base speed for difficulty scaling
        this.markerSpeed = this.baseSpeed;
        this.animationFrame = null;
        this.timerFrame = null;
        this.qteTimer = null;
        this.hasBeenTapped = false;
        this.isActive = false;
        this.lastFrameTime = 0;
        
        // Difficulty parameters - will be updated by GameManager
        this.difficulty = {
            greenZoneSize: 50,    // Green zone size as percentage (50% = 25-75%)
            yellowPosition: 50,   // Yellow line position as percentage
            speedMultiplier: 1.0  // Speed multiplier for marker movement
        };
        
        this.init();
    }

    init() {
        this.tapButton.addEventListener('click', () => this.handleTap());
        
        // Add keyboard event listener for spacebar
        this.keyHandler = (event) => {
            if (event.code === 'Space' && this.isActive && !this.hasBeenTapped) {
                event.preventDefault(); // Prevent page scrolling
                this.handleTap();
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
        this.disableQTE(); // Start with QTE disabled
    }

    /**
     * Set difficulty parameters for this QTE round
     * @param {number} greenZoneSize - Size of green zone (25-75 means 50% size)
     * @param {number} yellowPosition - Position of yellow line (0-100%)
     * @param {number} speedMultiplier - Speed multiplier for marker movement
     */
    setDifficulty(greenZoneSize, yellowPosition, speedMultiplier) {
        this.difficulty.greenZoneSize = Math.max(15, Math.min(80, greenZoneSize)); // Clamp 15-80%
        this.difficulty.yellowPosition = Math.max(10, Math.min(90, yellowPosition)); // Clamp 10-90%
        this.difficulty.speedMultiplier = Math.max(0.5, Math.min(4.0, speedMultiplier)); // Clamp 0.5-4.0x
        
        // Update marker speed
        this.markerSpeed = this.baseSpeed * this.difficulty.speedMultiplier;
        
        console.log(`🎮 QTE Difficulty Applied: Green=${this.difficulty.greenZoneSize.toFixed(1)}%, Yellow=${this.difficulty.yellowPosition.toFixed(1)}%, Speed=${this.difficulty.speedMultiplier.toFixed(2)}x (${this.markerSpeed.toFixed(2)})`);
        
        // Update visual zones
        this.updateVisualZones();
    }

    /**
     * Update the visual appearance of QTE zones based on current difficulty
     */
    updateVisualZones() {
        const greenZone = this.container.querySelector('.green-zone');
        const yellowLine = this.container.querySelector('.yellow-line');
        const leftRedZone = this.container.querySelector('.red-zone.left');
        const rightRedZone = this.container.querySelector('.red-zone.right');
        
        if (greenZone && yellowLine && leftRedZone && rightRedZone) {
            // Calculate zone sizes
            const redZoneSize = (100 - this.difficulty.greenZoneSize) / 2;
            
            // Keep yellow line always blue
            yellowLine.style.backgroundColor = '#4DA8E5';
            yellowLine.style.boxShadow = '0 0 8px #4DA8E5';
            
            // Update zone widths
            leftRedZone.style.width = `${redZoneSize}%`;
            greenZone.style.width = `${this.difficulty.greenZoneSize}%`;
            rightRedZone.style.width = `${redZoneSize}%`;
            
            // Position yellow line INSIDE the green zone (matching scoring logic)
            const yellowRelativePosition = (this.difficulty.yellowPosition / 100) * this.difficulty.greenZoneSize;
            const yellowAbsolutePosition = redZoneSize + yellowRelativePosition;
            yellowLine.style.left = `${yellowAbsolutePosition}%`;
            
            console.log(`🎨 Visual Zones Updated: LeftRed=${redZoneSize.toFixed(1)}%, Green=${this.difficulty.greenZoneSize.toFixed(1)}%, RightRed=${redZoneSize.toFixed(1)}%, Yellow=${this.difficulty.yellowPosition.toFixed(1)}%`);
        }
    }

    start() {
        this.reset();
        this.enableQTE();
        this.isActive = true;
        this.container.classList.add('active');
        
        // Apply current difficulty settings
        this.updateVisualZones();
        
        // Start marker animation
        this.animateMarker();
        
        // COMPLETELY REWRITTEN TIMEOUT SYSTEM - BULLETPROOF!
        console.log(`🚀 QTE TIMER STARTED: 3 second countdown begins NOW`);
        
        // Use setTimeout instead of requestAnimationFrame for reliability
        this.qteTimeout = setTimeout(() => {
            console.log(`⏰ TIMEOUT HIT! hasBeenTapped=${this.hasBeenTapped}, isActive=${this.isActive}`);
            
            if (!this.hasBeenTapped && this.isActive) {
                console.log(`💥 FORCING TIMEOUT COMPLETION - PANCAKE WILL BURN!`);
                this.complete(0, 'Too slow!');
            }
        }, 3000);
        
        // Visual timer animation (separate from timeout logic)
        const startTime = Date.now();
        const duration = 3000;
        
        const updateVisualTimer = () => {
            if (!this.isActive) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.qteTimerFill.style.transform = `scaleX(${1 - progress})`;
            
            if (progress < 1) {
                this.timerFrame = requestAnimationFrame(updateVisualTimer);
            }
        };
        
        this.timerFrame = requestAnimationFrame(updateVisualTimer);
    }

    animateMarker() {
        // Use transform for better performance
        const qteBarWidth = this.container.querySelector('.qte-bar').offsetWidth;
        const markerWidth = this.marker.offsetWidth;
        
        const animate = (currentTime) => {
            if (!this.isActive) return;
            
            // Calculate delta time for consistent animation speed
            if (this.lastFrameTime === 0) {
                this.lastFrameTime = currentTime;
            }
            const deltaTime = currentTime - this.lastFrameTime;
            
            // Throttle updates to 30fps for better performance
            if (deltaTime < 33) { // ~30fps
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }
            
            this.lastFrameTime = currentTime;
            
            // Update marker position with frame-rate independent movement
            const speedMultiplier = deltaTime / 33.33; // Normalize to 30fps
            this.markerPosition += this.markerSpeed * this.markerDirection * speedMultiplier;
            
            // Bounce off edges
            if (this.markerPosition >= 96 || this.markerPosition <= 0) {
                this.markerDirection *= -1;
                // Clamp position to prevent going out of bounds
                this.markerPosition = Math.max(0, Math.min(96, this.markerPosition));
            }
            
            // Update marker position and color together
            this.updateMarkerPosition();
            this.updateMarkerColor();
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.lastFrameTime = 0;
        this.animationFrame = requestAnimationFrame(animate);
    }

    handleTap() {
        if (!this.isActive || this.hasBeenTapped) return;
        
        this.hasBeenTapped = true;
        const score = this.calculateScore();
        const message = this.getScoreMessage(score);
        
        this.complete(score, message);
    }

    calculateScore() {
        const position = this.markerPosition;
        
        // Get the actual positions from the DOM elements for perfect accuracy
        const qteBar = this.container.querySelector('.qte-bar');
        const yellowLine = this.container.querySelector('.yellow-line');
        const greenZone = this.container.querySelector('.green-zone');
        
        if (!qteBar || !yellowLine || !greenZone) {
            console.error('QTE elements not found!');
            return 0;
        }
        
        // Get actual pixel positions
        const qteBarRect = qteBar.getBoundingClientRect();
        const yellowLineRect = yellowLine.getBoundingClientRect();
        const greenZoneRect = greenZone.getBoundingClientRect();
        
        // Calculate percentages based on actual DOM positions
        const greenStartPercent = ((greenZoneRect.left - qteBarRect.left) / qteBarRect.width) * 100;
        const greenEndPercent = ((greenZoneRect.right - qteBarRect.left) / qteBarRect.width) * 100;
        
        // Yellow line center position
        const yellowCenterPercent = ((yellowLineRect.left + yellowLineRect.width / 2 - qteBarRect.left) / qteBarRect.width) * 100;
        
        // Perfect zone is EXACTLY the yellow line width (10px) - NO TOLERANCE!
        const yellowLineWidthPercent = (yellowLineRect.width / qteBarRect.width) * 100;
        const perfectStartPercent = yellowCenterPercent - yellowLineWidthPercent / 2;
        const perfectEndPercent = yellowCenterPercent + yellowLineWidthPercent / 2;
        
        // Determine score
        let score;
        let zone;
        
        if (position >= perfectStartPercent && position <= perfectEndPercent) {
            score = 10;
            zone = 'PERFECT!';
        } else if (position >= greenStartPercent && position <= greenEndPercent) {
            score = 7;
            zone = 'GOOD';
        } else {
            score = 0;
            zone = 'MISS';
        }
        
        console.log(`🎯 PRECISE SCORING:`);
        console.log(`   Marker Position: ${position.toFixed(2)}%`);
        console.log(`   Yellow Line: ${perfectStartPercent.toFixed(2)}% - ${perfectEndPercent.toFixed(2)}% (width: ${yellowLineWidthPercent.toFixed(2)}%)`);
        console.log(`   Result: ${zone} = ${score} points`);
        
        if (score === 10) {
            console.log(`   ✨ PERFECT HIT! Marker is EXACTLY on the yellow line!`);
        }
        
        return score;
    }

    getScoreMessage(score) {
        switch(score) {
            case 10: return "Perfect!";
            case 7: return "Good!";
            case 0: return "Missed!";
            default: return "Too slow!";
        }
    }

    complete(score, message) {
        this.isActive = false;
        
        // Clear ALL timers and animations
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.timerFrame) {
            cancelAnimationFrame(this.timerFrame);
            this.timerFrame = null;
        }
        
        if (this.qteTimeout) {
            clearTimeout(this.qteTimeout);
            this.qteTimeout = null;
        }
        
        // Flash the result
        this.flashResult(score);
        
        // Only show fail animation for missed/red zone hits
        // Sparkle effects are handled by GameManager now
        if (score === 0 || score < 0) {
            this.showFailAnimation();
        }
        
        // Hide QTE after a short delay
        setTimeout(() => {
            this.disableQTE();
            this.container.classList.remove('active');
            if (this.onComplete) {
                this.onComplete(score, message);
            }
        }, 500);
    }

    updateMarkerPosition() {
        const qteBar = this.container.querySelector('.qte-bar');
        const markerWidth = this.marker.offsetWidth;
        const qteBarWidth = qteBar ? qteBar.offsetWidth : 400;
        
        const translateX = (this.markerPosition / 100) * (qteBarWidth - markerWidth);
        this.marker.style.transform = `translateX(${translateX}px)`;
    }

    updateMarkerColor() {
        const position = this.markerPosition;
        
        // Get the actual positions from the DOM elements (same as calculateScore)
        const qteBar = this.container.querySelector('.qte-bar');
        const yellowLine = this.container.querySelector('.yellow-line');
        const greenZone = this.container.querySelector('.green-zone');
        
        if (!qteBar || !yellowLine || !greenZone) return;
        
        // Get actual pixel positions
        const qteBarRect = qteBar.getBoundingClientRect();
        const yellowLineRect = yellowLine.getBoundingClientRect();
        const greenZoneRect = greenZone.getBoundingClientRect();
        
        // Calculate percentages based on actual DOM positions
        const greenStartPercent = ((greenZoneRect.left - qteBarRect.left) / qteBarRect.width) * 100;
        const greenEndPercent = ((greenZoneRect.right - qteBarRect.left) / qteBarRect.width) * 100;
        
        // Yellow line center position
        const yellowCenterPercent = ((yellowLineRect.left + yellowLineRect.width / 2 - qteBarRect.left) / qteBarRect.width) * 100;
        
        // Perfect zone EXACTLY matches yellow line - NO TOLERANCE!
        const yellowLineWidthPercent = (yellowLineRect.width / qteBarRect.width) * 100;
        const perfectStartPercent = yellowCenterPercent - yellowLineWidthPercent / 2;
        const perfectEndPercent = yellowCenterPercent + yellowLineWidthPercent / 2;
        
        // Update marker color based on position
        if (position >= perfectStartPercent && position <= perfectEndPercent) {
            // PERFECT ZONE - Bright blue like the yellow line
            this.marker.style.background = '#4DA8E5';
            this.marker.style.boxShadow = '0 0 20px #4DA8E5, 0 0 40px #4DA8E5';
            this.marker.style.width = '6px'; // Slightly wider when in perfect zone
        } else if (position >= greenStartPercent && position <= greenEndPercent) {
            // GOOD ZONE - Light blue
            this.marker.style.background = '#7BB8D4';
            this.marker.style.boxShadow = '0 0 10px #7BB8D4';
            this.marker.style.width = '4px';
        } else {
            // MISS ZONE - Purple
            this.marker.style.background = 'var(--pastel-purple)';
            this.marker.style.boxShadow = '0 0 8px var(--pastel-purple)';
            this.marker.style.width = '4px';
        }
    }

    flashResult(score) {
        let color;
        if (score === 10) color = '#FFD700'; // Gold
        else if (score > 5) color = '#00D4FF'; // Blue
        else if (score > 0) color = '#B026FF'; // Purple
        else color = '#FF0099'; // Pink for miss
        
        this.marker.style.boxShadow = `0 0 30px ${color}`;
        this.marker.style.background = color;
    }



    showFailAnimation() {
        // Find the pancake element to add fail effects around it
        const pancakeElement = document.getElementById('game-pancake');
        if (!pancakeElement) return;

        // Get pancake position
        const pancakeRect = pancakeElement.getBoundingClientRect();
        const gameContainer = document.getElementById('game-container');
        const containerRect = gameContainer.getBoundingClientRect();

        // Create fail effect container
        const failContainer = document.createElement('div');
        failContainer.style.cssText = `
            position: absolute;
            left: ${pancakeRect.left - containerRect.left + pancakeRect.width / 2}px;
            top: ${pancakeRect.top - containerRect.top + pancakeRect.height / 2}px;
            width: 0;
            height: 0;
            pointer-events: none;
            z-index: 1000;
        `;

        // Create smoke/steam effects
        for (let i = 0; i < 8; i++) {
            const smoke = document.createElement('div');
            const angle = (i * 45) * (Math.PI / 180); // 45 degrees apart
            const distance = 30 + Math.random() * 30; // Random distance
            const size = 8 + Math.random() * 12; // Random size

            smoke.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(100, 100, 100, 0.8), rgba(60, 60, 60, 0.4));
                border-radius: 50%;
                animation: failSmoke 1.2s ease-out forwards;
                transform: translate(-50%, -50%);
                opacity: 0.8;
            `;

            // Set the smoke's final position
            smoke.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
            smoke.style.setProperty('--end-y', `${Math.sin(angle) * distance - 20}px`); // Drift upward

            failContainer.appendChild(smoke);
        }

        // Create "X" mark for miss
        const xMark = document.createElement('div');
        xMark.style.cssText = `
            position: absolute;
            width: 40px;
            height: 40px;
            transform: translate(-50%, -50%);
            animation: failX 0.8s ease-out forwards;
            opacity: 0;
        `;
        xMark.innerHTML = `
            <div style="
                position: absolute;
                width: 100%;
                height: 4px;
                background: #FF4444;
                top: 50%;
                left: 0;
                transform: translateY(-50%) rotate(45deg);
                box-shadow: 0 0 8px #FF4444;
            "></div>
            <div style="
                position: absolute;
                width: 100%;
                height: 4px;
                background: #FF4444;
                top: 50%;
                left: 0;
                transform: translateY(-50%) rotate(-45deg);
                box-shadow: 0 0 8px #FF4444;
            "></div>
        `;

        failContainer.appendChild(xMark);

        // Add screen shake effect
        gameContainer.classList.add('screen-shake');

        gameContainer.appendChild(failContainer);

        // Remove effects after animation
        setTimeout(() => {
            failContainer.remove();
            gameContainer.classList.remove('screen-shake');
        }, 1200);
    }

    reset() {
        this.markerPosition = 0;
        this.markerDirection = 1;
        this.hasBeenTapped = false;
        this.lastFrameTime = 0;
        this.marker.style.transform = 'translateX(0)';
        this.marker.style.background = 'var(--pastel-purple)';
        this.marker.style.boxShadow = '0 0 10px var(--pastel-purple)';
        this.qteTimerFill.style.transform = 'scaleX(1)';
        
        // Stop ALL running animations and timers
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.timerFrame) {
            cancelAnimationFrame(this.timerFrame);
            this.timerFrame = null;
        }
        if (this.qteTimeout) {
            clearTimeout(this.qteTimeout);
            this.qteTimeout = null;
        }
        if (this.qteTimer) {
            this.qteTimer.stop();
            this.qteTimer = null;
        }
    }

    enableQTE() {
        // Enable QTE components
        this.tapButton.disabled = false;
        this.tapButton.style.opacity = '1';
        this.tapButton.style.pointerEvents = 'auto';
        this.container.style.opacity = '1';
        this.container.style.pointerEvents = 'auto';
    }

    disableQTE() {
        // Disable QTE components
        this.tapButton.disabled = true;
        this.tapButton.style.opacity = '0.4';
        this.tapButton.style.pointerEvents = 'none';
        this.container.style.opacity = '0.4';
        this.container.style.pointerEvents = 'none';
        
        // Reset visual state
        this.reset();
        this.isActive = false;
        this.container.classList.remove('active');
    }

    destroy() {
        this.disableQTE();
        this.isActive = false;
        
        // Remove keyboard event listener
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        
        // Clear ALL timers and animations
        if (this.qteTimer) {
            this.qteTimer.stop();
            this.qteTimer = null;
        }
        if (this.qteTimeout) {
            clearTimeout(this.qteTimeout);
            this.qteTimeout = null;
        }
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.timerFrame) {
            cancelAnimationFrame(this.timerFrame);
            this.timerFrame = null;
        }
    }
} 