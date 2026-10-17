import React from 'react';
import { Users, Copy, X } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';
import Modal from './Modal.jsx';

export default function RoomModal() {
  const {
    isHost,
    reconnect,
    createNewRoom,
    showMultiplayerModal,
    setShowMultiplayerModal,
    connectionStatus,
    getShareableRoomLink,
    handleCopyShareLink,
    myName,
    setMyName,
    botCount,
    setBotCount,
  } = useGame();
  return (
    showMultiplayerModal && (
      <Modal
        titleId="room-title"
        onClose={() => setShowMultiplayerModal(false)}
        className="max-w-lg p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 id="room-title" className="text-base font-bold">
              Your multiplayer room
            </h3>
          </div>
          <button
            aria-label="Close room settings"
            onClick={() => setShowMultiplayerModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black/30 p-3.5 rounded-xl border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase text-gray-400">Invite link</span>
            <span className="text-emerald-300 font-medium">{connectionStatus}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              aria-label="Room invite link"
              value={getShareableRoomLink()}
              className="min-w-0 flex-1 bg-black/50 border border-white/15 rounded-lg px-3 py-2 font-mono text-xs text-sky-300"
            />
            <button
              onClick={handleCopyShareLink}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-black/25 p-3 rounded-xl border border-white/10 space-y-1.5">
            <label htmlFor="room-player-name" className="text-gray-400 block">
              Your display name
            </label>
            <input
              type="text"
              id="room-player-name"
              maxLength={18}
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
            />
          </div>
          <div className="bg-black/25 p-3 rounded-xl border border-white/10 space-y-1.5">
            <span className="text-gray-400 block">Bot helpers ({botCount})</span>
            <div className="flex gap-2">
              <button
                disabled={!isHost}
                onClick={() => setBotCount((c) => Math.max(0, c - 1))}
                className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 rounded-lg cursor-pointer"
              >
                - Remove Bot
              </button>
              <button
                disabled={!isHost}
                onClick={() => setBotCount((c) => Math.min(4, c + 1))}
                className="flex-1 bg-emerald-600/80 hover:bg-emerald-500 py-1.5 rounded-lg text-white cursor-pointer"
              >
                + Add Bot
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <button onClick={reconnect} className="text-sky-300 hover:text-white">
            Reconnect
          </button>
          <button onClick={createNewRoom} className="text-emerald-300 hover:text-white">
            Create a new room
          </button>
          <button
            onClick={() => setShowMultiplayerModal(false)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </Modal>
    )
  );
}
