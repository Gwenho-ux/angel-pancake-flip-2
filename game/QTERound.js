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
        this.markerSpeed = 2; // Percentage per frame
        this.animationFrame = null;
        this.qteTimer = null;
        this.hasBeenTapped = false;
        this.isActive = false;
        
        this.init();
    }

    init() {
        this.tapButton.addEventListener('click', () => this.handleTap());
    }

    start() {
        this.reset();
        this.isActive = true;
        this.container.classList.add('active');
        
        // Start marker animation
        this.animateMarker();
        
        // Start QTE timer (5 seconds)
        this.qteTimer = new Timer(5, 
            (remaining) => {
                const progress = (5 - remaining) / 5;
                this.qteTimerFill.style.width = `${(1 - progress) * 100}%`;
            },
            () => {
                if (!this.hasBeenTapped) {
                    this.complete(-3, 'Too slow!'); // No tap penalty
                }
            }
        );
        this.qteTimer.start();
    }

    animateMarker() {
        const animate = () => {
            if (!this.isActive) return;
            
            // Update marker position
            this.markerPosition += this.markerSpeed * this.markerDirection;
            
            // Bounce off edges
            if (this.markerPosition >= 96 || this.markerPosition <= 0) {
                this.markerDirection *= -1;
            }
            
            // Apply position
            this.marker.style.left = `${this.markerPosition}%`;
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
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
        
        // Perfect hit on yellow line (49-51%)
        if (position >= 49 && position <= 51) {
            return 10;
        }
        // Close inside green (40-49% or 51-60%)
        else if ((position >= 40 && position < 49) || (position > 51 && position <= 60)) {
            return 7;
        }
        // Near edge of green (25-40% or 60-75%)
        else if ((position >= 25 && position < 40) || (position > 60 && position <= 75)) {
            return 5;
        }
        // Red zone
        else {
            return 0;
        }
    }

    getScoreMessage(score) {
        switch(score) {
            case 10: return "Perfect flip!";
            case 7: return "Nice flip!";
            case 5: return "Decent flip.";
            case 0: return "You missed! The pancake is burning!";
            default: return "Too slow! It's getting crispy!";
        }
    }

    complete(score, message) {
        this.isActive = false;
        this.qteTimer.stop();
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Flash the result
        this.flashResult(score);
        
        // Hide QTE after a short delay
        setTimeout(() => {
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

    reset() {
        this.markerPosition = 0;
        this.markerDirection = 1;
        this.hasBeenTapped = false;
        this.marker.style.left = '0%';
        this.marker.style.background = '#ffffff';
        this.marker.style.boxShadow = '0 0 10px #ffffff';
        this.qteTimerFill.style.width = '100%';
    }

    destroy() {
        this.isActive = false;
        if (this.qteTimer) {
            this.qteTimer.stop();
        }
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
} 