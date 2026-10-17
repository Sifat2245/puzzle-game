const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { PeerServer } = require('peer');
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

async function setup() {
  const frontend = spawn(
    process.execPath,
    [
      path.join(__dirname, '../../node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '5185',
      '--strictPort',
    ],
    { cwd: path.join(__dirname, '../..'), stdio: ['ignore', 'pipe', 'pipe'] },
  );
  process.once('exit', () => frontend.kill());
  let serverOutput = '';
  frontend.stdout.on('data', (chunk) => {
    serverOutput += chunk;
  });
  frontend.stderr.on('data', (chunk) => {
    serverOutput += chunk;
  });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (frontend.exitCode !== null) throw new Error(serverOutput);
    try {
      if ((await fetch('http://127.0.0.1:5185/')).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Test dev server did not start: ' + serverOutput);
  let signaling;
  await new Promise((resolve) =>
    PeerServer({ port: 9002, host: '127.0.0.1', path: '/gameplay' }, (server) => {
      signaling = server;
      resolve();
    }),
  );
  const executablePath =
    process.env.CHROME_BIN ||
    ['/opt/google/chrome/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(
      existsSync,
    );
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const errors = [];
  async function context(options = {}) {
    const result = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      ...options,
    });
    await result.route('**/src/hooks/usePeerRoom.js*', async (route) => {
      const response = await route.fetch();
      const options =
        '{host:"127.0.0.1",port:9002,path:"/gameplay",secure:false,config:{iceServers:[]}}';
      let body = await response.text();
      body = body
        .replace('new Peer(roomPeerId(roomCode))', `new Peer(roomPeerId(roomCode), ${options})`)
        .replace('new Peer()', `new Peer(${options})`);
      await route.fulfill({ response, body });
    });
    await result.route('**/src/context/GameContext.jsx*', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        'const game = usePuzzleGame();',
        'const game = usePuzzleGame(); window.__puzzleGame = game;',
      );
      await route.fulfill({ response, body });
    });
    await result.addInitScript(() => {
      window.__drawCount = 0;
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        window.__drawCount++;
        return draw.apply(this, args);
      };
    });
    result.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
    return result;
  }
  return {
    browser,
    context,
    errors,
    close: async () => {
      await browser.close();
      signaling.close();
      frontend.kill();
    },
  };
}

async function state(page) {
  return page.evaluate(() => {
    const ui = window.__puzzleGame;
    const g = ui.gameRef.current;
    const rect = ui.canvasRef.current?.getBoundingClientRect();
    return {
      pieces: g.pieces.map((p) => ({
        id: p.id,
        r: p.r,
        c: p.c,
        x: p.x,
        y: p.y,
        inPlace: p.inPlace,
        groupId: p.groupId,
        lockedBy: p.lockedBy,
        padX: p.padX,
        padY: p.padY,
      })),
      camX: g.camX,
      drawOrder: [...g.drawOrder],
      groupSizes: Array.from(g.groups.values(), (group) => group.size),
      camY: g.camY,
      camZoom: g.camZoom,
      pieceW: g.pieceW,
      pieceH: g.pieceH,
      boardW: g.boardW,
      boardH: g.boardH,
      imageSrc: g.imageSrc,
      bots: g.bots.map((b) => ({ id: b.id, score: b.score, carrying: b.carryingPieceId })),
      progress: ui.progressStats,
      rect: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      active: g.activeDragPiece?.id,
      completed: g.isCompleted,
      draws: window.__drawCount,
      playerId: ui.myPlayerId,
    };
  });
}

function point(s, piece, solved = false) {
  return {
    x: s.rect.x + s.camX + ((solved ? piece.c * s.pieceW : piece.x) + s.pieceW / 2) * s.camZoom,
    y: s.rect.y + s.camY + ((solved ? piece.r * s.pieceH : piece.y) + s.pieceH / 2) * s.camZoom,
  };
}

async function launch(page, { bots = 0, pieces = 24, path = '/' } = {}) {
  await page.goto(`http://127.0.0.1:5185${path}`);
  await page.getByText(/^রুম .* তৈরি$/).waitFor();
  await page.locator('#bot-count').focus();
  await page.locator('#bot-count').press('Home');
  for (let i = 0; i < bots; i++) await page.locator('#bot-count').press('ArrowRight');
  assert.equal(await page.locator('#bot-count').inputValue(), String(bots));
  const count = String(pieces).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
  await page.getByRole('button', { name: new RegExp(`প্রায় ${count} টুকরো`) }).click();
  await page.getByRole('button', { name: 'চলুন, মেলানো যাক!' }).click();
  await page.waitForFunction(() => window.__puzzleGame?.gameRef.current.pieces.length > 0);
  assert.equal((await state(page)).bots.length, bots);
}

async function mouseDrag(page, id, target) {
  const before = await state(page),
    piece = before.pieces.find((p) => p.id === id),
    from = point(before, piece);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 15 });
  await page.mouse.up();
}

function loosePiece(state) {
  return [...state.drawOrder]
    .reverse()
    .map((id) => state.pieces[id])
    .find((piece) => !piece.inPlace && !piece.lockedBy);
}

module.exports = { setup, state, point, launch, mouseDrag, loosePiece, assert };
