import { useCallback, useEffect, useRef } from 'react';
import { SURFACE_THEMES } from '../data/puzzles.js';
import { createSeededRandom, renderPieceSprite } from '../utils/puzzleCanvas.js';

export function usePuzzleEngine({
  gameRef,
  canvasRef,
  surfaceIndex,
  playSound,
  addToast,
  setPlayersList,
  setProgressStats,
  setComboStreak,
  setShowVictoryModal,
  setZoomPercent,
  setResult,
}) {
  const buildFeltPattern = useCallback((themeIdx) => {
    const theme = SURFACE_THEMES[themeIdx] || SURFACE_THEMES[0];
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 96;
    pCanvas.height = 96;
    const pCtx = pCanvas.getContext('2d');
    pCtx.fillStyle = theme.bg;
    pCtx.fillRect(0, 0, 96, 96);

    const rand = createSeededRandom(theme.name);
    for (let i = 0; i < 420; i++) {
      const x = Math.floor(rand() * 96);
      const y = Math.floor(rand() * 96);
      const w = 1 + Math.floor(rand() * 2);
      pCtx.fillStyle = i % 2 === 0 ? theme.dot1 : theme.dot2;
      pCtx.fillRect(x, y, w, 1);
    }
    gameRef.current.feltPatternCanvas = pCanvas;
  }, []);

  useEffect(() => {
    buildFeltPattern(surfaceIndex);
  }, [surfaceIndex, buildFeltPattern]);

  const syncPlayersUI = useCallback(() => {
    setPlayersList(Array.from(gameRef.current.players.values(), (player) => ({ ...player })));
  }, []);

  const serializePieces = useCallback(() => {
    return gameRef.current.pieces.map((p) => ({
      id: p.id,
      r: p.r,
      c: p.c,
      x: Math.round(p.x),
      y: Math.round(p.y),
      groupId: p.groupId,
      inPlace: p.inPlace,
    }));
  }, []);

  const updateProgressAndVictory = useCallback(() => {
    const g = gameRef.current;
    const total = g.pieces.length;
    let connected = 0;
    g.pieces.forEach((p) => {
      const grp = g.groups.get(p.groupId);
      if ((grp && grp.size > 1) || p.inPlace) connected++;
    });
    const pct = total ? Math.min(100, Math.round((connected / total) * 100)) : 0;
    setProgressStats({ connected, total, pct });

    const largestGroup = Math.max(...Array.from(g.groups.values()).map((s) => s.size), 0);
    if (!g.isCompleted && total > 0 && largestGroup === total) {
      g.isCompleted = true;
      g.finishedAt = Date.now();
      g.result = {
        title: g.puzzleTitle,
        imageSrc: g.imageSrc,
        total,
        elapsedSeconds: Math.max(0, Math.floor((g.finishedAt - g.startedAt) / 1000)),
        roomCode: g.roomCode,
        bestCombo: g.bestCombo || 1,
        players: Array.from(g.players.values(), (player) => ({ ...player })),
      };
      setResult(g.result);
      playSound('victory');
      setShowVictoryModal(true);
    }
  }, [playSound, setResult, setShowVictoryModal, setProgressStats, gameRef]);

  const arrangeLoosePiecesOnPerimeter = useCallback((customRand) => {
    const g = gameRef.current;
    const rand = customRand || Math.random;
    const loose = g.pieces.filter((p) => {
      const grp = g.groups.get(p.groupId);
      return grp && grp.size === 1 && !p.inPlace;
    });

    for (let i = loose.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = loose[i];
      loose[i] = loose[j];
      loose[j] = tmp;
    }

    const margin = Math.max(g.pieceW, g.pieceH) * 0.75;
    const stepX = g.pieceW * 1.18;
    const stepY = g.pieceH * 1.18;
    const slots = [];

    const topY = -margin - g.pieceH * 1.05;
    const botY = g.boardH + margin * 0.35;
    const spanCols = Math.ceil((g.boardW + margin * 4) / stepX);
    const startX = -margin * 2;
    for (let c = 0; c < spanCols; c++) {
      slots.push({ x: startX + c * stepX, y: topY });
      slots.push({ x: startX + c * stepX, y: botY });
    }

    const bankRows = Math.ceil((g.boardH + margin) / stepY);
    for (let bankCol = 1; bankCol <= 4; bankCol++) {
      const lx = -margin * 0.6 - bankCol * stepX;
      const rx = g.boardW + margin * 0.6 + (bankCol - 1) * stepX;
      for (let r = 0; r < bankRows; r++) {
        const y = -margin * 0.2 + r * stepY;
        slots.push({ x: lx, y });
        slots.push({ x: rx, y });
      }
    }

    loose.forEach((p, idx) => {
      const slot = slots[idx % slots.length];
      p.x = Math.round(slot.x + (rand() - 0.5) * 8);
      p.y = Math.round(slot.y + (rand() - 0.5) * 8);
    });
  }, []);

  const centerCamera = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const g = gameRef.current;
    const totalW = g.boardW + g.pieceW * 9.5;
    const totalH = g.boardH + g.pieceH * 4.5;
    const scale = Math.min(rect.width / totalW, rect.height / totalH);
    g.camZoom = Math.min(Math.max(scale, 0.42), 1.35);
    g.camX = (rect.width - g.boardW * g.camZoom) / 2;
    g.camY = (rect.height - g.boardH * g.camZoom) / 2;
    setZoomPercent(Math.round(g.camZoom * 100));
  }, []);

  const mergePieceGroups = useCallback((pieceA, pieceB, playFx = true) => {
    const g = gameRef.current;
    const gidA = pieceA.groupId;
    const gidB = pieceB.groupId;
    if (gidA === gidB) return false;

    const setA = g.groups.get(gidA);
    const setB = g.groups.get(gidB);
    if (!setA || !setB) return false;

    const targetAX = pieceB.x + (pieceA.c - pieceB.c) * g.pieceW;
    const targetAY = pieceB.y + (pieceA.r - pieceB.r) * g.pieceH;
    const dx = targetAX - pieceA.x;
    const dy = targetAY - pieceA.y;

    setA.forEach((pid) => {
      const p = g.pieces[pid];
      p.x += dx;
      p.y += dy;
      p.groupId = gidB;
      if (pieceB.inPlace) p.inPlace = true;
      setB.add(pid);
    });
    g.groups.delete(gidA);

    if (playFx) {
      const wx = pieceA.x + g.pieceW / 2;
      const wy = pieceA.y + g.pieceH / 2;
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
        const speed = 45 + Math.random() * 85;
        g.particles.push({
          x: wx,
          y: wy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.55,
          maxLife: 0.55,
          color: '#34d399',
          emote: null,
        });
      }
    }
    return true;
  }, []);

  const checkAndSnapGroup = useCallback(
    (rootPiece, playerObj) => {
      const g = gameRef.current;
      const gid = rootPiece.groupId;
      const groupSet = g.groups.get(gid);
      if (!groupSet) return false;

      const snapThreshold = Math.min(g.pieceW, g.pieceH) * 0.34;
      let snappedAny = false;

      const targetRootX = rootPiece.c * g.pieceW;
      const targetRootY = rootPiece.r * g.pieceH;
      if (Math.hypot(rootPiece.x - targetRootX, rootPiece.y - targetRootY) < snapThreshold * 0.9) {
        const dx = targetRootX - rootPiece.x;
        const dy = targetRootY - rootPiece.y;
        groupSet.forEach((pid) => {
          const p = g.pieces[pid];
          p.x += dx;
          p.y += dy;
          if (!p.inPlace) {
            p.inPlace = true;
            snappedAny = true;
          }
        });
      }

      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];

      const memberIds = Array.from(groupSet);
      for (let i = 0; i < memberIds.length; i++) {
        const p = g.pieces[memberIds[i]];
        for (const { dr, dc } of dirs) {
          const nr = p.r + dr;
          const nc = p.c + dc;
          if (nr < 0 || nr >= g.rows || nc < 0 || nc >= g.cols) continue;
          const nb = g.pieces[nr * g.cols + nc];
          if (!nb || nb.groupId === p.groupId) continue;

          const expectedX = nb.x - dc * g.pieceW;
          const expectedY = nb.y - dr * g.pieceH;
          if (Math.hypot(p.x - expectedX, p.y - expectedY) < snapThreshold) {
            if (mergePieceGroups(p, nb, true)) {
              snappedAny = true;
            }
          }
        }
      }

      if (snappedAny) {
        const now = Date.now();
        if (now - g.lastSnapTimestamp < 10000) {
          g.streakCount += 1;
        } else {
          g.streakCount = 1;
        }
        g.lastSnapTimestamp = now;
        g.bestCombo = Math.max(g.bestCombo || 0, g.streakCount);
        playSound(g.streakCount >= 2 ? 'streak' : 'snap');

        if (playerObj) {
          const bonus = g.streakCount >= 3 ? 2 : 1;
          playerObj.score = (playerObj.score || 0) + bonus;
          setComboStreak({ count: g.streakCount, player: playerObj.name });
          addToast(
            g.streakCount >= 2
              ? `🔥 ${g.streakCount}x Team Combo! ${playerObj.name} snapped a piece!`
              : `${playerObj.name} connected a piece! (+1)`,
            playerObj.color,
          );
          syncPlayersUI();
        }
      }

      updateProgressAndVictory();
      return snappedAny;
    },
    [mergePieceGroups, playSound, addToast, syncPlayersUI, updateProgressAndVictory],
  );

  const applySerializedPieces = useCallback(
    (list) => {
      const g = gameRef.current;
      if (!Array.isArray(list) || list.length !== g.pieces.length) return;
      g.groups.clear();
      list.forEach((item) => {
        const p = g.pieces[item.id];
        if (!p) return;
        p.x = item.x;
        p.y = item.y;
        p.groupId = item.groupId;
        p.inPlace = Boolean(item.inPlace);
        if (!g.groups.has(p.groupId)) g.groups.set(p.groupId, new Set());
        g.groups.get(p.groupId).add(p.id);
      });
      updateProgressAndVictory();
    },
    [updateProgressAndVictory],
  );

  const buildRequestRef = useRef(0);
  const cancelBuild = useCallback(() => {
    buildRequestRef.current += 1;
  }, []);
  useEffect(
    () => () => {
      buildRequestRef.current += 1;
    },
    [],
  );

  const buildPuzzleBoard = useCallback(
    (imgSrc, pieceTarget, customSeedCode, IncomingPiecesList = null) =>
      new Promise((resolve, reject) => {
        const request = ++buildRequestRef.current;
        const img = new Image();
        img.onload = () => {
          if (request !== buildRequestRef.current) return resolve(false);
          const g = gameRef.current;
          g.loadedImage = img;
          const aspect = img.width / img.height;

          let bestCols = 8;
          let bestRows = 6;
          let bestDiff = Infinity;
          for (let r = 3; r <= 16; r++) {
            const c = Math.max(3, Math.round(r * aspect));
            const diff = Math.abs(r * c - pieceTarget);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestCols = c;
              bestRows = r;
            }
          }

          g.cols = bestCols;
          g.rows = bestRows;
          g.boardH = 420;
          g.boardW = Math.round(420 * aspect);
          g.pieceW = g.boardW / g.cols;
          g.pieceH = g.boardH / g.rows;

          const rand = createSeededRandom(`${customSeedCode}-${g.cols * g.rows}`);
          const horizTabs = Array.from({ length: g.rows + 1 }, () => Array(g.cols).fill(0));
          const vertTabs = Array.from({ length: g.rows }, () => Array(g.cols + 1).fill(0));

          for (let r = 0; r < g.rows; r++) {
            for (let c = 0; c < g.cols; c++) {
              if (r < g.rows - 1) horizTabs[r + 1][c] = rand() > 0.5 ? 1 : -1;
              if (c < g.cols - 1) vertTabs[r][c + 1] = rand() > 0.5 ? 1 : -1;
            }
          }

          g.pieces = [];
          g.groups.clear();
          g.drawOrder = [];
          g.isCompleted = false;
          g.activeDragPiece = null;
          g.isPanning = false;
          g.particles = [];
          g.pings = [];
          g.bots.forEach((bot) => {
            bot.carryingPieceId = null;
            bot.cooldown = 1.5;
          });

          for (let r = 0; r < g.rows; r++) {
            for (let c = 0; c < g.cols; c++) {
              const id = r * g.cols + c;
              const tabs = {
                top: r === 0 ? 0 : -horizTabs[r][c],
                right: c === g.cols - 1 ? 0 : vertTabs[r][c + 1],
                bottom: r === g.rows - 1 ? 0 : horizTabs[r + 1][c],
                left: c === 0 ? 0 : -vertTabs[r][c],
              };
              const isEdge = r === 0 || r === g.rows - 1 || c === 0 || c === g.cols - 1;
              const piece = {
                id,
                r,
                c,
                x: 0,
                y: 0,
                groupId: id,
                tabs,
                isEdge,
                inPlace: false,
                lockedBy: null,
                lockedColor: null,
                lockedName: null,
                spriteCanvas: null,
                padX: 0,
                padY: 0,
              };
              renderPieceSprite(piece, img, g.pieceW, g.pieceH, g.boardW, g.boardH);
              g.pieces.push(piece);
              g.groups.set(id, new Set([id]));
              g.drawOrder.push(id);
            }
          }

          if (IncomingPiecesList && IncomingPiecesList.length === g.pieces.length) {
            applySerializedPieces(IncomingPiecesList);
          } else {
            arrangeLoosePiecesOnPerimeter(rand);
          }

          centerCamera();
          updateProgressAndVictory();
          resolve(true);
        };
        img.onerror = () => reject(new Error('Could not load the puzzle image.'));
        img.src = imgSrc;
      }),
    [arrangeLoosePiecesOnPerimeter, applySerializedPieces, centerCamera, updateProgressAndVictory],
  );

  return {
    buildPuzzleBoard,
    cancelBuild,
    arrangeLoosePiecesOnPerimeter,
    centerCamera,
    serializePieces,
    applySerializedPieces,
    checkAndSnapGroup,
    syncPlayersUI,
    updateProgressAndVictory,
  };
}
