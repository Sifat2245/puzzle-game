export function createSeededRandom(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawPuzzleEdge(g, x1, y1, x2, y2, tabSign) {
  if (tabSign === 0) {
    g.lineTo(x2, y2);
    return;
  }
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const nx = (dy / len) * tabSign;
  const ny = (-dx / len) * tabSign;

  const pt = (along, out) => [x1 + dx * along + nx * len * out, y1 + dy * along + ny * len * out];

  const [p1x, p1y] = pt(0.35, 0.0);
  const [c1x, c1y] = pt(0.38, -0.03);
  const [c2x, c2y] = pt(0.4, 0.08);
  const [n1x, n1y] = pt(0.37, 0.14);
  const [h1x, h1y] = pt(0.32, 0.25);
  const [h2x, h2y] = pt(0.43, 0.3);
  const [topX, topY] = pt(0.5, 0.3);
  const [h3x, h3y] = pt(0.57, 0.3);
  const [h4x, h4y] = pt(0.68, 0.25);
  const [n2x, n2y] = pt(0.63, 0.14);
  const [c3x, c3y] = pt(0.6, 0.08);
  const [c4x, c4y] = pt(0.62, -0.03);
  const [p2x, p2y] = pt(0.65, 0.0);

  g.lineTo(p1x, p1y);
  g.bezierCurveTo(c1x, c1y, c2x, c2y, n1x, n1y);
  g.bezierCurveTo(h1x, h1y, h2x, h2y, topX, topY);
  g.bezierCurveTo(h3x, h3y, h4x, h4y, n2x, n2y);
  g.bezierCurveTo(c3x, c3y, c4x, c4y, p2x, p2y);
  g.lineTo(x2, y2);
}

export function tracePiecePath(g, ox, oy, w, h, tabs) {
  g.beginPath();
  g.moveTo(ox, oy);
  drawPuzzleEdge(g, ox, oy, ox + w, oy, tabs.top);
  drawPuzzleEdge(g, ox + w, oy, ox + w, oy + h, tabs.right);
  drawPuzzleEdge(g, ox + w, oy + h, ox, oy + h, tabs.bottom);
  drawPuzzleEdge(g, ox, oy + h, ox, oy, tabs.left);
  g.closePath();
}

export function renderPieceSprite(piece, sourceImage, pieceW, pieceH, boardW, boardH) {
  const padX = Math.ceil(pieceW * 0.38);
  const padY = Math.ceil(pieceH * 0.38);
  const cw = Math.ceil(pieceW + padX * 2);
  const ch = Math.ceil(pieceH + padY * 2);

  const sCanvas = document.createElement('canvas');
  sCanvas.width = cw;
  sCanvas.height = ch;
  const sCtx = sCanvas.getContext('2d');

  sCtx.save();
  tracePiecePath(sCtx, padX, padY, pieceW, pieceH, piece.tabs);
  sCtx.clip();
  // Keep transparent character artwork visible as solid, draggable puzzle pieces.
  sCtx.fillStyle = '#fffdf6';
  sCtx.fillRect(0, 0, cw, ch);

  const scaleX = sourceImage.width / boardW;
  const scaleY = sourceImage.height / boardH;
  const srcX = (piece.c * pieceW - padX) * scaleX;
  const srcY = (piece.r * pieceH - padY) * scaleY;
  const srcW = cw * scaleX;
  const srcH = ch * scaleY;

  sCtx.drawImage(sourceImage, srcX, srcY, srcW, srcH, 0, 0, cw, ch);

  // Puzzle 3D bevel highlight & shadow
  sCtx.lineWidth = 2.2;
  sCtx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  sCtx.shadowColor = 'rgba(255, 255, 255, 0.45)';
  sCtx.shadowBlur = 1;
  sCtx.shadowOffsetX = 1;
  sCtx.shadowOffsetY = 1;
  tracePiecePath(sCtx, padX, padY, pieceW, pieceH, piece.tabs);
  sCtx.stroke();

  sCtx.strokeStyle = 'rgba(0, 0, 0, 0.42)';
  sCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  sCtx.shadowOffsetX = -1;
  sCtx.shadowOffsetY = -1;
  tracePiecePath(sCtx, padX, padY, pieceW, pieceH, piece.tabs);
  sCtx.stroke();
  sCtx.restore();

  sCtx.save();
  tracePiecePath(sCtx, padX, padY, pieceW, pieceH, piece.tabs);
  sCtx.lineWidth = 0.85;
  sCtx.strokeStyle = 'rgba(20, 20, 20, 0.55)';
  sCtx.stroke();
  sCtx.restore();

  piece.spriteCanvas = sCanvas;
  piece.padX = padX;
  piece.padY = padY;
}

export function compressImageFileToDataUrl(file, maxDim = 920, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const oCtx = off.getContext('2d');
        oCtx.drawImage(img, 0, 0, w, h);
        resolve(off.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
