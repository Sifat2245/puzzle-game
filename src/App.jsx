import React from 'react';
import { GameProvider, useGame } from './context/GameContext.jsx';
import LandingPage from './components/LandingPage.jsx';
import BoardToolbar from './components/BoardToolbar.jsx';
import PuzzleWorkspace from './components/PuzzleWorkspace.jsx';
import RoomModal from './components/RoomModal.jsx';
import HelpModal from './components/HelpModal.jsx';
import VictoryModal from './components/VictoryModal.jsx';

function Game() {
  const game = useGame();
  if (game.activeScreen === 'landing') return <LandingPage />;

  return (
    <div className="flex h-dvh w-full select-none flex-col overflow-hidden bg-[#2c2e2a] text-gray-100">
      <BoardToolbar />
      <PuzzleWorkspace />
      <RoomModal />
      <HelpModal />
      {game.showVictoryModal && game.result && (
        <VictoryModal
          result={game.result}
          isHost={game.isHost}
          onClose={() => game.setShowVictoryModal(false)}
          onPlayAgain={() => game.restartGame()}
          onNewRoom={game.createNewRoom}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
