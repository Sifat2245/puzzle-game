import test from 'node:test';
import assert from 'node:assert/strict';
import { fitPuzzleCamera, zoomCameraAt } from '../src/utils/camera.js';
import { advanceBots } from '../src/utils/bots.js';

test('the fitted camera includes every piece on phone and desktop screens', () => {
  const game = {
    boardW: 640,
    boardH: 420,
    pieceW: 80,
    pieceH: 70,
    pieces: [
      { x: -350, y: -160, padX: 30, padY: 27 },
      { x: 900, y: 490, padX: 30, padY: 27 },
    ],
  };
  for (const [width, height] of [
    [320, 568],
    [390, 740],
    [844, 300],
    [1440, 850],
  ]) {
    const camera = fitPuzzleCamera(game, width, height);
    for (const piece of game.pieces) {
      assert(camera.camX + (piece.x - piece.padX) * camera.camZoom >= 0);
      assert(camera.camX + (piece.x + game.pieceW + piece.padX) * camera.camZoom <= width);
      assert(camera.camY + (piece.y - piece.padY) * camera.camZoom >= 0);
      assert(camera.camY + (piece.y + game.pieceH + piece.padY) * camera.camZoom <= height - 50);
    }
  }
});

test('zooming preserves the point underneath the fingers', () => {
  const game = { camX: 24, camY: 50, camZoom: 0.3 };
  const point = { x: 150, y: 220 };
  const world = {
    x: (point.x - game.camX) / game.camZoom,
    y: (point.y - game.camY) / game.camZoom,
  };
  zoomCameraAt(game, 1.7, point.x, point.y);
  assert(Math.abs(game.camX + world.x * game.camZoom - point.x) < 0.001);
  assert(Math.abs(game.camY + world.y * game.camZoom - point.y) < 0.001);
});

function botGame() {
  const pieces = [0, 1].map((id) => ({
    id,
    r: 0,
    c: id,
    x: 200 + id * 80,
    y: 150,
    groupId: 0,
    inPlace: false,
    lockedBy: null,
  }));
  return {
    pieces,
    pieceW: 80,
    pieceH: 70,
    groups: new Map([[0, new Set([0, 1])]]),
    bots: [{ id: 'helper', name: 'Helper', color: '#34d399', carryingPieceId: null, cooldown: 0 }],
    isCompleted: false,
  };
}

test('bots move and place an assembled group rather than waiting for single pieces', () => {
  const game = botGame();
  let snapped = 0;
  const onSnap = () => {
    snapped++;
    game.isCompleted = true;
  };
  advanceBots(game, 0.05, { onSnap });
  assert(game.pieces.every((piece) => piece.lockedBy === 'helper'));
  const start = game.pieces[0].x;
  advanceBots(game, 0.05, { onSnap });
  assert(game.pieces[0].x < start);
  for (let frame = 0; frame < 100; frame++) advanceBots(game, 0.05, { onSnap });
  assert.equal(snapped, 1);
  assert.equal(game.pieces[0].x, 0);
  assert(Math.abs(game.pieces[1].x - 80) < 0.001);
  assert(game.pieces.every((piece) => piece.lockedBy === null));
});

test('bots leave groups held by a human alone', () => {
  const game = botGame();
  game.pieces[1].lockedBy = 'human';
  advanceBots(game, 0.05, { onSnap: () => assert.fail('a human-held piece was moved') });
  assert.equal(game.bots[0].carryingPieceId, null);
  assert.equal(game.pieces[0].x, 200);
});
