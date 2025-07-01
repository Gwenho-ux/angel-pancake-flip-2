# Angel's Pancake Flip 🥞

A fun 60-second mini game featuring Quick Time Events (QTEs) designed for event visitors to play on-site.

## 🎮 Game Features

- **60-second gameplay** with 6 random Quick Time Events
- **Precision-based scoring system**:
  - Yellow line hit: +10 points
  - Close inside green: +7 points
  - Near edge of green: +5 points
  - Red zone: 0 points
  - No tap: -3 points
- **Sci-fi cartoon aesthetic** with neon purple, blue, and pink colors
- **Leaderboard system** to track high scores
- **Angel's roast comments** based on performance

## 🚀 How to Play

1. Enter your name
2. Click "START GAME"
3. Watch for QTE events
4. Tap the button when the marker is in the optimal zone
5. Try to get the highest score!

## 🛠️ Running Locally

### Option 1: Python HTTP Server
```bash
cd angels-pancake-flip
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

### Option 2: Node.js HTTP Server
```bash
cd angels-pancake-flip
npx http-server -p 8000
```

## 📁 Project Structure

```
/assets          - Game assets (images, sounds, backgrounds)
/components      - UI components (Timer, ScoreDisplay, Button)
/game           - Game logic (QTERound, GameManager)
/ui             - Screen managers (StartScreen, Leaderboard, ResultScreen)
index.html      - Main HTML file
style.css       - Game styling
main.js         - Entry point
```

## 🎨 Customization

You can add custom Angel character art, sounds, and backgrounds by placing them in the `/assets` folder.

## 📱 Features

- Responsive design for desktop and mobile
- Touch support for mobile devices
- Pause/resume when tab loses focus
- Persistent leaderboard using localStorage

## 🎯 Game Dimensions

- Desktop: 500px width × 750px height
- Mobile: Responsive scaling

---

Made with 💜 for event entertainment! 