// src/context/GamePauseContext.jsx

import {
  createContext,
  useContext,
} from "react";

const GamePauseContext = createContext(false);

export function GamePauseProvider({
  paused = false,
  children,
}) {
  return (
    <GamePauseContext.Provider value={paused}>
      {children}
    </GamePauseContext.Provider>
  );
}

export function useGamePaused() {
  return useContext(GamePauseContext);
}

