/**
 * Shared types and utilities for the Jix multiplayer quiz game
 * This module exports all shared interfaces, types, and utility functions
 * used across both client and server components.
 */

// Export all types
export type {
  Player,
  Room,
  Question,
  AnswerOption,
  PlayerAnswer,
  PlayerScore,
  RoundResults,
  GameEvent,
  GeminiRequest,
  GeminiQuestionSchema,
} from './types';

export { GameState } from './types';

// Export all utilities
export { generateRoomCode, encodeQRCode, decodeQRCode } from './utils';
