import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

// Import types from shared
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  connected: boolean;
}

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
  category: string;
}

interface PlayerAnswer {
  playerId: string;
  answerId: string;
  timestamp: number;
  isCorrect: boolean;
}

interface PlayerScore {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

interface RoundResults {
  question: Question;
  correctAnswerId: string;
  playerAnswers: PlayerAnswer[];
  updatedScores: PlayerScore[];
}

type GameState = 'LOBBY' | 'IN_PROGRESS' | 'SHOWING_RESULTS' | 'ENDED';

interface GameStateType {
  // User info
  playerId: string | null;
  playerName: string | null;
  
  // Room info
  roomCode: string | null;
  category: string | null;
  isHost: boolean;
  
  // Game state
  gameState: GameState;
  participants: Player[];
  currentQuestion: Question | null;
  currentAnswer: string | null;
  scores: PlayerScore[];
  roundResults: RoundResults | null;
  
  // UI state
  error: string | null;
  loading: boolean;
}

type GameAction =
  | { type: 'SET_PLAYER_INFO'; payload: { playerId: string; playerName: string } }
  | { type: 'SET_ROOM_INFO'; payload: { roomCode: string; category: string; isHost: boolean } }
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'SET_PARTICIPANTS'; payload: Player[] }
  | { type: 'ADD_PARTICIPANT'; payload: Player }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'SET_CURRENT_QUESTION'; payload: Question }
  | { type: 'SET_CURRENT_ANSWER'; payload: string }
  | { type: 'SET_SCORES'; payload: PlayerScore[] }
  | { type: 'SET_ROUND_RESULTS'; payload: RoundResults }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_GAME' };

const initialState: GameStateType = {
  playerId: null,
  playerName: null,
  roomCode: null,
  category: null,
  isHost: false,
  gameState: 'LOBBY',
  participants: [],
  currentQuestion: null,
  currentAnswer: null,
  scores: [],
  roundResults: null,
  error: null,
  loading: false,
};

const gameReducer = (state: GameStateType, action: GameAction): GameStateType => {
  switch (action.type) {
    case 'SET_PLAYER_INFO':
      return {
        ...state,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
      };
    case 'SET_ROOM_INFO':
      return {
        ...state,
        roomCode: action.payload.roomCode,
        category: action.payload.category,
        isHost: action.payload.isHost,
      };
    case 'SET_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
      };
    case 'SET_PARTICIPANTS':
      return {
        ...state,
        participants: action.payload,
      };
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== action.payload),
      };
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        currentAnswer: null,
      };
    case 'SET_CURRENT_ANSWER':
      return {
        ...state,
        currentAnswer: action.payload,
      };
    case 'SET_SCORES':
      return {
        ...state,
        scores: action.payload,
      };
    case 'SET_ROUND_RESULTS':
      return {
        ...state,
        roundResults: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'RESET_GAME':
      return initialState;
    default:
      return state;
  }
};

interface GameContextType {
  state: GameStateType;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
