// ScoreDisplay Component - Manages score display and animations
class ScoreDisplay {
    constructor(element) {
        this.element = element;
        this.currentScore = 0;
        this.targetScore = 0;
        this.animationFrame = null;
    }

    setScore(score, animate = true) {
        this.targetScore = score;
        
        if (!animate) {
            this.currentScore = score;
            this.element.textContent = score;
            return;
        }

        this.animateScore();
    }

    animateScore() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const animate = () => {
            const diff = this.targetScore - this.currentScore;
            
            if (Math.abs(diff) < 1) {
                this.currentScore = this.targetScore;
                this.element.textContent = Math.round(this.currentScore);
                return;
            }

            this.currentScore += diff * 0.1; // Smooth animation
            this.element.textContent = Math.round(this.currentScore);
            
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    addScore(points) {
        this.setScore(this.targetScore + points);
        this.showFloatingScore(points);
    }

    showFloatingScore(points) {
        const floater = document.createElement('div');
        floater.className = 'floating-score';
        floater.textContent = points > 0 ? `+${points}` : points;
        floater.style.cssText = `
            position: absolute;
            font-size: 1.5em;
            font-weight: bold;
            animation: floatUp 1s ease-out forwards;
            pointer-events: none;
            color: ${points > 0 ? '#00D4FF' : '#FF0099'};
            text-shadow: 0 0 10px currentColor;
        `;

        // Position near the score display
        const rect = this.element.getBoundingClientRect();
        floater.style.left = `${rect.left + rect.width / 2}px`;
        floater.style.top = `${rect.top}px`;

        document.body.appendChild(floater);

        // Add animation keyframes if not already present
        if (!document.querySelector('#score-animations')) {
            const style = document.createElement('style');
            style.id = 'score-animations';
            style.textContent = `
                @keyframes floatUp {
                    0% {
                        opacity: 1;
                        transform: translateY(0) translateX(-50%);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-50px) translateX(-50%);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove after animation
        setTimeout(() => floater.remove(), 1000);
    }

    reset() {
        this.currentScore = 0;
        this.targetScore = 0;
        this.element.textContent = '0';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
} 