// Timer Component - Manages game timing
class Timer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.interval = null;
        this.startTime = null;
        this.pausedTime = 0;
    }

    start() {
        this.startTime = Date.now();
        this.interval = setInterval(() => {
            const elapsed = (Date.now() - this.startTime - this.pausedTime) / 1000;
            this.remaining = Math.max(0, this.duration - elapsed);
            
            if (this.onTick) {
                this.onTick(this.remaining);
            }
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        }, 100); // Update every 100ms for smooth countdown
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    pause() {
        if (this.interval) {
            this.pausedTime += Date.now() - this.startTime;
            this.stop();
        }
    }

    resume() {
        if (!this.interval && this.remaining > 0) {
            this.startTime = Date.now();
            this.start();
        }
    }

    reset(newDuration = null) {
        this.stop();
        this.duration = newDuration || this.duration;
        this.remaining = this.duration;
        this.pausedTime = 0;
    }

    getProgress() {
        return (this.duration - this.remaining) / this.duration;
    }
} 