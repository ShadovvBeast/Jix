/**
 * Core type definitions for the Jix multiplayer quiz game
 */

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  connected: boolean;
}

export interface Room {
  code: string;
  category: string;
  hostId: string;
  participants: Player[];
  gameState: GameState;
  currentQuestion: Question | null;
  questionHistory: Question[];
  createdAt: Date;
}

export enum GameState {
  LOBBY = 'LOBBY',
  IN_PROGRESS = 'IN_PROGRESS',
  SHOWING_RESULTS = 'SHOWING_RESULTS',
  ENDED = 'ENDED'
}

export interface Question {
  id: string;
  text: string;
  options: AnswerOption[];
  correctAnswerId: string;
  category: string;
  difficulty?: string;
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface PlayerAnswer {
  playerId: string;
  answerId: string;
  timestamp: number;
  isCorrect: boolean;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

export interface RoundResults {
  question: Question;
  correctAnswerId: string;
  playerAnswers: PlayerAnswer[];
  updatedScores: PlayerScore[];
}

// WebSocket Events
export type GameEvent =
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'GAME_STARTED' }
  | { type: 'QUESTION_RECEIVED'; question: Question }
  | { type: 'ANSWER_SUBMITTED'; playerId: string }
  | { type: 'ROUND_ENDED'; results: RoundResults }
  | { type: 'GAME_ENDED'; finalScores: PlayerScore[] }
  | { type: 'ERROR'; message: string };

// Gemini API Types
export interface GeminiRequest {
  contents: {
    parts: { text: string }[];
  }[];
  generationConfig: {
    responseMimeType: string;
    responseSchema: object;
  };
}

export interface GeminiQuestionSchema {
  type: 'object';
  properties: {
    question: { type: 'string' };
    options: {
      type: 'array';
      items: {
        type: 'object';
        properties: {
          id: { type: 'string' };
          text: { type: 'string' };
        };
      };
    };
    correctAnswerId: { type: 'string' };
  };
  required: ['question', 'options', 'correctAnswerId'];
}
