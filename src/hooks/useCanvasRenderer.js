import { useEffect } from 'react';

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
}) {
  useEffect(() => {
    if (activeScreen !== 'board') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animId = null;
    let lastTime = performance.now();

    const updateBots = (dt) => {
      const g = gameRef.current;
      if (!isHostRef.current) return;
      if (g.isCompleted || g.pieces.length === 0) return;
      const paceMult = botPace === 'fast' ? 1.75 : botPace === 'relaxed' ? 0.58 : 1.0;

      g.bots.forEach((bot) => {
        if (bot.carryingPieceId !== null) {
          const p = g.pieces[bot.carryingPieceId];
          if (!p || p.lockedBy !== bot.id) {
            bot.carryingPieceId = null;
            return;
          }
          const dx = bot.destPieceX - p.x;
          const dy = bot.destPieceY - p.y;
          const dist = Math.hypot(dx, dy);
          const speed = 225 * paceMult;

          if (dist <= speed * dt + 4) {
            const stepX = bot.destPieceX - p.x;
            const stepY = bot.destPieceY - p.y;
            const grp = g.groups.get(p.groupId);
            if (grp) {
              grp.forEach((pid) => {
                g.pieces[pid].x += stepX;
                g.pieces[pid].y += stepY;
                g.pieces[pid].lockedBy = null;
              });
            }
            bot.x = p.x + g.pieceW * 0.5;
            bot.y = p.y + g.pieceH * 0.5;
            bot.carryingPieceId = null;
            bot.cooldown = (2.6 + Math.random() * 2.2) / paceMult;
            checkAndSnapGroup(p, bot);
            broadcastNetworkEvent({
              type: 'BOARD_SYNC',
              pieces: serializePieces(),
              players: Array.from(g.players.values()),
            });
          } else {
            const vx = (dx / dist) * speed * dt;
            const vy = (dy / dist) * speed * dt;
            const grp = g.groups.get(p.groupId);
            if (grp) {
              grp.forEach((pid) => {
                g.pieces[pid].x += vx;
                g.pieces[pid].y += vy;
              });
            }
            bot.x = p.x + g.pieceW * 0.55;
            bot.y = p.y + g.pieceH * 0.55;
          }
        } else {
          bot.cooldown -= dt;
          bot.x += (bot.targetX - bot.x) * Math.min(1, dt * 4.5);
          bot.y += (bot.targetY - bot.y) * Math.min(1, dt * 4.5);

          if (bot.cooldown <= 0) {
            const candidates = g.pieces.filter((p) => {
              if (p.lockedBy) return false;
              if (edgesOnly && !p.isEdge) return false;
              const grp = g.groups.get(p.groupId);
              return grp && grp.size === 1 && !p.inPlace;
            });
            if (candidates.length > 0) {
              const chosen = candidates[Math.floor(Math.random() * candidates.length)];
              chosen.lockedBy = bot.id;
              chosen.lockedColor = bot.color;
              chosen.lockedName = bot.name;
              bot.carryingPieceId = chosen.id;

              let destX = chosen.c * g.pieceW;
              let destY = chosen.r * g.pieceH;
              const dirs = [
                { dr: -1, dc: 0 },
                { dr: 1, dc: 0 },
                { dr: 0, dc: -1 },
                { dr: 0, dc: 1 },
              ];
              for (const { dr, dc } of dirs) {
                const nr = chosen.r + dr;
                const nc = chosen.c + dc;
                if (nr >= 0 && nr < g.rows && nc >= 0 && nc < g.cols) {
                  const nb = g.pieces[nr * g.cols + nc];
                  const nbGrp = g.groups.get(nb?.groupId);
                  if (nb && nbGrp && (nbGrp.size > 1 || nb.inPlace) && !nb.lockedBy) {
                    destX = nb.x - dc * g.pieceW;
                    destY = nb.y - dr * g.pieceH;
                    break;
                  }
                }
              }
              bot.destPieceX = destX;
              bot.destPieceY = destY;
            } else {
              bot.cooldown = 2.0;
            }
          }
        }
      });
    };

    const renderFrame = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const g = gameRef.current;

      updateBots(dt);

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
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vignette
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5,
        canvas.height * 0.5,
        Math.min(canvas.width, canvas.height) * 0.25,
        canvas.width * 0.5,
        canvas.height * 0.5,
        Math.max(canvas.width, canvas.height) * 0.75,
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        ctx.font = `600 ${Math.round(12 / g.camZoom)}px Inter, sans-serif`;
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
          ctx.font = `bold ${Math.round(16 / g.camZoom)}px Inter, sans-serif`;
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

        const label = `${player.name} (${player.score || 0})`;
        ctx.font = '600 11px Inter, sans-serif';
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
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [activeScreen, edgesOnly, showGuideFrame, botPace, myPlayerId, checkAndSnapGroup]);
}
