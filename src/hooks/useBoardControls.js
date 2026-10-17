import { useCallback, useEffect, useRef } from 'react';
import { tracePiecePath } from '../utils/puzzleCanvas.js';
import { zoomCameraAt } from '../utils/camera.js';

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
  setZoomPercent,
}) {
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  const screenToWorld = (x, y) => {
    const game = gameRef.current;
    return { x: (x - game.camX) / game.camZoom, y: (y - game.camY) / game.camZoom };
  };

  const applyZoom = (factor, x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    zoomCameraAt(gameRef.current, factor, x ?? rect.width / 2, y ?? rect.height / 2);
    setZoomPercent(Math.round(gameRef.current.camZoom * 100));
  };

  const triggerBoardPing = (x, y) => {
    gameRef.current.pings.push({
      x,
      y,
      color: myColor,
      name: myName,
      radius: 6,
      maxRadius: 95,
      alpha: 1,
    });
    playSound('ping');
    broadcastNetworkEvent({
      type: 'PING',
      x: Math.round(x),
      y: Math.round(y),
      name: myName,
      color: myColor,
    });
    setPingMode(false);
  };

  const finishDrag = useCallback(
    (cancelled = false) => {
      const game = gameRef.current;
      const piece = game.activeDragPiece;
      game.activeDragPiece = null;
      game.isPanning = false;
      if (!piece) return;
      game.groups.get(piece.groupId)?.forEach((id) => {
        game.pieces[id].lockedBy = null;
      });
      const touch = game.dragPointerType === 'touch';
      if (!cancelled) checkAndSnapGroup(piece, game.players.get(myPlayerId), { touch });
      // Send only this move: a stale copy of the whole board would undo other players' work.
      broadcastNetworkEvent({
        type: 'PIECE_DROP',
        pieceId: piece.id,
        x: piece.x,
        y: piece.y,
        touch,
        cancelled,
      });
    },
    [gameRef, myPlayerId, checkAndSnapGroup, broadcastNetworkEvent],
  );

  function startDrag(clientX, clientY, pointerType) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const game = gameRef.current;
    const position = { x: clientX - rect.left, y: clientY - rect.top };
    game.lastPointer = position;
    if (!game.pieces.length || game.isCompleted) return;
    const world = screenToWorld(position.x, position.y);
    if (pingMode) {
      triggerBoardPing(world.x, world.y);
      return;
    }

    // Test the actual outline, including tabs, instead of a smaller rectangular hit box.
    const context = canvas.getContext('2d');
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    let hit = null;
    for (const id of [...game.drawOrder].reverse()) {
      const piece = game.pieces[id];
      if (!piece || piece.inPlace || (edgesOnly && !piece.isEdge)) continue;
      const group = game.groups.get(piece.groupId);
      if (
        Array.from(group || []).some(
          (memberId) =>
            game.pieces[memberId].inPlace ||
            (game.pieces[memberId].lockedBy && game.pieces[memberId].lockedBy !== myPlayerId),
        )
      )
        continue;
      tracePiecePath(context, piece.x, piece.y, game.pieceW, game.pieceH, piece.tabs);
      if (context.isPointInPath(world.x, world.y)) {
        hit = piece;
        break;
      }
    }
    context.restore();
    if (!hit) {
      game.isPanning = true;
      return;
    }

    game.activeDragPiece = hit;
    game.dragPointerType = pointerType;
    const group = game.groups.get(hit.groupId);
    game.drawOrder = [
      ...game.drawOrder.filter((id) => !group.has(id)),
      ...game.drawOrder.filter((id) => group.has(id)),
    ];
    group.forEach((id) =>
      Object.assign(game.pieces[id], {
        lockedBy: myPlayerId,
        lockedColor: myColor,
        lockedName: myName,
      }),
    );
    broadcastNetworkEvent({
      type: 'PIECE_DRAG',
      pieceId: hit.id,
      x: hit.x,
      y: hit.y,
      name: myName,
      color: myColor,
    });
  }

  function moveDrag(clientX, clientY) {
    const rect = canvasRef.current.getBoundingClientRect();
    const game = gameRef.current;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dx = x - game.lastPointer.x;
    const dy = y - game.lastPointer.y;
    game.lastPointer = { x, y };
    const world = screenToWorld(x, y);
    const player = game.players.get(myPlayerId);
    if (player) Object.assign(player, world);
    const now = performance.now();
    if (now - game.lastCursorSent > 45) {
      game.lastCursorSent = now;
      broadcastNetworkEvent({
        type: 'CURSOR',
        x: Math.round(world.x),
        y: Math.round(world.y),
        name: myName,
        color: myColor,
      });
    }
    if (game.activeDragPiece) {
      const root = game.activeDragPiece;
      game.groups.get(root.groupId)?.forEach((id) => {
        game.pieces[id].x += dx / game.camZoom;
        game.pieces[id].y += dy / game.camZoom;
      });
      broadcastNetworkEvent({
        type: 'PIECE_DRAG',
        pieceId: root.id,
        x: root.x,
        y: root.y,
        name: myName,
        color: myColor,
      });
    } else if (game.isPanning) {
      game.camX += dx;
      game.camY += dy;
    }
  }

  function pinchPosition() {
    const [first, second] = Array.from(pointers.current.values());
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (first.x + second.x) / 2 - rect.left,
      y: (first.y + second.y) / 2 - rect.top,
      distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
    };
  }

  function onBoardPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size >= 2) {
      finishDrag(true);
      pinch.current = pinchPosition();
    } else {
      startDrag(event.clientX, event.clientY, event.pointerType);
    }
  }

  function onBoardPointerMove(event) {
    if (!pointers.current.has(event.pointerId)) {
      if (event.pointerType === 'mouse' && !pointers.current.size)
        moveDrag(event.clientX, event.clientY);
      return;
    }
    event.preventDefault();
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2) {
      const next = pinchPosition();
      const previous = pinch.current;
      if (previous) {
        gameRef.current.camX += next.x - previous.x;
        gameRef.current.camY += next.y - previous.y;
        applyZoom(next.distance / previous.distance, next.x, next.y);
      }
      pinch.current = next;
    } else {
      moveDrag(event.clientX, event.clientY);
    }
  }

  function onBoardPointerUp(event) {
    if (!pointers.current.has(event.pointerId)) return;
    const wasPinching = pointers.current.size >= 2;
    if (!wasPinching && event.type === 'pointerup') moveDrag(event.clientX, event.clientY);
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!wasPinching) finishDrag(event.type !== 'pointerup');
    if (pointers.current.size === 1 && wasPinching) {
      const remaining = Array.from(pointers.current.values())[0];
      const rect = canvasRef.current.getBoundingClientRect();
      gameRef.current.lastPointer = { x: remaining.x - rect.left, y: remaining.y - rect.top };
      gameRef.current.isPanning = true;
    }
    if (pointers.current.size < 2) pinch.current = null;
  }

  useEffect(() => {
    if (activeScreen !== 'board') return;
    const cancel = () => {
      pointers.current.clear();
      pinch.current = null;
      finishDrag(true);
    };
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('blur', cancel);
      cancel();
    };
  }, [activeScreen, finishDrag]);

  return {
    screenToWorld,
    triggerBoardPing,
    applyZoom,
    onBoardPointerDown,
    onBoardPointerMove,
    onBoardPointerUp,
  };
}
