# মাল্টিপ্লেয়ার পাজল গেম

জীবনের পাজল না মিললেও গেমের পাজল মিলবে।

সম্পূর্ণ বাংলা লেখা, বাংলা সংখ্যা ও স্থানীয়ভাবে থাকা বাংলা ফন্টের সঙ্গে স্পাইডার-ম্যান, ডোরেমন, শিনচ্যান ও পিকাচুর পাজল। খেলা শেষে মজার বাংলা ফলাফল কার্ড ছবি হিসেবে নামিয়ে বা শেয়ার করে বন্ধুদের চ্যালেঞ্জ জানানো যায়। ছবির উৎস ও তৈরি করার প্রম্পট আছে [docs/puzzle-images.md](docs/puzzle-images.md)-এ।

A React canvas puzzle game with multiplayer rooms, bot helpers, custom photo puzzles, and shareable completion cards. The app runs entirely in the frontend. PeerJS uses its default signaling service to establish WebRTC connections; game data travels between browsers. No Python service or database is required.

```sh
npm install
npm run dev
```

For a phone on the same Wi-Fi, run `npm run dev -- --host` and open the printed Network URL on the phone.

Fresh visits generate a random room code. Copy the invite link or enter a friend’s code and click **Join**. Invite links and refreshes keep that room. **New room** generates another code; **Play again** keeps the current team and resets the puzzle, scores, and timer. The host’s browser keeps the room running.

Completed games show a result card with the puzzle, finish time, team, and scores. Download the portrait PNG, copy the result caption, or use the device’s share menu when available.

Drag pieces to match their neighbors or place them in the frame. Connected pieces move together. Drag empty space to pan, use the mouse wheel or two fingers to zoom, and click the zoom percentage to fit all pieces on screen. Bot helpers play alongside you and can move assembled groups.

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

Run the browser gameplay regression checks with `npm run test:browser`. They start a temporary Vite server and a local PeerJS signaling server, then exercise real mouse dragging, touch gestures, multiplayer moves, full puzzle completion, and bot play. Chrome/Chromium is required; set `CHROME_BIN` to its executable or run `npx playwright install chromium` to install Playwright’s browser.
