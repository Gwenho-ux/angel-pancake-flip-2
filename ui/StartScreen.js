// StartScreen - Manages the start screen UI
class StartScreen {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.screen = document.getElementById('start-screen');
        this.playerNameInput = document.getElementById('player-name');
        this.startButton = new Button(document.getElementById('start-btn'), () => this.handleStart());
        this.startLeaderboardList = document.getElementById('start-leaderboard-list');
        
        this.init();
    }

    init() {
        // Enable start button only when name is entered
        this.playerNameInput.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                this.startButton.enable();
            } else {
                this.startButton.disable();
            }
        });

        // Allow Enter key to start game
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.handleStart();
            }
        });

        // Initially disable start button
        this.startButton.disable();
    }

    show() {
        this.hideAllScreens();
        this.screen.classList.add('active');
        // Make container shorter for start screen
        document.getElementById('game-container').classList.add('start-screen-active');
        this.playerNameInput.focus();
        
        // Update leaderboard on start screen
        this.updateStartLeaderboard();
    }

    hide() {
        this.screen.classList.remove('active');
        // Remove shorter container class when leaving start screen
        document.getElementById('game-container').classList.remove('start-screen-active');
    }

    handleStart() {
        const playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            this.shakeInput();
            return;
        }

        // Transition to game screen
        this.hide();
        document.getElementById('game-screen').classList.add('active');
        
        // Start the game
        this.gameManager.startGame(playerName);
    }

    updateStartLeaderboard() {
        if (!window.leaderboard) return;
        
        const scores = window.leaderboard.getTopScores(5); // Get top 5 scores
        
        if (scores.length === 0) {
            this.startLeaderboardList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No scores yet - be the first!</p>';
            return;
        }
        
        this.startLeaderboardList.innerHTML = scores.map((entry, index) => `
            <div class="leaderboard-entry">
                <span class="leaderboard-rank">${index + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <div class="leaderboard-info">
                    <span class="leaderboard-score">🏆 ${entry.totalScore}</span>
                    <span class="leaderboard-pancakes">🥞 ${entry.totalPancakes}</span>
                </div>
            </div>
        `).join('');
    }

    shakeInput() {
        this.playerNameInput.classList.add('shake');
        setTimeout(() => {
            this.playerNameInput.classList.remove('shake');
        }, 500);

        // Add shake animation if not present
        if (!document.querySelector('#shake-animation')) {
            const style = document.createElement('style');
            style.id = 'shake-animation';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .shake {
                    animation: shake 0.5s ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    reset() {
        this.playerNameInput.value = '';
        this.startButton.disable();
    }
} 