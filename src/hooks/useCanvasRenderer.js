import { bnNumber } from '../utils/bangla.js';
import { useEffect } from 'react';
import { tracePiecePath } from '../utils/puzzleCanvas.js';
import { advanceBots } from '../utils/bots.js';

export function useCanvasRenderer({
  activeScreen,
  canvasRef,
  gameRef,
  botPace,
  edgesOnly,
  showGuideFrame,
  myPlayerId,
  checkAndSnapGroup,
  isHostRef,
  broadcastNetworkEvent,
  serializePieces,
  centerCamera,
}) {
  useEffect(() => {
    if (activeScreen !== 'board') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (
        !rect.width ||
        !rect.height ||
        (width === rect.width && height === rect.height && pixelRatio === ratio)
      )
        return;
      width = rect.width;
      height = rect.height;
      pixelRatio = ratio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      if (gameRef.current.pieces.length) centerCamera();
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas.parentElement);
    window.addEventListener('resize', handleResize);

    let animId = null;
    let lastTime = performance.now();

    const renderFrame = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const g = gameRef.current;

      if (isHostRef.current) {
        advanceBots(g, dt, {
          pace: botPace,
          onSnap: (piece, bot) => {
            checkAndSnapGroup(piece, bot);
            broadcastNetworkEvent({
              type: 'BOARD_SYNC',
              pieces: serializePieces(),
              players: Array.from(g.players.values()),
            });
          },
        });
      }
      // Every frame starts in CSS pixel coordinates, including on Retina screens.
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      // Update particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) g.particles.splice(i, 1);
      }

      // Update sonar pings
      for (let i = g.pings.length - 1; i >= 0; i--) {
        const pg = g.pings[i];
        pg.radius += 110 * dt;
        pg.alpha -= 0.72 * dt;
        if (pg.alpha <= 0) g.pings.splice(i, 1);
      }

      // 1. Draw Felt Surface Background
      ctx.save();
      if (g.feltPatternCanvas) {
        ctx.fillStyle = ctx.createPattern(g.feltPatternCanvas, 'repeat');
      } else {
        ctx.fillStyle = '#6e7065';
      }
      ctx.fillRect(0, 0, width, height);

      // Vignette
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.25,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75,
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Camera transform
      ctx.translate(g.camX, g.camY);
      ctx.scale(g.camZoom, g.camZoom);

      // 2. Target Guide Frame
      if (showGuideFrame) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.fillRect(0, 0, g.boardW, g.boardH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
        ctx.lineWidth = 2 / g.camZoom;
        ctx.setLineDash([8 / g.camZoom, 6 / g.camZoom]);
        ctx.strokeRect(0, 0, g.boardW, g.boardH);
        ctx.restore();
      }

      // 3. Draw puzzle pieces
      for (let i = 0; i < g.drawOrder.length; i++) {
        const p = g.pieces[g.drawOrder[i]];
        if (!p || !p.spriteCanvas) continue;
        if (edgesOnly && !p.isEdge && !p.inPlace) continue;

        const isPickedUp = Boolean(p.lockedBy);
        ctx.save();
        if (isPickedUp) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 14;
          ctx.shadowOffsetX = 5;
          ctx.shadowOffsetY = 7;
        } else if (!p.inPlace) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 3;
        }
        ctx.drawImage(p.spriteCanvas, p.x - p.padX, p.y - p.padY);
        ctx.restore();

        if (isPickedUp) {
          ctx.save();
          tracePiecePath(ctx, p.x, p.y, g.pieceW, g.pieceH, p.tabs);
          ctx.lineWidth = 2.6 / g.camZoom;
          ctx.strokeStyle = p.lockedColor || '#38bdf8';
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. Draw Board Sonar Pings
      g.pings.forEach((pg) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pg.alpha);
        ctx.strokeStyle = pg.color;
        ctx.lineWidth = 3 / g.camZoom;
        ctx.beginPath();
        ctx.arc(pg.x, pg.y, pg.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pg.x, pg.y, pg.radius * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = `600 ${Math.round(12 / g.camZoom)}px "Hind Siliguri", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`📍 ${pg.name}`, pg.x + 10 / g.camZoom, pg.y - 10 / g.camZoom);
        ctx.restore();
      });

      // 5. Draw Snap Sparkles & Floating Emotes
      g.particles.forEach((pt) => {
        const alpha = Math.max(0, pt.life / pt.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        if (pt.emote) {
          ctx.font = `bold ${Math.round(16 / g.camZoom)}px "Hind Siliguri", sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(pt.emote, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4 / g.camZoom, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 6. Draw Live Remote Friend & Bot Cursors
      g.players.forEach((player) => {
        if (player.id === myPlayerId) return;
        ctx.save();
        ctx.translate(player.x || 0, player.y || 0);
        const inv = 1 / g.camZoom;
        ctx.scale(inv, inv);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 17);
        ctx.lineTo(4.5, 13);
        ctx.lineTo(8.5, 20);
        ctx.lineTo(11, 18.5);
        ctx.lineTo(7, 11.5);
        ctx.lineTo(12.5, 11.5);
        ctx.closePath();
        ctx.fillStyle = player.color || '#f472b6';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        const label = `${player.name} (${bnNumber(player.score || 0)})`;
        ctx.font = '600 11px "Hind Siliguri", sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(20, 22, 19, 0.88)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(12, 12, tw + 12, 20, 6);
        } else {
          ctx.rect(12, 12, tw + 12, 20);
        }
        ctx.fill();
        ctx.strokeStyle = player.color || '#f472b6';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, 18, 25.5);
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    activeScreen,
    edgesOnly,
    showGuideFrame,
    botPace,
    myPlayerId,
    checkAndSnapGroup,
    isHostRef,
    broadcastNetworkEvent,
    serializePieces,
    centerCamera,
  ]);
}
