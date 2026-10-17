import { useCallback, useEffect, useRef, useState } from 'react';
import { BOT_PROFILES, PUZZLE_CATALOG } from '../data/puzzles.js';
import { compressImageFileToDataUrl } from '../utils/puzzleCanvas.js';
import {
  createRoomCode,
  getInitialRoom,
  isValidRoomCode,
  normalizeRoomCode,
  roomLink,
} from '../utils/rooms.js';
import { copyText, formatTimer } from '../utils/sharing.js';
import { useSound } from './useSound.js';
import { usePeerRoom } from './usePeerRoom.js';
import { usePuzzleEngine } from './usePuzzleEngine.js';
import { useCanvasRenderer } from './useCanvasRenderer.js';
import { useBoardControls } from './useBoardControls.js';

export function usePuzzleGame() {
  const [initialRoom] = useState(getInitialRoom);
  const [roomCode, setRoomCode] = useState(initialRoom.code);
  const [joinedViaLinkBanner, setJoinedViaLinkBanner] = useState(initialRoom.invited);
  const [activeScreen, setActiveScreen] = useState('landing');
  const [myPlayerId] = useState(() => crypto.randomUUID());
  const [myName, setMyName] = useState('Player 1');
  const [myColor, setMyColor] = useState('#38bdf8');
  const [puzzleId, setPuzzleId] = useState(PUZZLE_CATALOG[0].id);
  const [customImageSrc, setCustomImageSrc] = useState(null);
  const [customImageTitle, setCustomImageTitle] = useState('Custom Photo');
  const [photoSyncBanner, setPhotoSyncBanner] = useState('');
  const [targetPieceCount, setTargetPieceCount] = useState(48);
  const [botCount, setBotCount] = useState(1);
  const [surfaceIndex, setSurfaceIndex] = useState(0);
  const [edgesOnly, setEdgesOnly] = useState(false);
  const [showGuideFrame, setShowGuideFrame] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [pingMode, setPingMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [copiedLinkNotice, setCopiedLinkNotice] = useState(false);
  const [progressStats, setProgressStats] = useState({ connected: 0, total: 0, pct: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [comboStreak, setComboStreak] = useState({ count: 0, player: '' });
  const [playersList, setPlayersList] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [toasts, setToasts] = useState([]);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [previewPos, setPreviewPos] = useState({ x: null, y: 56 });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const gameRef = useRef({
    boardW: 640,
    boardH: 420,
    pieceW: 80,
    pieceH: 70,
    cols: 8,
    rows: 6,
    camX: 0,
    camY: 0,
    camZoom: 1,
    pieces: [],
    groups: new Map(),
    drawOrder: [],
    particles: [],
    pings: [],
    players: new Map(),
    bots: [],
    isCompleted: false,
    lastSnapTimestamp: 0,
    streakCount: 0,
    bestCombo: 0,
    feltPatternCanvas: null,
    loadedImage: null,
    activeDragPiece: null,
    isPanning: false,
    lastPointer: { x: 0, y: 0 },
    lastCursorSent: 0,
    roundSeed: null,
    result: null,
  });
  const incomingHandlerRef = useRef(null);
  const snapshotRef = useRef(null);
  const remoteStateRef = useRef(null);
  const roomGenerationRef = useRef(0);
  const playSound = useSound(soundEnabled);

  const addToast = useCallback((text, color = '#34d399') => {
    const id = crypto.randomUUID();
    setToasts((previous) => [...previous.slice(-2), { id, text, color }]);
    setTimeout(() => setToasts((previous) => previous.filter((item) => item.id !== id)), 3100);
  }, []);

  const network = usePeerRoom({
    roomCode,
    playerId: myPlayerId,
    getPlayer: () => ({
      ...gameRef.current.players.get(myPlayerId),
      id: myPlayerId,
      name: myName,
      color: myColor,
      isBot: false,
    }),
    getSnapshot: () => snapshotRef.current?.(),
    onMessage: (message) => incomingHandlerRef.current?.(message),
  });
  const broadcastNetworkEvent = useCallback(
    (payload) => network.send({ ...payload, roundSeed: gameRef.current.roundSeed }),
    [network.send],
  );
  const connectionStatus = network.status;
  const isHost = network.isHost;

  const engine = usePuzzleEngine({
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
  });
  const {
    buildPuzzleBoard,
    serializePieces,
    applySerializedPieces,
    checkAndSnapGroup,
    syncPlayersUI,
  } = engine;

  const selectedCatalog =
    PUZZLE_CATALOG.find((puzzle) => puzzle.id === puzzleId) || PUZZLE_CATALOG[0];
  const activeImageSrc = customImageSrc || selectedCatalog.src;
  const activePuzzleTitle = customImageSrc ? customImageTitle : selectedCatalog.title;
  const getShareableRoomLink = () => roomLink(roomCode);

  snapshotRef.current = () => {
    const game = gameRef.current;
    return {
      roundSeed: game.roundSeed,
      imageSrc: game.imageSrc || activeImageSrc,
      title: game.puzzleTitle || activePuzzleTitle,
      puzzleId,
      customImageSrc,
      customImageTitle,
      pieceCount: targetPieceCount,
      botCount,
      startedAt: game.startedAt,
      pieces: serializePieces(),
      players: Array.from(game.players.values()),
      result: game.result,
    };
  };

  useEffect(() => {
    roomGenerationRef.current += 1;
    engine.cancelBuild();
    window.history.replaceState(null, '', roomLink(roomCode));
    remoteStateRef.current = null;
    const game = gameRef.current;
    game.players.clear();
    game.bots = [];
    game.pieces = [];
    game.groups.clear();
    game.roundSeed = null;
    game.result = null;
    game.remoteResultSeed = null;
    game.isCompleted = false;
    game.activeDragPiece = null;
    setIsLoading(false);
    game.players.set(myPlayerId, {
      id: myPlayerId,
      name: myName,
      color: myColor,
      score: 0,
      isBot: false,
    });
    setPlayersList(Array.from(game.players.values()));
    setProgressStats({ connected: 0, total: 0, pct: 0 });
    setElapsedSeconds(0);
    setResult(null);
    setChatMessages([]);
    setChatInput('');
    setCopiedLinkNotice(false);
    setShowVictoryModal(false);
  }, [roomCode, myPlayerId]);

  useEffect(() => {
    const player = gameRef.current.players.get(myPlayerId);
    if (player) {
      Object.assign(player, { name: myName, color: myColor });
      syncPlayersUI();
      broadcastNetworkEvent({ type: 'HELLO', player });
    }
  }, [myName, myColor, myPlayerId, syncPlayersUI, broadcastNetworkEvent]);

  useEffect(() => {
    const game = gameRef.current;
    if (!isHost) return;
    while (game.bots.length > botCount) {
      const bot = game.bots.pop();
      game.players.delete(bot.id);
      game.pieces.forEach((piece) => {
        if (piece.lockedBy === bot.id) piece.lockedBy = null;
      });
    }
    while (game.bots.length < botCount) {
      const profile = BOT_PROFILES[game.bots.length];
      const bot = {
        ...profile,
        score: 0,
        x: 100,
        y: 100,
        targetX: 200,
        targetY: 200,
        carryingPieceId: null,
        destPieceX: 0,
        destPieceY: 0,
        cooldown: 2,
        isBot: true,
      };
      game.bots.push(bot);
      game.players.set(bot.id, bot);
    }
    syncPlayersUI();
  }, [botCount, isHost, roomCode, syncPlayersUI]);

  async function applyRoomState(state) {
    if (network.isHostRef.current || !state) return;
    remoteStateRef.current = state;
    setPuzzleId(state.puzzleId || PUZZLE_CATALOG[0].id);
    setCustomImageSrc(state.customImageSrc || null);
    setCustomImageTitle(state.customImageTitle || 'Custom Photo');
    setTargetPieceCount(state.pieceCount);
    setBotCount(state.botCount || 0);
    const game = gameRef.current;
    // Keep the local profile while receiving the host's scores and team roster.
    (state.players || []).forEach((player) => game.players.set(player.id, { ...player }));
    const incomingIds = new Set((state.players || []).map((player) => player.id));
    game.players.forEach((player, id) => {
      if (id !== myPlayerId && !incomingIds.has(id)) game.players.delete(id);
    });
    syncPlayersUI();
    if (!state.roundSeed) return;
    const generation = roomGenerationRef.current;
    const isNewRound = state.roundSeed !== game.roundSeed;
    Object.assign(game, {
      imageSrc: state.imageSrc,
      puzzleTitle: state.title,
      roomCode,
      startedAt: state.startedAt,
    });
    if (isNewRound) {
      game.roundSeed = state.roundSeed;
      game.pieces = [];
      game.groups.clear();
      game.isCompleted = false;
      game.result = null;
      game.remoteResultSeed = null;
      game.bestCombo = 0;
      setResult(null);
      setShowVictoryModal(false);
      setIsLoading(true);
      try {
        await buildPuzzleBoard(state.imageSrc, state.pieceCount, state.roundSeed, state.pieces);
      } catch {
        addToast('Could not load the host’s puzzle. Try reconnecting.', '#f87171');
      } finally {
        if (generation === roomGenerationRef.current && state.roundSeed === game.roundSeed)
          setIsLoading(false);
      }
    } else if (!game.activeDragPiece && !isLoading) {
      applySerializedPieces(state.pieces);
    }
    if (generation !== roomGenerationRef.current || state.roundSeed !== game.roundSeed) return;
    if (state.result && game.remoteResultSeed !== state.roundSeed) {
      game.remoteResultSeed = state.roundSeed;
      game.result = state.result;
      game.isCompleted = true;
      setResult(state.result);
      setElapsedSeconds(state.result.elapsedSeconds);
      setShowVictoryModal(true);
    }
  }

  incomingHandlerRef.current = (message) => {
    const game = gameRef.current;
    const boardEvents = ['PIECE_DRAG', 'PIECE_DROP', 'BOARD_SYNC'];
    if (boardEvents.includes(message.type) && message.roundSeed !== game.roundSeed) return;
    if (message.type === 'ROOM_STATE') {
      void applyRoomState(message.state);
    } else if (message.type === 'HELLO' && message.player) {
      const previous = game.players.get(message.player.id);
      game.players.set(message.player.id, {
        ...message.player,
        score: previous?.score || message.player.score || 0,
        isBot: false,
      });
      syncPlayersUI();
      if (!previous) addToast(`${message.player.name} joined the room!`, message.player.color);
    } else if (message.type === 'CURSOR') {
      const player = game.players.get(message.senderId);
      if (player)
        Object.assign(player, {
          x: message.x,
          y: message.y,
          name: message.name,
          color: message.color,
        });
    } else if (message.type === 'PIECE_DRAG') {
      const piece = game.pieces[message.pieceId];
      if (!piece || game.isCompleted) return;
      const dx = message.x - piece.x;
      const dy = message.y - piece.y;
      game.groups.get(piece.groupId)?.forEach((id) => {
        const member = game.pieces[id];
        Object.assign(member, {
          x: member.x + dx,
          y: member.y + dy,
          lockedBy: message.senderId,
          lockedColor: message.color,
          lockedName: message.name,
        });
      });
    } else if (message.type === 'PIECE_DROP') {
      const piece = game.pieces[message.pieceId];
      if (piece) {
        game.groups.get(piece.groupId)?.forEach((id) => {
          game.pieces[id].lockedBy = null;
        });
        checkAndSnapGroup(piece, game.players.get(message.senderId));
      }
      if (message.pieces) applySerializedPieces(message.pieces);
    } else if (message.type === 'BOARD_SYNC') {
      if (message.players)
        message.players.forEach((player) => game.players.set(player.id, { ...player }));
      syncPlayersUI();
      if (!game.activeDragPiece) applySerializedPieces(message.pieces);
    } else if (message.type === 'PING') {
      game.pings.push({
        x: message.x,
        y: message.y,
        color: message.color,
        name: message.name,
        radius: 6,
        maxRadius: 95,
        alpha: 1,
      });
      playSound('ping');
    } else if (message.type === 'CHAT') {
      setChatMessages((previous) => [
        ...previous,
        { id: crypto.randomUUID(), sender: message.name, color: message.color, text: message.text },
      ]);
    } else if (message.type === 'EMOTE') {
      game.particles.push({
        x: game.boardW * 0.5,
        y: game.boardH * 0.75,
        vx: 0,
        vy: -95,
        life: 1.8,
        maxLife: 1.8,
        color: message.color,
        emote: `${message.emote} ${message.name}`,
      });
    } else if (message.type === 'PLAYER_LEFT') {
      game.players.delete(message.playerId);
      game.pieces.forEach((piece) => {
        if (piece.lockedBy === message.playerId) piece.lockedBy = null;
      });
      syncPlayersUI();
    }
  };

  useEffect(() => {
    if (activeScreen !== 'board') return;
    const timer = setInterval(() => {
      const game = gameRef.current;
      if (game.startedAt && !game.isCompleted)
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - game.startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeScreen]);

  useEffect(() => {
    if (!result) return;
    setElapsedSeconds(result.elapsedSeconds);
    if (network.isHostRef.current)
      broadcastNetworkEvent({ type: 'ROOM_STATE', state: snapshotRef.current() });
  }, [result, broadcastNetworkEvent]);

  async function startRound(imageSrc = activeImageSrc, title = activePuzzleTitle) {
    if (!network.isHostRef.current) return;
    const game = gameRef.current;
    const seed = crypto.randomUUID();
    const generation = roomGenerationRef.current;
    Object.assign(game, {
      roundSeed: seed,
      imageSrc,
      puzzleTitle: title,
      roomCode,
      startedAt: Date.now(),
      isCompleted: false,
      result: null,
      bestCombo: 0,
      streakCount: 0,
      lastSnapTimestamp: 0,
    });
    game.pieces = [];
    game.groups.clear();
    game.players.forEach((player) => {
      player.score = 0;
    });
    setResult(null);
    setShowVictoryModal(false);
    setElapsedSeconds(0);
    setComboStreak({ count: 0, player: '' });
    setIsLoading(true);
    syncPlayersUI();
    try {
      const built = await buildPuzzleBoard(imageSrc, targetPieceCount, seed);
      if (built) broadcastNetworkEvent({ type: 'ROOM_STATE', state: snapshotRef.current() });
    } catch {
      addToast('Could not load this puzzle. Choose another image and try again.', '#f87171');
    } finally {
      if (generation === roomGenerationRef.current && game.roundSeed === seed) setIsLoading(false);
    }
  }

  async function handleLaunchGameFromLanding() {
    setActiveScreen('board');
    if (network.isHostRef.current) {
      await startRound();
    } else {
      broadcastNetworkEvent({ type: 'REQUEST_STATE' });
      if (remoteStateRef.current) await applyRoomState(remoteStateRef.current);
      requestAnimationFrame(engine.centerCamera);
    }
  }

  async function handleCustomPhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !network.isHostRef.current) return;
    try {
      const image = await compressImageFileToDataUrl(file);
      const title = file.name.replace(/\.[^.]+$/, '') || 'Custom Photo';
      setCustomImageSrc(image);
      setCustomImageTitle(title);
      setPuzzleId('custom-photo');
      setPhotoSyncBanner(`“${title}” is ready to play with your friends.`);
      if (activeScreen === 'board') await startRound(image, title);
    } catch {
      addToast('Could not read this image. Please choose another photo.', '#f87171');
    }
    event.target.value = '';
  }

  async function handleCopyShareLink() {
    try {
      await copyText(getShareableRoomLink());
      setCopiedLinkNotice(true);
      addToast('Invite link copied!');
      setTimeout(() => setCopiedLinkNotice(false), 2500);
    } catch {
      addToast('Could not copy. Select and copy the invite link manually.', '#f87171');
    }
  }

  function joinRoom(value) {
    const code = normalizeRoomCode(value);
    if (!isValidRoomCode(code)) {
      addToast('Enter a room code with at least 3 letters or numbers.', '#f87171');
      return false;
    }
    setRoomCode(code);
    setJoinedViaLinkBanner(true);
    setActiveScreen('landing');
    return true;
  }

  function createNewRoom() {
    setRoomCode(createRoomCode());
    setJoinedViaLinkBanner(false);
    setActiveScreen('landing');
    setShowLeftMenu(false);
    setShowMultiplayerModal(false);
    setShowChatDrawer(false);
    setShowHelpModal(false);
    setShowPreview(false);
    setShowVictoryModal(false);
  }

  const controls = useBoardControls({
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
  });
  useCanvasRenderer({
    activeScreen,
    canvasRef,
    gameRef,
    botPace: 'normal',
    edgesOnly,
    showGuideFrame,
    myPlayerId,
    checkAndSnapGroup,
    isHostRef: network.isHostRef,
    broadcastNetworkEvent,
    serializePieces,
  });

  return {
    ...engine,
    ...controls,
    gameRef,
    canvasRef,
    activeScreen,
    setActiveScreen,
    roomCode,
    joinedViaLinkBanner,
    createNewRoom,
    joinRoom,
    isHost,
    reconnect: network.reconnect,
    connectionStatus,
    myPlayerId,
    myName,
    setMyName,
    myColor,
    setMyColor,
    puzzleId,
    setPuzzleId,
    customImageSrc,
    setCustomImageSrc,
    customImageTitle,
    photoSyncBanner,
    setPhotoSyncBanner,
    targetPieceCount,
    setTargetPieceCount,
    botCount,
    setBotCount,
    selectedCatalog,
    activeImageSrc,
    activePuzzleTitle,
    surfaceIndex,
    setSurfaceIndex,
    edgesOnly,
    setEdgesOnly,
    showGuideFrame,
    setShowGuideFrame,
    showPreview,
    setShowPreview,
    pingMode,
    setPingMode,
    soundEnabled,
    setSoundEnabled,
    showLeftMenu,
    setShowLeftMenu,
    showMultiplayerModal,
    setShowMultiplayerModal,
    showChatDrawer,
    setShowChatDrawer,
    showHelpModal,
    setShowHelpModal,
    showVictoryModal,
    setShowVictoryModal,
    progressStats,
    elapsedSeconds,
    comboStreak,
    playersList,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    toasts,
    addToast,
    zoomPercent,
    previewPos,
    setPreviewPos,
    result,
    isLoading,
    copiedLinkNotice,
    getShareableRoomLink,
    handleCopyShareLink,
    handleCustomPhotoUpload,
    handleLaunchGameFromLanding,
    restartGame: startRound,
    broadcastNetworkEvent,
    formatTimer,
  };
}
