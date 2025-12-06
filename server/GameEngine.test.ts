/**
 * Unit tests for GameEngine service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './GameEngine';
import { GeminiService } from './GeminiService';
import { RoomManager } from './RoomManager';
import type { Question } from '../shared/types';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let geminiService: GeminiService;
  let roomManager: RoomManager;
  let roomCode: string;

  beforeEach(() => {
    // Initialize services
    geminiService = new GeminiService('test-api-key');
    roomManager = new RoomManager();
    gameEngine = new GameEngine(geminiService, roomManager);

    // Create a test room
    const room = roomManager.createRoom('Science', 'host-1', 'Host Player');
    roomCode = room.code;

    // Add some participants
    roomManager.addParticipant(roomCode, {
      id: 'player-2',
      name: 'Player 2',
      isHost: false,
      score: 0,
      connected: true,
    });
    roomManager.addParticipant(roomCode, {
      id: 'player-3',
      name: 'Player 3',
      isHost: false,
      score: 0,
      connected: true,
    });
  });

  describe('submitAnswer', () => {
    it('should record answer with timestamp and correctness', async () => {
      // Mock a question
      const mockQuestion: Question = {
        id: 'q1',
        text: 'What is 2+2?',
        options: [
          { id: 'a', text: '3' },
          { id: 'b', text: '4' },
          { id: 'c', text: '5' },
        ],
        correctAnswerId: 'b',
        category: 'Math',
      };

      // Manually set up round state for testing
      const room = roomManager.getRoom(roomCode);
      if (room) {
        room.currentQuestion = mockQuestion;
      }
      
      // Start round with mock question
      const roundState = {
        question: mockQuestion,
        answers: new Map(),
        startTime: Date.now(),
      };
      (gameEngine as any).roundStates.set(roomCode, roundState);

      // Submit answer
      const result = gameEngine.submitAnswer(roomCode, 'host-1', 'b');

      expect(result).toBe(true);
      
      const state = gameEngine.getRoundState(roomCode);
      expect(state).not.toBeNull();
      
      if (state) {
        const answer = state.answers.get('host-1');
        expect(answer).toBeDefined();
        expect(answer?.playerId).toBe('host-1');
        expect(answer?.answerId).toBe('b');
        expect(answer?.isCorrect).toBe(true);
        expect(answer?.timestamp).toBeGreaterThan(0);
      }
    });

    it('should reject duplicate answer submissions (answer immutability)', async () => {
      // Mock a question
      const mockQuestion: Question = {
        id: 'q1',
        text: 'What is 2+2?',
        options: [
          { id: 'a', text: '3' },
          { id: 'b', text: '4' },
        ],
        correctAnswerId: 'b',
        category: 'Math',
      };

      const room = roomManager.getRoom(roomCode);
      if (room) {
        room.currentQuestion = mockQuestion;
      }

      const roundState = {
        question: mockQuestion,
        answers: new Map(),
        startTime: Date.now(),
      };
      (gameEngine as any).roundStates.set(roomCode, roundState);

      // First submission should succeed
      const firstResult = gameEngine.submitAnswer(roomCode, 'host-1', 'b');
      expect(firstResult).toBe(true);

      // Second submission should fail (answer immutability)
      const secondResult = gameEngine.submitAnswer(roomCode, 'host-1', 'a');
      expect(secondResult).toBe(false);

      // Verify original answer is unchanged
      const state = gameEngine.getRoundState(roomCode);
      const answer = state?.answers.get('host-1');
      expect(answer?.answerId).toBe('b'); // Still 'b', not 'a'
    });
  });

  describe('calculateScores', () => {
    it('should increment score for correct answers', () => {
      const mockQuestion: Question = {
        id: 'q1',
        text: 'Test question',
        options: [
          { id: 'a', text: 'Wrong' },
          { id: 'b', text: 'Correct' },
        ],
        correctAnswerId: 'b',
        category: 'Test',
      };

      const roundState = {
        question: mockQuestion,
        answers: new Map(),
        startTime: Date.now(),
      };
      (gameEngine as any).roundStates.set(roomCode, roundState);

      // Submit correct answer
      gameEngine.submitAnswer(roomCode, 'host-1', 'b');

      // Calculate scores
      const scores = gameEngine.calculateScores(roomCode);

      const hostScore = scores.find(s => s.playerId === 'host-1');
      expect(hostScore?.score).toBe(1); // Score incremented
    });

    it('should preserve score for incorrect answers', () => {
      const mockQuestion: Question = {
        id: 'q1',
        text: 'Test question',
        options: [
          { id: 'a', text: 'Wrong' },
          { id: 'b', text: 'Correct' },
        ],
        correctAnswerId: 'b',
        category: 'Test',
      };

      const roundState = {
        question: mockQuestion,
        answers: new Map(),
        startTime: Date.now(),
      };
      (gameEngine as any).roundStates.set(roomCode, roundState);

      // Submit incorrect answer
      gameEngine.submitAnswer(roomCode, 'host-1', 'a');

      // Calculate scores
      const scores = gameEngine.calculateScores(roomCode);

      const hostScore = scores.find(s => s.playerId === 'host-1');
      expect(hostScore?.score).toBe(0); // Score unchanged
    });
  });

  describe('rankScores', () => {
    it('should rank players from highest to lowest score', () => {
      // Set up players with different scores
      const room = roomManager.getRoom(roomCode);
      if (room && room.participants[0] && room.participants[1] && room.participants[2]) {
        room.participants[0].score = 5; // host-1
        room.participants[1].score = 10; // player-2
        room.participants[2].score = 3; // player-3
      }

      const scores = gameEngine.calculateScores(roomCode);

      // Verify ranking order
      expect(scores[0]?.score).toBe(10); // Highest
      expect(scores[0]?.rank).toBe(1);
      
      expect(scores[1]?.score).toBe(5); // Middle
      expect(scores[1]?.rank).toBe(2);
      
      expect(scores[2]?.score).toBe(3); // Lowest
      expect(scores[2]?.rank).toBe(3);
    });

    it('should handle tied scores correctly', () => {
      const room = roomManager.getRoom(roomCode);
      if (room && room.participants[0] && room.participants[1] && room.participants[2]) {
        room.participants[0].score = 5; // host-1
        room.participants[1].score = 5; // player-2 (tied)
        room.participants[2].score = 3; // player-3
      }

      const scores = gameEngine.calculateScores(roomCode);

      // Both tied players should have rank 1
      expect(scores[0]?.rank).toBe(1);
      expect(scores[1]?.rank).toBe(1);
      
      // Next player should have rank 3 (not 2)
      expect(scores[2]?.rank).toBe(3);
    });
  });

  describe('hasAllAnswered', () => {
    it('should return true when all connected participants have answered', () => {
      const mockQuestion: Question = {
        id: 'q1',
        text: 'Test',
        options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
        correctAnswerId: 'a',
        category: 'Test',
      };

      const roundState = {
        question: mockQuestion,
        answers: new Map(),
        startTime: Date.now(),
      };
      (gameEngine as any).roundStates.set(roomCode, roundState);

      // All participants answer
      gameEngine.submitAnswer(roomCode, 'host-1', 'a');
      gameEngine.submitAnswer(roomCode, 'player-2', 'b');
      gameEngine.submitAnswer(roomCode, 'player-3', 'a');

      expect(gameEngine.hasAllAnswered(roomCode)).toBe(true);
    });

    it('should return false when not all participants have answered', () => {
      const mockQuestion: Question = {
        id: 'q1',
        text: 'Test',
        options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
        correctAnswerId: 'a',
        category: 'Test',
      };

      const roundState = {
        question: mockQuestion,
        answers: new Map(),
        startTime: Date.now(),
      };
      (gameEngine as any).roundStates.set(roomCode, roundState);

      // Only one participant answers
      gameEngine.submitAnswer(roomCode, 'host-1', 'a');

      expect(gameEngine.hasAllAnswered(roomCode)).toBe(false);
    });
  });

  describe('endRound', () => {
    it('should return round results with correct answer and player answers', () => {
      const mockQuestion: Question = {
        id: 'q1',
        text: 'Test',
        options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
        correctAnswerId: 'a',
        category: 'Test',
      };

      const roundState = {
        question: mockQuestion,
        answers: new Map(),
        startTime: Date.now(),
      };
      (gameEngine as any).roundStates.set(roomCode, roundState);

      gameEngine.submitAnswer(roomCode, 'host-1', 'a');
      gameEngine.submitAnswer(roomCode, 'player-2', 'b');

      const results = gameEngine.endRound(roomCode);

      expect(results.question).toEqual(mockQuestion);
      expect(results.correctAnswerId).toBe('a');
      expect(results.playerAnswers).toHaveLength(2);
      expect(results.updatedScores).toHaveLength(3);
    });
  });
});
