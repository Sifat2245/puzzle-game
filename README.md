# Multiplayer Puzzle Game

A React canvas puzzle game with multiplayer rooms, bot helpers, custom photo puzzles, and shareable completion cards. The app runs entirely in the frontend. PeerJS uses its default signaling service to establish WebRTC connections; game data travels between browsers. No Python service or database is required.

```sh
npm install
npm run dev
```

Fresh visits generate a random room code. Copy the invite link or enter a friend’s code and click **Join**. Invite links and refreshes keep that room. **New room** generates another code; **Play again** keeps the current team and resets the puzzle, scores, and timer. The host’s browser keeps the room running.

Completed games show a result card with the puzzle, finish time, team, and scores. Download the portrait PNG, copy the result caption, or use the device’s share menu when available.

## Code organization

- `src/App.jsx` composes the screens and modals.
- `src/components/` contains the lobby, room controls, board UI, chat, and result modal.
- `src/context/GameContext.jsx` makes game state and actions available to the UI.
- `src/hooks/usePuzzleGame.js` coordinates game state and room events.
- The other hooks handle WebRTC connections, puzzle assembly, canvas rendering, input, and sound.
- `src/utils/` contains room identifiers, canvas helpers, clipboard utilities, and PNG generation.
- `src/data/puzzles.js` contains the puzzle catalog, table themes, and bot profiles.

```sh
npm test
npm run build
```
