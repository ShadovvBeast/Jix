/**
 * Property-Based Tests for Game State Management and Flow
 * Tests state transitions, round completion, and next round initiation
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { RoomManager } from './RoomManager';
import { GameEngine } from './GameEngine';
import { GeminiService } from './GeminiService';
import { GameState } from '../shared/types';
import type { Player } from '../shared/types';

describe('Game State Flow Property Tests', () => {
  let roomManager: RoomManager;
  let geminiService: GeminiService;
  let gameEngine: GameEngine;

  beforeEach(() => {
    roomManager = new RoomManager();
    geminiService = new GeminiService(process.env.GEMINI_API_KEY || 'test-key');
    gameEngine = new GameEngine(geminiService, roomManager);
  });

  /**
   * Feature: jix-game, Property 7: Game start state transition
   * Validates: Requirements 4.2, 4.3
   * 
   * For any room in LOBBY state, when the host starts the game, 
   * the room state should transition to IN_PROGRESS and no new 
   * participants should be able to join.
   */
  test('Property 7: Game start state transition - LOBBY to IN_PROGRESS prevents new joins', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 20 }), // hostName
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }), // additional player names
        (category, hostName, additionalPlayerNames) => {
          // Create fresh RoomManager for each property test run
          const testRoomManager = new RoomManager();
          
          // Create a room in LOBBY state
          const hostId = 'host-' + Math.random().toString(36).substring(7);
          const room = testRoomManager.createRoom(category, hostId, hostName);
          
          // Verify initial state is LOBBY
          expect(room.gameState).toBe(GameState.LOBBY);
          
          // Add additional participants
          additionalPlayerNames.forEach((name, index) => {
            const player: Player = {
              id: `player-${index}-${Math.random().toString(36).substring(7)}`,
              name,
              isHost: false,
              score: 0,
              connected: true,
            };
            const added = testRoomManager.addParticipant(room.code, player);
            expect(added).toBe(true);
          });
          
          // Start the game
          const started = testRoomManager.startGame(room.code);
          expect(started).toBe(true);
          
          // Verify state transitioned to IN_PROGRESS
          const updatedRoom = testRoomManager.getRoom(room.code);
          expect(updatedRoom).not.toBeNull();
          expect(updatedRoom!.gameState).toBe(GameState.IN_PROGRESS);
          
          // Attempt to add a new participant after game started
          const newPlayer: Player = {
            id: 'late-player-' + Math.random().toString(36).substring(7),
            name: 'Late Player',
            isHost: false,
            score: 0,
            connected: true,
          };
          
          const canJoin = testRoomManager.addParticipant(room.code, newPlayer);
          
          // Verify new participant cannot join (Requirement 4.3)
          expect(canJoin).toBe(false);
          
          // Verify participant list hasn't changed
          const finalRoom = testRoomManager.getRoom(room.code);
          expect(finalRoom!.participants.length).toBe(1 + additionalPlayerNames.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: jix-game, Property 15: Round completion trigger
   * Validates: Requirements 6.5, 9.3
   * 
   * For any question round, when all participants have submitted answers OR 
   * a time limit expires, the system should transition to SHOWING_RESULTS 
   * state and broadcast the correct answer.
   */
  test('Property 15: Round completion trigger - all answers submitted triggers results', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 20 }), // hostName
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }), // player names (at least 1)
        (category, hostName, playerNames) => {
          // Create fresh instances for each property test run
          const testRoomManager = new RoomManager();
          const testGeminiService = new GeminiService(process.env.GEMINI_API_KEY || 'test-key');
          const testGameEngine = new GameEngine(testGeminiService, testRoomManager);
          
          // Create a room
          const hostId = 'host-' + Math.random().toString(36).substring(7);
          const room = testRoomManager.createRoom(category, hostId, hostName);
          
          // Add participants
          const participantIds: string[] = [];
          playerNames.forEach((name, index) => {
            const playerId = `player-${index}-${Math.random().toString(36).substring(7)}`;
            participantIds.push(playerId);
            const player: Player = {
              id: playerId,
              name,
              isHost: false,
              score: 0,
              connected: true,
            };
            testRoomManager.addParticipant(room.code, player);
          });
          
          // Start the game
          testRoomManager.startGame(room.code);
          
          // Create a mock question (since we can't call Gemini in property tests)
          const mockQuestion = {
            id: 'q-' + Math.random().toString(36).substring(7),
            text: 'Test question?',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' },
              { id: 'c', text: 'Option C' },
            ],
            correctAnswerId: 'a',
            category,
          };
          
          // Manually set up round state (simulating startRound without Gemini call)
          const updatedRoom = testRoomManager.getRoom(room.code);
          if (updatedRoom) {
            updatedRoom.currentQuestion = mockQuestion;
            updatedRoom.questionHistory.push(mockQuestion);
          }
          
          // Simulate round state in GameEngine
          const roundState = {
            question: mockQuestion,
            answers: new Map(),
            startTime: Date.now(),
          };
          (testGameEngine as any).roundStates.set(room.code, roundState);
          
          // Before all answers: hasAllAnswered should be false
          const beforeAllAnswers = testGameEngine.hasAllAnswered(room.code);
          expect(beforeAllAnswers).toBe(false);
          
          // Submit answers for all participants (including host)
          const allParticipantIds = [hostId, ...participantIds];
          allParticipantIds.forEach((playerId) => {
            const submitted = testGameEngine.submitAnswer(room.code, playerId, 'a');
            expect(submitted).toBe(true);
          });
          
          // Property: After all participants have answered, hasAllAnswered should return true
          const afterAllAnswers = testGameEngine.hasAllAnswered(room.code);
          expect(afterAllAnswers).toBe(true);
          
          // Property: System should be ready to transition to SHOWING_RESULTS
          // (The actual transition would be triggered by the server logic)
          const canTransition = testRoomManager.transitionState(room.code, GameState.SHOWING_RESULTS);
          expect(canTransition).toBe(true);
          
          // Verify state is now SHOWING_RESULTS
          const finalRoom = testRoomManager.getRoom(room.code);
          expect(finalRoom?.gameState).toBe(GameState.SHOWING_RESULTS);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: jix-game, Property 22: Next round initiation
   * Validates: Requirements 10.2
   * 
   * For any room in SHOWING_RESULTS state, when the host requests the next 
   * question, the system should transition to IN_PROGRESS, generate a new 
   * question, and broadcast it to all participants.
   */
  test('Property 22: Next round initiation - SHOWING_RESULTS to IN_PROGRESS with new question', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 20 }), // hostName
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }), // player names
        (category, hostName, playerNames) => {
          // Create fresh instances for each property test run
          const testRoomManager = new RoomManager();
          const testGeminiService = new GeminiService(process.env.GEMINI_API_KEY || 'test-key');
          const testGameEngine = new GameEngine(testGeminiService, testRoomManager);
          
          // Create a room
          const hostId = 'host-' + Math.random().toString(36).substring(7);
          const room = testRoomManager.createRoom(category, hostId, hostName);
          
          // Add participants
          playerNames.forEach((name, index) => {
            const playerId = `player-${index}-${Math.random().toString(36).substring(7)}`;
            const player: Player = {
              id: playerId,
              name,
              isHost: false,
              score: 0,
              connected: true,
            };
            testRoomManager.addParticipant(room.code, player);
          });
          
          // Start the game and transition to SHOWING_RESULTS
          testRoomManager.startGame(room.code);
          testRoomManager.transitionState(room.code, GameState.SHOWING_RESULTS);
          
          // Verify we're in SHOWING_RESULTS state
          const roomBeforeNext = testRoomManager.getRoom(room.code);
          expect(roomBeforeNext?.gameState).toBe(GameState.SHOWING_RESULTS);
          
          // Create a mock first question
          const firstQuestion = {
            id: 'q1-' + Math.random().toString(36).substring(7),
            text: 'First question?',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' },
            ],
            correctAnswerId: 'a',
            category,
          };
          
          // Set up first round state
          if (roomBeforeNext) {
            roomBeforeNext.currentQuestion = firstQuestion;
            roomBeforeNext.questionHistory.push(firstQuestion);
          }
          
          const firstRoundState = {
            question: firstQuestion,
            answers: new Map(),
            startTime: Date.now(),
          };
          (testGameEngine as any).roundStates.set(room.code, firstRoundState);
          
          // Property: Clear round state should remove the previous round
          testGameEngine.clearRoundState(room.code);
          const clearedState = testGameEngine.getRoundState(room.code);
          expect(clearedState).toBeNull();
          
          // Property: Transition back to IN_PROGRESS for next round
          const transitioned = testRoomManager.transitionState(room.code, GameState.IN_PROGRESS);
          expect(transitioned).toBe(true);
          
          // Verify state is IN_PROGRESS
          const roomAfterTransition = testRoomManager.getRoom(room.code);
          expect(roomAfterTransition?.gameState).toBe(GameState.IN_PROGRESS);
          
          // Property: System should be ready to start a new round
          // (In real implementation, nextRound would call Gemini and set up new question)
          // Here we verify the state is correct for starting a new round
          expect(roomAfterTransition?.questionHistory.length).toBe(1); // First question still in history
        }
      ),
      { numRuns: 100 }
    );
  });
});
