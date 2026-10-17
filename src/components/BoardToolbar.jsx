import React from 'react';
import {
  Share2,
  Image as ImageIcon,
  Eye,
  HelpCircle,
  Volume2,
  VolumeX,
  MessageSquare,
  Compass,
  Check,
  Layers,
  Flame,
  Radio,
  Plus,
  Minus,
  Menu,
} from 'lucide-react';
import { SURFACE_THEMES } from '../data/puzzles.js';
import { useGame } from '../context/GameContext.jsx';

export default function BoardToolbar() {
  const {
    setShowLeftMenu,
    setActiveScreen,
    activePuzzleTitle,
    progressStats,
    comboStreak,
    arrangeLoosePiecesOnPerimeter,
    centerCamera,
    broadcastNetworkEvent,
    serializePieces,
    addToast,
    setEdgesOnly,
    edgesOnly,
    setShowPreview,
    showPreview,
    setPingMode,
    pingMode,
    setShowGuideFrame,
    showGuideFrame,
    surfaceIndex,
    setSurfaceIndex,
    applyZoom,
    zoomPercent,
    playersList,
    handleCopyShareLink,
    copiedLinkNotice,
    setShowMultiplayerModal,
    roomCode,
    setShowChatDrawer,
    setSoundEnabled,
    soundEnabled,
    formatTimer,
    elapsedSeconds,
    setShowHelpModal,
  } = useGame();
  return (
    <header className="h-11 bg-[#3a3c36] border-b border-black/40 px-2.5 flex items-center justify-between gap-2 z-30 shrink-0 shadow-md">
      {/* Left: Menu + Back to Landing Page + Progress */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          onClick={() => setShowLeftMenu((v) => !v)}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 flex items-center justify-center transition cursor-pointer"
          title="Game Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveScreen('landing')}
          className="h-8 px-2.5 rounded bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          title="Open Landing Page / Change Puzzle or Upload Photo"
        >
          <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-[170px]">{activePuzzleTitle}</span>
        </button>

        {/* Progress Bar Pill */}
        <div className="hidden md:flex items-center gap-2 bg-black/30 px-2.5 py-1 rounded-full text-xs border border-white/10">
          <div className="w-16 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressStats.pct}%` }}
            />
          </div>
          <span className="font-medium text-gray-200 tabular-nums">
            {progressStats.connected}/{progressStats.total} ({progressStats.pct}%)
          </span>
        </div>

        {/* Live Team Combo Streak Pill */}
        {comboStreak.count >= 2 && (
          <div className="hidden lg:flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{comboStreak.count}x Team Streak!</span>
          </div>
        )}
      </div>

      {/* Center: Classic Multiplayer Puzzle Game Controls + Sonar Ping Tool */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => {
            arrangeLoosePiecesOnPerimeter();
            centerCamera();
            broadcastNetworkEvent({ type: 'BOARD_SYNC', pieces: serializePieces() });
            addToast('Loose pieces arranged neatly around border', '#38bdf8');
          }}
          className="h-8 px-2.5 rounded hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          title="Arrange Loose Pieces Around Perimeter"
        >
          <span>✋</span>
          <span className="hidden lg:inline">Arrange</span>
        </button>

        <button
          onClick={() => setEdgesOnly((v) => !v)}
          className={`h-8 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            edgesOnly
              ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="Show Only Edge / Border Pieces"
        >
          <Layers className="w-4 h-4" />
          <span className="hidden lg:inline">Edges</span>
        </button>

        <button
          onClick={() => setShowPreview((v) => !v)}
          className={`h-8 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            showPreview
              ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="Show/Hide Box Lid Reference Image"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden lg:inline">Preview</span>
        </button>

        <button
          onClick={() => setPingMode((v) => !v)}
          className={`h-8 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            pingMode
              ? 'bg-pink-500/30 text-pink-300 ring-1 ring-pink-400'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="Ping Spot on Board to Alert Friends (or Double-Click Board)"
        >
          <Radio className="w-4 h-4 text-pink-400" />
          <span className="hidden xl:inline">Ping</span>
        </button>

        <button
          onClick={() => setShowGuideFrame((v) => !v)}
          className={`h-8 px-2 rounded text-xs font-medium hidden sm:flex items-center gap-1 transition cursor-pointer ${
            showGuideFrame
              ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="Toggle Target Frame Guide"
        >
          <Compass className="w-4 h-4" />
          <span className="hidden xl:inline">Frame</span>
        </button>

        <button
          onClick={() => {
            const next = (surfaceIndex + 1) % SURFACE_THEMES.length;
            setSurfaceIndex(next);
            addToast(`Felt surface: ${SURFACE_THEMES[next].name}`, '#e5e7eb');
          }}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="Change Felt Surface Color"
        >
          🎨
        </button>

        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center bg-black/25 rounded-md px-1 py-0.5 border border-white/10">
          <button
            onClick={() => applyZoom(0.84)}
            className="h-6 px-1.5 rounded hover:bg-white/15 text-xs cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={centerCamera}
            className="h-6 px-1.5 rounded hover:bg-white/15 text-[11px] font-mono cursor-pointer"
            title="Reset Camera Zoom"
          >
            {zoomPercent}%
          </button>
          <button
            onClick={() => applyZoom(1.18)}
            className="h-6 px-1.5 rounded hover:bg-white/15 text-xs cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right: Active Players + One-Click Invite Link + Chat + Timer */}
      <div className="flex items-center gap-1.5">
        {/* Player Pills */}
        <div className="hidden xl:flex items-center gap-1 mr-1">
          {playersList.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1 bg-black/35 border border-white/15 px-2 py-0.5 rounded-full text-xs"
              title={`${p.name}: ${p.score || 0} pieces connected`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="max-w-[65px] truncate">{p.name}</span>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">
                {p.score || 0}
              </span>
            </div>
          ))}
        </div>

        {/* One-Click Copy Invite Link Button */}
        <button
          onClick={handleCopyShareLink}
          className="h-8 px-2.5 rounded-md bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          title="Copy invite link"
        >
          {copiedLinkNotice ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{copiedLinkNotice ? 'Copied!' : 'Invite Link'}</span>
        </button>

        {/* Room & Co-Op Settings Modal Button */}
        <button
          onClick={() => setShowMultiplayerModal(true)}
          className="h-8 px-2.5 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          title="Room settings"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{roomCode}</span>
          <span className="bg-black/30 px-1.5 py-0.5 rounded text-[11px]">
            {playersList.length}
          </span>
        </button>

        <button
          onClick={() => setShowChatDrawer((v) => !v)}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="Team Chat & Scoreboard"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSoundEnabled((v) => !v)}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="Toggle Sound Effects"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4 opacity-50" />
          )}
        </button>

        <div className="font-mono text-sm font-medium text-gray-100 px-1 tabular-nums">
          {formatTimer(elapsedSeconds)}
        </div>

        <button
          onClick={() => setShowHelpModal(true)}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="How to Play With Friends"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
