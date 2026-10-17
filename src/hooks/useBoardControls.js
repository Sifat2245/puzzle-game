import { useCallback, useEffect } from 'react';

export function useBoardControls({
  gameRef,
  canvasRef,
  myPlayerId,
  myName,
  myColor,
  pingMode,
  edgesOnly,
  activeScreen,
  playSound,
  broadcastNetworkEvent,
  setPingMode,
  checkAndSnapGroup,
  serializePieces,
  setZoomPercent,
}) {
  const screenToWorld = (sx, sy) => {
    const g = gameRef.current;
    return {
      x: (sx - g.camX) / g.camZoom,
      y: (sy - g.camY) / g.camZoom,
    };
  };

  const elevateGroupDrawOrder = (groupId) => {
    const g = gameRef.current;
    const grp = g.groups.get(groupId);
    if (!grp) return;
    const lower = [];
    const upper = [];
    g.drawOrder.forEach((pid) => {
      if (grp.has(pid)) upper.push(pid);
      else lower.push(pid);
    });
    g.drawOrder = lower.concat(upper);
  };

  const triggerBoardPing = (wx, wy) => {
    const g = gameRef.current;
    g.pings.push({
      x: wx,
      y: wy,
      color: myColor,
      name: myName,
      radius: 6,
      maxRadius: 95,
      alpha: 1.0,
    });
    playSound('ping');
    broadcastNetworkEvent({
      type: 'PING',
      x: Math.round(wx),
      y: Math.round(wy),
      name: myName,
      color: myColor,
    });
    setPingMode(false);
  };

  const onCanvasPointerDown = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const g = gameRef.current;
    if (g.isCompleted) return;
    g.lastPointer = { x: sx, y: sy };

    const world = screenToWorld(sx, sy);

    if (pingMode) {
      triggerBoardPing(world.x, world.y);
      return;
    }

    let hit = null;
    for (let i = g.drawOrder.length - 1; i >= 0; i--) {
      const p = g.pieces[g.drawOrder[i]];
      if (!p) continue;
      if (edgesOnly && !p.isEdge && !p.inPlace) continue;
      if (p.lockedBy && p.lockedBy !== myPlayerId) continue;
      if (
        world.x >= p.x - g.pieceW * 0.08 &&
        world.x <= p.x + g.pieceW * 1.08 &&
        world.y >= p.y - g.pieceH * 0.08 &&
        world.y <= p.y + g.pieceH * 1.08
      ) {
        hit = p;
        break;
      }
    }

    if (hit) {
      g.activeDragPiece = hit;
      elevateGroupDrawOrder(hit.groupId);
      const grp = g.groups.get(hit.groupId);
      if (grp) {
        grp.forEach((pid) => {
          g.pieces[pid].lockedBy = myPlayerId;
          g.pieces[pid].lockedColor = myColor;
          g.pieces[pid].lockedName = myName;
        });
      }
    } else {
      g.isPanning = true;
    }
  };

  const onCanvasPointerMove = useCallback(
    (clientX, clientY) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const g = gameRef.current;
      const dxScreen = sx - g.lastPointer.x;
      const dyScreen = sy - g.lastPointer.y;
      g.lastPointer = { x: sx, y: sy };

      const world = screenToWorld(sx, sy);
      const me = g.players.get(myPlayerId);
      if (me) {
        me.x = world.x;
        me.y = world.y;
      }

      const now = performance.now();
      if (now - g.lastCursorSent > 45) {
        g.lastCursorSent = now;
        broadcastNetworkEvent({
          type: 'CURSOR',
          x: Math.round(world.x),
          y: Math.round(world.y),
          name: myName,
          color: myColor,
          score: me ? me.score : 0,
        });
      }

      if (g.activeDragPiece) {
        const dxW = dxScreen / g.camZoom;
        const dyW = dyScreen / g.camZoom;
        const grp = g.groups.get(g.activeDragPiece.groupId);
        if (grp) {
          grp.forEach((pid) => {
            g.pieces[pid].x += dxW;
            g.pieces[pid].y += dyW;
          });
        }
        broadcastNetworkEvent({
          type: 'PIECE_DRAG',
          pieceId: g.activeDragPiece.id,
          x: Math.round(g.activeDragPiece.x),
          y: Math.round(g.activeDragPiece.y),
          name: myName,
          color: myColor,
        });
      } else if (g.isPanning) {
        g.camX += dxScreen;
        g.camY += dyScreen;
      }
    },
    [myPlayerId, myName, myColor, broadcastNetworkEvent],
  );

  const onCanvasPointerUp = useCallback(() => {
    const g = gameRef.current;
    if (g.activeDragPiece) {
      const dropped = g.activeDragPiece;
      g.activeDragPiece = null;
      const grp = g.groups.get(dropped.groupId);
      if (grp) {
        grp.forEach((pid) => {
          g.pieces[pid].lockedBy = null;
        });
      }
      const me = g.players.get(myPlayerId);
      const snapped = checkAndSnapGroup(dropped, me);
      broadcastNetworkEvent({
        type: 'PIECE_DROP',
        pieceId: dropped.id,
        snappedBy: snapped ? myPlayerId : null,
        pieces: serializePieces(),
      });
    }
    g.isPanning = false;
  }, [myPlayerId, checkAndSnapGroup, broadcastNetworkEvent, serializePieces]);

  useEffect(() => {
    if (activeScreen !== 'board') return;
    const handleWinMove = (e) => onCanvasPointerMove(e.clientX, e.clientY);
    const handleWinUp = () => onCanvasPointerUp();
    window.addEventListener('mousemove', handleWinMove);
    window.addEventListener('mouseup', handleWinUp);
    return () => {
      window.removeEventListener('mousemove', handleWinMove);
      window.removeEventListener('mouseup', handleWinUp);
    };
  }, [activeScreen, onCanvasPointerMove, onCanvasPointerUp]);

  const applyZoom = (factor, cx, cy) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = gameRef.current;
    const mx = cx !== undefined ? cx : canvas.width / 2;
    const my = cy !== undefined ? cy : canvas.height / 2;
    const oldZoom = g.camZoom;
    const newZoom = Math.min(Math.max(oldZoom * factor, 0.3), 2.5);
    g.camX = mx - ((mx - g.camX) / oldZoom) * newZoom;
    g.camY = my - ((my - g.camY) / oldZoom) * newZoom;
    g.camZoom = newZoom;
    setZoomPercent(Math.round(newZoom * 100));
  };

  return {
    screenToWorld,
    triggerBoardPing,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
    applyZoom,
  };
}
