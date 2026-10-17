import React, { useEffect, useState } from 'react';
import { Check, Copy, Plus, Users } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';

export default function RoomControls() {
  const {
    roomCode,
    joinRoom,
    createNewRoom,
    getShareableRoomLink,
    copiedLinkNotice,
    handleCopyShareLink,
  } = useGame();
  const [draft, setDraft] = useState(roomCode);
  useEffect(() => setDraft(roomCode), [roomCode]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Users size={15} /> Your room
        </span>
        <button
          onClick={createNewRoom}
          className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
        >
          <Plus size={14} /> New room
        </button>
      </div>
      <div className="text-center">
        <p className="font-mono text-2xl font-black tracking-[0.12em] text-slate-900">{roomCode}</p>
        <p className="mt-1 text-xs text-slate-500">Send an invite and solve it together.</p>
      </div>
      <button
        onClick={handleCopyShareLink}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
      >
        {copiedLinkNotice ? <Check size={16} /> : <Copy size={16} />}
        {copiedLinkNotice ? 'Invite link copied!' : 'Copy invite link'}
      </button>
      <input
        readOnly
        aria-label="Room invite link"
        value={getShareableRoomLink()}
        onFocus={(event) => event.target.select()}
        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-[11px] text-slate-500"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          joinRoom(draft);
        }}
        className="border-t border-slate-200 pt-3"
      >
        <label htmlFor="room-code" className="mb-2 block text-xs font-medium text-slate-600">
          Have a friend’s room code?
        </label>
        <div className="flex gap-2">
          <input
            id="room-code"
            value={draft}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
            maxLength={18}
            placeholder="ABCD-EFGH"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold uppercase text-slate-900 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
          >
            Join
          </button>
        </div>
      </form>
    </div>
  );
}
