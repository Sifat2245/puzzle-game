import React from 'react';
import { X } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';

export default function ChatDrawer() {
  const {
    showChatDrawer,
    roomCode,
    setShowChatDrawer,
    playersList,
    chatMessages,
    chatInput,
    setChatInput,
    setChatMessages,
    myName,
    myColor,
    broadcastNetworkEvent,
  } = useGame();
  return (
    showChatDrawer && (
      <div
        className="absolute top-2 right-2 w-80 max-w-[calc(100vw-1rem)] bg-[#292b27]/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/15 flex flex-col z-30 overflow-hidden"
        style={{ height: 'min(460px, calc(100vh - 70px))' }}
      >
        <div className="px-3.5 py-2.5 bg-[#1f211d] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-200">
              Room {roomCode} Team &amp; Chat
            </span>
          </div>
          <button
            onClick={() => setShowChatDrawer(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 bg-black/25 border-b border-white/10 flex flex-col gap-1 text-xs">
          {playersList.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-1.5 font-medium text-gray-200">
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span>{p.name}</span>
              </span>
              <span className="font-mono text-emerald-400 font-semibold">{p.score || 0} pts</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          {chatMessages.map((m) => (
            <div key={m.id} className="bg-black/30 rounded-lg px-2.5 py-1.5 border border-white/5">
              {m.isSystem ? (
                <span className="text-gray-400 italic">{m.text}</span>
              ) : (
                <>
                  <span className="font-semibold" style={{ color: m.color }}>
                    {m.sender}:{' '}
                  </span>
                  <span className="text-gray-200">{m.text}</span>
                </>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const txt = chatInput.trim();
            if (!txt) return;
            setChatInput('');
            setChatMessages((prev) => [
              ...prev,
              { id: 'm-' + Date.now(), sender: myName, color: myColor, text: txt, isSystem: false },
            ]);
            broadcastNetworkEvent({ type: 'CHAT', name: myName, color: myColor, text: txt });
          }}
          className="p-2 bg-[#1f211d] border-t border-white/10 flex gap-1.5"
        >
          <input
            type="text"
            maxLength={140}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Message friends..."
            className="flex-1 bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    )
  );
}
