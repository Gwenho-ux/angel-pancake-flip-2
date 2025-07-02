// Leaderboard - Manages leaderboard data and display
class Leaderboard {
    constructor() {
        this.screen = document.getElementById('leaderboard-screen');
        this.listContainer = document.getElementById('leaderboard-list');
        this.backButton = new Button(document.getElementById('back-from-leaderboard-btn'), () => this.hide());
        
        this.scores = this.loadScores();
    }

    loadScores() {
        // Load from localStorage or return default scores
        const saved = localStorage.getItem('angelsPancakeFlipScores');
        if (saved) {
            const scores = JSON.parse(saved);
            // Migrate old scores without pancake count
            return scores.map(entry => ({
                name: entry.name,
                score: entry.score,
                totalPancakes: entry.totalPancakes || 0,
                timestamp: entry.timestamp || new Date().toISOString()
            }));
        }
        
        // Default demo scores
        return [
            { name: 'Angel', score: 60, totalPancakes: 3, timestamp: new Date().toISOString() },
            { name: 'Demo Player', score: 45, totalPancakes: 2, timestamp: new Date().toISOString() },
            { name: 'Pancake Pro', score: 38, totalPancakes: 2, timestamp: new Date().toISOString() },
            { name: 'Newbie', score: 15, totalPancakes: 1, timestamp: new Date().toISOString() }
        ];
    }

    saveScores() {
        localStorage.setItem('angelsPancakeFlipScores', JSON.stringify(this.scores));
    }

    addScore(name, score, totalPancakes = 0) {
        this.scores.push({ 
            name, 
            score, 
            totalPancakes,
            timestamp: new Date().toISOString()
        });
        
        // Sort by score first, then by pancakes as tiebreaker
        this.scores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // If scores are equal, sort by pancakes
            return b.totalPancakes - a.totalPancakes;
        });
        
        // Keep only top 10 scores
        this.scores = this.scores.slice(0, 10);
        
        this.saveScores();
        this.render();
    }

    show() {
        this.hideAllScreens();
        this.screen.classList.add('active');
        this.render();
    }

    hide() {
        this.screen.classList.remove('active');
        // Return to start screen
        window.startScreen.show();
    }

    render() {
        this.listContainer.innerHTML = '';
        
        if (this.scores.length === 0) {
            this.listContainer.innerHTML = '<p style="text-align: center; opacity: 0.6;">No scores yet!</p>';
            return;
        }
        
        this.scores.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            
            // Add special styling for top 3
            if (index === 0) entryElement.style.borderColor = '#FFD700';
            else if (index === 1) entryElement.style.borderColor = '#C0C0C0';
            else if (index === 2) entryElement.style.borderColor = '#CD7F32';
            
            entryElement.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${this.escapeHtml(entry.name)}</div>
                <div class="leaderboard-pancakes">🥞 ${entry.totalPancakes || 0}</div>
                <div class="leaderboard-score">🏆 ${entry.score}</div>
            `;
            
            // Add entrance animation
            entryElement.style.animation = `slideIn 0.3s ease-out ${index * 0.1}s both`;
            
            this.listContainer.appendChild(entryElement);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    reset() {
        this.scores = [];
        this.saveScores();
        this.render();
    }

    getHighScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }

    isHighScore(score) {
        return score > this.getHighScore();
    }

    getTopScores(count = 10) {
        return this.scores.slice(0, count).map(entry => ({
            name: entry.name,
            totalScore: entry.score,
            totalPancakes: entry.totalPancakes || 0,
            timestamp: entry.timestamp
        }));
    }
} 