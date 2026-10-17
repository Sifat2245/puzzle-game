export function fitPuzzleCamera(game, width, height) {
  const bounds = { left: 0, top: 0, right: game.boardW, bottom: game.boardH };
  game.pieces.forEach((piece) => {
    bounds.left = Math.min(bounds.left, piece.x - piece.padX);
    bounds.top = Math.min(bounds.top, piece.y - piece.padY);
    bounds.right = Math.max(bounds.right, piece.x + game.pieceW + piece.padX);
    bounds.bottom = Math.max(bounds.bottom, piece.y + game.pieceH + piece.padY);
  });
  const padding = width < 640 ? 12 : 24;
  const availableWidth = Math.max(1, width - padding * 2);
  const availableHeight = Math.max(1, height - padding * 2 - 60);
  const contentWidth = Math.max(1, bounds.right - bounds.left);
  const contentHeight = Math.max(1, bounds.bottom - bounds.top);
  const zoom = Math.min(1.35, availableWidth / contentWidth, availableHeight / contentHeight);
  return {
    camZoom: zoom,
    camX: padding + (availableWidth - contentWidth * zoom) / 2 - bounds.left * zoom,
    camY: padding + (availableHeight - contentHeight * zoom) / 2 - bounds.top * zoom,
  };
}

export function zoomCameraAt(game, factor, x, y) {
  const previousZoom = game.camZoom;
  const nextZoom = Math.min(Math.max(previousZoom * factor, 0.05), 3);
  game.camX = x - ((x - game.camX) / previousZoom) * nextZoom;
  game.camY = y - ((y - game.camY) / previousZoom) * nextZoom;
  game.camZoom = nextZoom;
}
