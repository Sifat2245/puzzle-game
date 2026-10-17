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
    <div className="landing-room">
      <div className="landing-room-heading">
        <span>
          <Users size={15} aria-hidden="true" /> আপনার রুম
        </span>
        <button onClick={createNewRoom} className="landing-new-room">
          <Plus size={14} /> নতুন রুম
        </button>
      </div>
      <div className="landing-room-code">
        <p>{roomCode}</p>
        <span>এই কোডেই জমুক পাজলের আড্ডা!</span>
      </div>
      <button onClick={handleCopyShareLink} className="landing-copy-link">
        {copiedLinkNotice ? <Check size={16} /> : <Copy size={16} />}
        {copiedLinkNotice ? 'আমন্ত্রণ লিংক কপি হয়েছে!' : 'আমন্ত্রণ লিংক কপি করুন'}
      </button>
      <input
        readOnly
        aria-label="রুমের আমন্ত্রণ লিংক"
        value={getShareableRoomLink()}
        onFocus={(event) => event.target.select()}
        className="landing-input landing-room-link"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          joinRoom(draft);
        }}
        className="landing-join-form"
      >
        <label htmlFor="room-code">বন্ধুর রুম কোড আছে?</label>
        <div className="landing-join-inputs">
          <input
            id="room-code"
            value={draft}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
            maxLength={18}
            placeholder="ABCD-EFGH"
            autoComplete="off"
            spellCheck={false}
            className="landing-input landing-room-code-input"
          />
          <button type="submit" className="landing-join-button">
            ঢুকে পড়ুন
          </button>
        </div>
      </form>
    </div>
  );
}
