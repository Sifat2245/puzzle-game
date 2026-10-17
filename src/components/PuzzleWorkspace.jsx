import React from 'react';
import { Upload } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';
import GameMenu from './GameMenu.jsx';
import ChatDrawer from './ChatDrawer.jsx';
import PuzzlePreview from './PuzzlePreview.jsx';

export default function PuzzleWorkspace() {
  const {
    isHost,
    isLoading,
    gameRef: workspaceGameRef,
    canvasRef,
    onCanvasPointerDown,
    screenToWorld,
    triggerBoardPing,
    onCanvasPointerMove,
    onCanvasPointerUp,
    applyZoom,
    pingMode,
    toasts,
    gameRef,
    myColor,
    myName,
    broadcastNetworkEvent,
    handleCustomPhotoUpload,
  } = useGame();
  return (
    <main className="relative flex-1 w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
          if (e.button === 0) onCanvasPointerDown(e.clientX, e.clientY);
        }}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
          triggerBoardPing(world.x, world.y);
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            onCanvasPointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) {
            onCanvasPointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={onCanvasPointerUp}
        onWheel={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const factor = e.deltaY < 0 ? 1.12 : 0.89;
          applyZoom(factor, e.clientX - rect.left, e.clientY - rect.top);
        }}
        className={`block w-full h-full ${
          pingMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {(isLoading || !workspaceGameRef.current.pieces.length) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40">
          <p role="status" className="rounded-xl bg-slate-900 px-5 py-3 text-sm text-white">
            {isLoading ? 'Preparing your puzzle…' : 'Waiting for the host to start a puzzle…'}
          </p>
        </div>
      )}

      {/* Live Toast Feed (Bottom Left) */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 z-20 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-black/75 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/15 shadow-lg"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Bottom Center Quick Reaction & Host Photo Sync Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#2d2f2b]/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-lg z-20">
        {['🧩', '🎉', '🔥', '👏', '👀'].map((emote) => (
          <button
            key={emote}
            onClick={() => {
              gameRef.current.particles.push({
                x: gameRef.current.boardW * 0.5,
                y: gameRef.current.boardH * 0.75,
                vx: (Math.random() - 0.5) * 30,
                vy: -95,
                life: 1.8,
                maxLife: 1.8,
                color: myColor,
                emote: `${emote} ${myName}`,
              });
              broadcastNetworkEvent({ type: 'EMOTE', emote, name: myName, color: myColor });
            }}
            className="hover:scale-125 transition px-1 text-base cursor-pointer"
            title={`Send ${emote} reaction`}
          >
            {emote}
          </button>
        ))}
        <div className="h-3.5 w-[1px] bg-white/15 mx-1" />
        <label
          className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 transition cursor-pointer flex items-center gap-1"
          title={
            isHost
              ? 'Choose a photo for everyone in this room'
              : 'The host chooses the room’s photo'
          }
        >
          <Upload className="w-3 h-3" />
          <span>Your photo</span>
          <input
            type="file"
            disabled={!isHost}
            accept="image/*"
            onChange={handleCustomPhotoUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Box Lid Reference Preview Floating Window */}
      <PuzzlePreview />

      {/* Left Hamburger Menu Drawer */}
      <GameMenu />

      {/* Right Team Chat & Live Players Drawer */}
      <ChatDrawer />
    </main>
  );
}
