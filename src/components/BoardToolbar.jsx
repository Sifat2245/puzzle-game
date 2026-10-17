import { bnNumber } from '../utils/bangla.js';
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
  Users,
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
    <header className="game-toolbar flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-black/40 bg-[#3a3c36] px-2 py-1.5 shadow-md z-30 xl:flex-nowrap">
      {/* Left: Menu + Back to Landing Page + Progress */}
      <div className="order-1 flex min-w-0 flex-1 items-center gap-1.5">
        <button
          onClick={() => setShowLeftMenu((v) => !v)}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 flex items-center justify-center transition cursor-pointer"
          title="খেলার মেনু"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveScreen('landing')}
          className="h-8 px-2.5 rounded bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          title="শুরুর পাতায় যান বা পাজল বদলান"
        >
          <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="hidden truncate max-w-[100px] sm:block xl:max-w-[150px]">
            {activePuzzleTitle}
          </span>
        </button>

        {/* Progress Bar Pill */}
        <div
          className="flex shrink-0 items-center gap-2 bg-black/30 px-2 py-1 rounded-full text-[10px] sm:text-xs border border-white/10"
          aria-label="পাজল কতটা মিলেছে"
        >
          <div className="hidden 2xl:block w-12 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressStats.pct}%` }}
            />
          </div>
          <span className="font-medium text-gray-200 tabular-nums">
            {bnNumber(progressStats.connected)}/{bnNumber(progressStats.total)} (
            {bnNumber(progressStats.pct)}%)
          </span>
        </div>

        {/* Live Team Combo Streak Pill */}
        {comboStreak.count >= 2 && (
          <div className="hidden lg:flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{bnNumber(comboStreak.count)}× দলের কম্বো!</span>
          </div>
        )}
      </div>

      {/* Center: Classic Multiplayer Puzzle Game Controls + Sonar Ping Tool */}
      <div className="order-3 flex w-full items-center justify-between gap-0.5 border-t border-white/10 pt-1 sm:gap-1 xl:order-2 xl:w-auto xl:justify-center xl:border-0 xl:pt-0">
        <button
          onClick={() => {
            arrangeLoosePiecesOnPerimeter();
            centerCamera();
            broadcastNetworkEvent({ type: 'BOARD_SYNC', pieces: serializePieces() });
            addToast('টুকরোগুলো চারপাশে গুছিয়ে দেওয়া হয়েছে', '#38bdf8');
          }}
          className="h-8 px-2.5 rounded hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          title="ছড়ানো টুকরোগুলো গুছিয়ে দিন"
        >
          <span>✋</span>
          <span className="hidden 2xl:inline">গোছান</span>
        </button>

        <button
          onClick={() => setEdgesOnly((v) => !v)}
          className={`h-8 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            edgesOnly
              ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="শুধু ধারের টুকরো দেখুন"
        >
          <Layers className="w-4 h-4" />
          <span className="hidden 2xl:inline">ধার</span>
        </button>

        <button
          onClick={() => setShowPreview((v) => !v)}
          className={`h-8 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            showPreview
              ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="আসল ছবিটি দেখুন বা লুকান"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden 2xl:inline">আসল ছবি</span>
        </button>

        <button
          onClick={() => setPingMode((v) => !v)}
          className={`h-8 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            pingMode
              ? 'bg-pink-500/30 text-pink-300 ring-1 ring-pink-400'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="বন্ধুকে জায়গা দেখান; দুবার চাপলেও হবে"
        >
          <Radio className="w-4 h-4 text-pink-400" />
          <span className="hidden 2xl:inline">দেখান</span>
        </button>

        <button
          onClick={() => setShowGuideFrame((v) => !v)}
          className={`h-8 px-2 rounded text-xs font-medium hidden sm:flex items-center gap-1 transition cursor-pointer ${
            showGuideFrame
              ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
              : 'hover:bg-white/15 text-gray-200'
          }`}
          title="পাজলের ফ্রেম দেখুন বা লুকান"
        >
          <Compass className="w-4 h-4" />
          <span className="hidden 2xl:inline">ফ্রেম</span>
        </button>

        <button
          onClick={() => {
            const next = (surfaceIndex + 1) % SURFACE_THEMES.length;
            setSurfaceIndex(next);
            addToast(`টেবিলের রং: ${SURFACE_THEMES[next].name}`, '#e5e7eb');
          }}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="টেবিলের রং বদলান"
        >
          🎨
        </button>

        {/* Zoom Controls */}
        <div className="zoom-controls flex shrink-0 items-center bg-black/25 rounded-md px-1 py-0.5 border border-white/10">
          <button
            onClick={() => applyZoom(0.84)}
            className="h-6 px-1.5 rounded hover:bg-white/15 text-xs cursor-pointer"
            title="ছোট করে দেখুন"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={centerCamera}
            className="h-6 px-1.5 rounded hover:bg-white/15 text-[11px] font-mono cursor-pointer"
            title="সব টুকরো একসঙ্গে দেখুন"
          >
            {bnNumber(zoomPercent)}%
          </button>
          <button
            onClick={() => applyZoom(1.18)}
            className="h-6 px-1.5 rounded hover:bg-white/15 text-xs cursor-pointer"
            title="বড় করে দেখুন"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right: Active Players + One-Click Invite Link + Chat + Timer */}
      <div className="order-2 flex shrink-0 items-center gap-1 xl:order-3">
        {/* Player Pills */}
        <div className="hidden 2xl:flex items-center gap-1 mr-1">
          {playersList.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1 bg-black/35 border border-white/15 px-2 py-0.5 rounded-full text-xs"
              title={`${p.name}: ${bnNumber(p.score || 0)} পয়েন্ট`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="max-w-[65px] truncate">{p.name}</span>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">
                {bnNumber(p.score || 0)}
              </span>
            </div>
          ))}
        </div>

        {/* One-Click Copy Invite Link Button */}
        <button
          onClick={handleCopyShareLink}
          className="h-8 px-2.5 rounded-md bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          title="আমন্ত্রণ লিংক কপি করুন"
        >
          {copiedLinkNotice ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {copiedLinkNotice ? 'কপি হয়েছে!' : 'বন্ধুকে ডাকুন'}
          </span>
        </button>

        {/* Room & Co-Op Settings Modal Button */}
        <button
          onClick={() => setShowMultiplayerModal(true)}
          className="h-8 px-2.5 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          title="রুমের সেটিংস"
        >
          <Users className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">{roomCode}</span>
          <span className="hidden sm:inline bg-black/30 px-1.5 py-0.5 rounded text-[11px]">
            {bnNumber(playersList.length)}
          </span>
        </button>

        <button
          onClick={() => setShowChatDrawer((v) => !v)}
          className="h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="দলের আড্ডা ও স্কোর"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSoundEnabled((v) => !v)}
          className="hidden sm:block h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="শব্দ চালু বা বন্ধ করুন"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4 opacity-50" />
          )}
        </button>

        <div className="hidden sm:block font-mono text-sm font-medium text-gray-100 px-1 tabular-nums">
          {formatTimer(elapsedSeconds)}
        </div>

        <button
          onClick={() => setShowHelpModal(true)}
          className="hidden sm:block h-8 px-2 rounded hover:bg-white/15 text-gray-200 transition cursor-pointer"
          title="যেভাবে খেলবেন"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
