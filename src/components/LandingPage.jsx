import React from 'react';
import RoomControls from './RoomControls.jsx';
import { Users, Upload, Sparkles, Play, Grid } from 'lucide-react';
import { PUZZLE_CATALOG } from '../data/puzzles.js';
import { useGame } from '../context/GameContext.jsx';

export default function LandingPage() {
  const {
    isHost,
    reconnect,
    isLoading,
    toasts,
    connectionStatus,
    joinedViaLinkBanner,
    roomCode,
    customImageSrc,
    customImageTitle,
    selectedCatalog,
    handleLaunchGameFromLanding,
    activeImageSrc,
    activePuzzleTitle,
    targetPieceCount,
    puzzleId,
    setPuzzleId,
    setCustomImageSrc,
    setPhotoSyncBanner,
    handleCustomPhotoUpload,
    photoSyncBanner,
    myName,
    setMyName,
    myColor,
    setMyColor,
    setTargetPieceCount,
    botCount,
    setBotCount,
  } = useGame();
  return (
    <div className="min-h-screen w-full bg-[#e8e9e4] text-gray-800 flex flex-col font-sans select-none overflow-y-auto">
      {/* Classic Multiplayer Puzzle Game Textured Blue Header Banner */}
      <header
        className="px-4 sm:px-8 py-4 text-white border-b-4 border-white/40 shadow-md"
        style={{ background: 'linear-gradient(135deg, #5d8aa8 0%, #4a7594 50%, #3b627e 100%)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                Multiplayer Puzzle Game
              </h1>
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                Multiplayer Co-Op
              </span>
            </div>
            <p className="text-xs sm:text-sm text-sky-100 italic mt-0.5">
              A little teamwork. A lot of pieces. One great time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span role="status">{connectionStatus}</span>
              <button onClick={reconnect} className="ml-1 underline underline-offset-2">
                Reconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Auto-Detected Invite Link Banner if opened with ?room=CODE */}
      {joinedViaLinkBanner && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow flex items-center justify-center gap-3">
          <Users className="w-4 h-4 shrink-0" />
          <span>
            You opened a friend&apos;s invite link for <strong>Room {roomCode}</strong>! Enter your
            name and click <strong>Join puzzle</strong> to play together.
          </span>
        </div>
      )}

      {/* Main Landing Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Featured puzzle and photo upload */}
        <section className="lg:col-span-7 bg-[#f7f7f5] rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-300/80 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {customImageSrc ? customImageTitle : selectedCatalog.fullTitle}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {customImageSrc
                  ? 'Your photo, your puzzle. Make a memory together.'
                  : selectedCatalog.description}
              </p>
            </div>

            <button
              disabled={isLoading}
              onClick={handleLaunchGameFromLanding}
              className="bg-[#4b93d1] hover:bg-[#3a7fb8] text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isHost ? 'Play this puzzle' : 'Join puzzle'}</span>
            </button>
          </div>

          {/* White Framed Box-Lid Hero Preview (Matches Multiplayer Puzzle Game Landing Page) */}
          <div className="bg-white p-3.5 rounded-xl shadow-md border border-gray-200 mb-5 relative group">
            <img
              src={activeImageSrc}
              alt={activePuzzleTitle}
              className="w-full h-60 sm:h-72 object-cover rounded-lg"
            />
            <div className="absolute bottom-6 right-6 bg-black/75 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-sky-400" />
              <span>{targetPieceCount} Interlocking Pieces</span>
            </div>
          </div>

          {/* Preset Puzzle Gallery + Host Custom Photo Sync Uploader */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Choose a Featured Puzzle or Upload Your Own Photo
              </span>
              {customImageSrc && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  ✓ Your photo is selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {PUZZLE_CATALOG.map((item) => {
                const isSelected = !customImageSrc && puzzleId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      setPuzzleId(item.id);
                      setCustomImageSrc(null);
                      setPhotoSyncBanner('');
                    }}
                    className={`group rounded-xl overflow-hidden border-2 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-sky-600 ring-2 ring-sky-400 shadow-sm'
                        : 'border-gray-200 hover:border-sky-400'
                    }`}
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-20 sm:h-24 object-cover group-hover:scale-105 transition"
                    />
                    <div className="bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 truncate">
                      {item.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Host Custom Photo Sync Upload Box */}
            <label className="mt-2 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-sky-600/50 bg-sky-50/80 hover:bg-sky-100/80 text-sky-900 cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold">
                    Turn your own photo into a puzzle
                  </div>
                  <div className="text-[11px] text-sky-700">
                    {isHost
                      ? 'Choose a photo to play with everyone in your room.'
                      : 'The host chooses the photo for this room.'}
                  </div>
                </div>
              </div>
              <span className="bg-white text-sky-800 border border-sky-300 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 shadow-sm">
                Choose Image
              </span>
              <input
                type="file"
                disabled={!isHost}
                accept="image/*"
                onChange={handleCustomPhotoUpload}
                className="hidden"
              />
            </label>

            {photoSyncBanner && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{photoSyncBanner}</span>
              </div>
            )}
          </div>
        </section>

        {/* Room, player profile, and puzzle settings */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-300/80 flex flex-col space-y-4">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Play With Friends Setup
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
              ROOM: {roomCode}
            </span>
          </div>

          <RoomControls />

          {/* 2. Your Player Profile */}
          <div>
            <label
              htmlFor="player-name"
              className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5"
            >
              2. Your Display Name &amp; Cursor Color
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={18}
                id="player-name"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                placeholder="Your display name"
                className="min-w-0 flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-sky-600"
              />
              <input
                type="color"
                value={myColor}
                onChange={(e) => setMyColor(e.target.value)}
                className="w-11 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white"
                title="Pick your live cursor & piece highlight color"
              />
            </div>
          </div>

          {/* 3. Piece Count Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              3. Puzzle Piece Count
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { count: 24, label: 'About 24 pieces', sub: 'Quick Co-Op Sprint' },
                { count: 48, label: 'About 48 pieces', sub: 'Classic puzzle' },
                { count: 96, label: 'About 96 pieces', sub: 'Team Challenge' },
                { count: 150, label: 'About 150 pieces', sub: 'Expert challenge' },
              ].map((preset) => (
                <button
                  key={preset.count}
                  type="button"
                  disabled={!isHost}
                  onClick={() => setTargetPieceCount(preset.count)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold text-left transition cursor-pointer ${
                    targetPieceCount === preset.count
                      ? 'border-sky-600 bg-sky-50 text-sky-900 ring-1 ring-sky-500'
                      : 'border-gray-300 hover:border-sky-500 text-gray-800'
                  }`}
                >
                  <div>{preset.label}</div>
                  <div className="text-[11px] text-gray-500 font-normal">{preset.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label
              htmlFor="bot-count"
              className="mb-2 flex justify-between text-xs font-bold text-slate-600"
            >
              <span>Bot helpers</span>
              <span>{botCount} active</span>
            </label>
            <input
              id="bot-count"
              type="range"
              min={0}
              max={4}
              disabled={!isHost}
              value={botCount}
              onChange={(event) => setBotCount(Number(event.target.value))}
              className="w-full accent-emerald-600"
            />
            <p className="text-[11px] text-slate-500">
              {isHost
                ? 'Set to 0 to play with friends only.'
                : 'The host chooses the puzzle and bot helpers.'}
            </p>
          </div>

          {/* Launch Multiplayer Table CTA */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleLaunchGameFromLanding}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {isLoading ? 'Preparing puzzle…' : isHost ? 'Let’s play together' : 'Join puzzle'}
            </span>
          </button>
        </section>
      </main>
      <div
        role="status"
        className="fixed bottom-4 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            {toast.text}
          </p>
        ))}
      </div>
    </div>
  );
}
