import React from 'react';
import { Share2, Image as ImageIcon, Sparkles, RotateCcw, X } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';

export default function GameMenu() {
  const {
    restartGame,
    isHost,
    result,
    setShowVictoryModal,
    createNewRoom,
    showLeftMenu,
    setShowLeftMenu,
    setActiveScreen,
    handleCopyShareLink,
    gameRef,
    checkAndSnapGroup,
    myPlayerId,
    broadcastNetworkEvent,
    serializePieces,
    setShowHelpModal,
  } = useGame();
  return (
    showLeftMenu && (
      <div className="absolute top-2 left-2 w-64 bg-[#2e302b]/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/15 p-3 z-30 text-xs space-y-1">
        <div className="font-semibold text-gray-100 pb-2 mb-1 border-b border-white/10 flex items-center justify-between">
          <span>পাজল খেলার মেনু</span>
          <button onClick={() => setShowLeftMenu(false)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => {
            setShowLeftMenu(false);
            setActiveScreen('landing');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-gray-200 transition cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>শুরুর পাতা / পাজল বদলান</span>
        </button>
        <button
          onClick={() => {
            setShowLeftMenu(false);
            handleCopyShareLink();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-gray-200 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span>আমন্ত্রণ লিংক কপি করুন</span>
        </button>
        <button
          onClick={() => {
            setShowLeftMenu(false);
            const loose = gameRef.current.pieces.find((p) => !p.inPlace && !p.lockedBy);
            if (loose) {
              const g = gameRef.current;
              const grp = g.groups.get(loose.groupId);
              const dx = loose.c * g.pieceW - loose.x;
              const dy = loose.r * g.pieceH - loose.y;
              if (grp) {
                grp.forEach((pid) => {
                  g.pieces[pid].x += dx;
                  g.pieces[pid].y += dy;
                });
              }
              checkAndSnapGroup(loose, g.players.get(myPlayerId));
              broadcastNetworkEvent({ type: 'BOARD_SYNC', pieces: serializePieces() });
            }
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sky-300 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>সাহায্য নিন: একটি টুকরো মিলিয়ে দিন</span>
        </button>
        <button
          disabled={!isHost}
          onClick={() => {
            setShowLeftMenu(false);
            restartGame();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/20 text-left text-red-300 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>
            {isHost ? 'সবাই মিলে নতুন করে শুরু করুন' : 'শুধু রুমের মালিক আবার শুরু করতে পারেন'}
          </span>
        </button>
        {result && (
          <button
            onClick={() => {
              setShowLeftMenu(false);
              setShowVictoryModal(true);
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-amber-300 hover:bg-white/10"
          >
            ফলাফল দেখুন ও শেয়ার করুন
          </button>
        )}
        <button
          onClick={() => {
            setShowLeftMenu(false);
            setShowHelpModal(true);
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-gray-200 hover:bg-white/10"
        >
          যেভাবে খেলবেন
        </button>
        <button
          onClick={createNewRoom}
          className="w-full rounded-lg px-3 py-2 text-left text-emerald-300 hover:bg-white/10"
        >
          নতুন রুম খুলুন
        </button>
      </div>
    )
  );
}
