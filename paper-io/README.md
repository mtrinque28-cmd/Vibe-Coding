# Paper.io (Browser Clone)

A browser-based Paper.io–style territory game with AI opponents and a live leaderboard.

## How to play

1. Open the game via a local server (required for ES modules):

   ```bash
   cd paper-io
   python3 -m http.server 8765
   ```

2. Visit [http://localhost:8765](http://localhost:8765)

3. Enter your name and click **Play**

### Controls

- **Mouse** — steer toward the cursor (you always move forward)
- **A / D** or **← / →** — turn left / right

### Rules

- Leave your colored zone to draw a **trail**
- Return to your zone to **close the loop** and claim enclosed land
- Cross an enemy’s trail to **eliminate** them
- Don’t cross your own trail or hit the **map border**

## Features

- 11 AI bots with distinct names and colors
- Real-time **leaderboard** (territory %)
- Territory capture, trail collisions, respawning bots
- Camera follows your player
