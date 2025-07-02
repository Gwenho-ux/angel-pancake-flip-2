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
        this.markerSpeed = 2.8; // Increased speed - faster movement makes timing harder
        this.animationFrame = null;
        this.timerFrame = null;
        this.qteTimer = null;
        this.hasBeenTapped = false;
        this.isActive = false;
        this.lastFrameTime = 0;
        
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

    start() {
        this.reset();
        this.enableQTE();
        this.isActive = true;
        this.container.classList.add('active');
        
        // Start marker animation
        this.animateMarker();
        
        // Start QTE timer (3 seconds) - optimized for performance
        const startTime = Date.now();
        const duration = 3000; // 3 seconds in ms
        
        const updateTimer = () => {
            if (!this.isActive) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use transform for better performance
            this.qteTimerFill.style.transform = `scaleX(${1 - progress})`;
            
            if (progress < 1) {
                this.timerFrame = requestAnimationFrame(updateTimer);
            } else {
                if (!this.hasBeenTapped) {
                    this.complete(-3, 'Too slow!'); // No tap penalty
                }
            }
        };
        
        this.timerFrame = requestAnimationFrame(updateTimer);
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
            
            // Use transform instead of left for better performance
            const translateX = (this.markerPosition / 100) * (qteBarWidth - markerWidth);
            this.marker.style.transform = `translateX(${translateX}px)`;
            
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
        // Bar zones: 0-25% red, 25-75% green (with 50% being yellow line), 75-100% red
        const position = this.markerPosition;
        let score;
        let zone;
        
        // Perfect hit on yellow area (48-52%) - made smaller and more precise
        if (position >= 48 && position <= 52) {
            score = 10;
            zone = 'Yellow (Perfect)';
        }
        // Close inside green (40-48% or 52-60%) - reduced range
        else if ((position >= 40 && position < 48) || (position > 52 && position <= 60)) {
            score = 7;
            zone = 'Green (Good)';
        }
        // Near edge of green (30-40% or 60-70%) - reduced range
        else if ((position >= 30 && position < 40) || (position > 60 && position <= 70)) {
            score = 5;
            zone = 'Green (Decent)';
        }
        // Red zone - expanded
        else {
            score = 0;
            zone = 'Red (Miss)';
        }
        
        console.log(`QTE Result: Position ${position.toFixed(1)}% -> ${zone} -> Score ${score}`);
        return score;
    }

    getScoreMessage(score) {
        switch(score) {
            case 10: return "Perfect!";
            case 7: return "Nice!";
            case 5: return "Good!";
            case 0: return "Missed!";
            default: return "Too slow!";
        }
    }

    complete(score, message) {
        this.isActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.timerFrame) {
            cancelAnimationFrame(this.timerFrame);
            this.timerFrame = null;
        }
        
        // Flash the result
        this.flashResult(score);
        
        // Add sparkle animation for perfect hits
        if (score === 10) {
            this.showSparkleAnimation();
        }
        // Add fail animation for missed/red zone hits
        else if (score === 0 || score < 0) {
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

    flashResult(score) {
        let color;
        if (score === 10) color = '#FFD700'; // Gold
        else if (score > 5) color = '#00D4FF'; // Blue
        else if (score > 0) color = '#B026FF'; // Purple
        else color = '#FF0099'; // Pink for miss
        
        this.marker.style.boxShadow = `0 0 30px ${color}`;
        this.marker.style.background = color;
    }

    showSparkleAnimation() {
        // Find the pancake element to add sparkles above it
        const pancakeElement = document.getElementById('game-pancake');
        if (!pancakeElement) return;

        // Get pancake position
        const pancakeRect = pancakeElement.getBoundingClientRect();
        const gameContainer = document.getElementById('game-container');
        const containerRect = gameContainer.getBoundingClientRect();

        // Create sparkle container
        const sparkleContainer = document.createElement('div');
        sparkleContainer.style.cssText = `
            position: absolute;
            left: ${pancakeRect.left - containerRect.left + pancakeRect.width / 2}px;
            top: ${pancakeRect.top - containerRect.top + pancakeRect.height / 2}px;
            width: 0;
            height: 0;
            pointer-events: none;
            z-index: 1000;
        `;

        // Create multiple sparkles
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            const angle = (i * 30) * (Math.PI / 180); // 30 degrees apart
            const distance = 60 + Math.random() * 40; // Random distance
            const size = 4 + Math.random() * 8; // Random size

            sparkle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(45deg, #FFD700, #FFF, #FFD700);
                border-radius: 50%;
                animation: sparkle 1s ease-out forwards;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px #FFD700;
            `;

            // Set the sparkle's final position
            sparkle.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
            sparkle.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);

            sparkleContainer.appendChild(sparkle);
        }

        gameContainer.appendChild(sparkleContainer);

        // Remove sparkles after animation
        setTimeout(() => {
            sparkleContainer.remove();
        }, 1000);
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
        
        // Stop any running animations or timers
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.timerFrame) {
            cancelAnimationFrame(this.timerFrame);
            this.timerFrame = null;
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
        
        if (this.qteTimer) {
            this.qteTimer.stop();
            this.qteTimer = null;
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