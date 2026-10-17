import React from 'react';
import { X } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';
import Modal from './Modal.jsx';

export default function HelpModal() {
  const { showHelpModal, setShowHelpModal, roomCode } = useGame();
  return (
    showHelpModal && (
      <Modal
        titleId="help-title"
        onClose={() => setShowHelpModal(false)}
        className="max-w-md p-5 space-y-3 text-xs"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <h3 id="help-title" className="text-base font-bold">
            Playing with friends
          </h3>
          <button
            aria-label="Close help"
            onClick={() => setShowHelpModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="space-y-2 text-gray-300 leading-relaxed">
          <li>
            <strong className="text-white">1. Shareable Room Link:</strong> Click{' '}
            <strong>Invite Link</strong> in the top bar to copy your room URL (
            <code className="bg-black/40 px-1 rounded">?room={roomCode}</code>) and send it to
            friends.
          </li>
          <li>
            <strong className="text-white">2. Your own photo:</strong> The host can upload a photo
            from the lobby or the bottom bar to turn it into a puzzle for the whole room.
          </li>
          <li>
            <strong className="text-white">3. Sonar Board Ping:</strong> Double-click anywhere on
            the felt table (or click <strong>Ping</strong>) to send a glowing sonar ring to show
            teammates where a piece goes.
          </li>
        </ul>
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowHelpModal(false)}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </Modal>
    )
  );
}
