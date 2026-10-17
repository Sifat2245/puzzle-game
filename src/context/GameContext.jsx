import React, { createContext, useContext } from 'react';
import { usePuzzleGame } from '../hooks/usePuzzleGame.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const game = usePuzzleGame();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
