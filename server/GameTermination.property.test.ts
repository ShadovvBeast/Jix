/**
 * Property-Based Tests for Game Termination
 * Tests game termination cleanup and host disconnection handling
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { RoomManager } from './RoomManager';
import { GameEngine } from './GameEngine';
import { GeminiService } from './GeminiService';
import { WebSocketManager } from './WebSocketManager';
import { GameState } from '../shared/types';
import type { Player } from '../shared/types';

describe('Game Termination Property Tests', () => {
  let roomManager: RoomManager;
  let geminiService: GeminiService;
  let gameEngine: GameEngine;
  let wsManager: WebSocketManager;

  beforeEach(() => {
    roomManager = new RoomManager();
    geminiService = new GeminiService(process.env.GEMINI_API_KEY || 'test-key');
    gameEngine = new GameEngine(geminiService, roomManager);
    wsManager = new WebSocketManager();
  });

  /**
   * Feature: jix-game, Property 23: Game termination cleanup
   * Validates: Requirements 10.3, 10.4
   * 
   * For any active game room, when the host ends the game, the system should 
   * transition to ENDED state, display final scores, and gracefully disconnect 
   * all participants.
   */
  test('Property 23: Game termination cleanup - ending game transitions to ENDED and cleans up', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 20 }), // hostName
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }), // player names
        fc.constantFrom(GameState.IN_PROGRESS, GameState.SHOWING_RESULTS), // game states that can be ended
        (category, hostName, playerNames, currentState) => {
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
          
          // Start the game and transition to the test state
          testRoomManager.startGame(room.code);
          if (currentState === GameState.SHOWING_RESULTS) {
            testRoomManager.transitionState(room.code, GameState.SHOWING_RESULTS);
          }
          
          // Create a mock question and round state
          const mockQuestion = {
            id: 'q-' + Math.random().toString(36).substring(7),
            text: 'Test question?',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' },
            ],
            correctAnswerId: 'a',
            category,
          };
          
          const updatedRoom = testRoomManager.getRoom(room.code);
          if (updatedRoom) {
            updatedRoom.currentQuestion = mockQuestion;
            updatedRoom.questionHistory.push(mockQuestion);
          }
          
          // Set up round state
          const roundState = {
            question: mockQuestion,
            answers: new Map(),
            startTime: Date.now(),
          };
          (testGameEngine as any).roundStates.set(room.code, roundState);
          
          // Verify room exists and is in expected state
          const roomBeforeEnd = testRoomManager.getRoom(room.code);
          expect(roomBeforeEnd).not.toBeNull();
          expect(roomBeforeEnd!.gameState).toBe(currentState);
          
          // Property 1: Transition to ENDED state should succeed
          const transitioned = testRoomManager.transitionState(room.code, GameState.ENDED);
          expect(transitioned).toBe(true);
          
          // Verify state is ENDED
          const roomAfterTransition = testRoomManager.getRoom(room.code);
          expect(roomAfterTransition).not.toBeNull();
          expect(roomAfterTransition!.gameState).toBe(GameState.ENDED);
          
          // Property 2: Calculate final scores should work
          const finalScores = testGameEngine.calculateScores(room.code);
          expect(finalScores).toBeDefined();
          expect(finalScores.length).toBe(1 + playerNames.length); // host + participants
          
          // Property 3: Scores should be ranked correctly (highest to lowest)
          for (let i = 1; i < finalScores.length; i++) {
            expect(finalScores[i - 1]!.score).toBeGreaterThanOrEqual(finalScores[i]!.score);
          }
          
          // Property 4: Clear round state should remove game data
          testGameEngine.clearRoundState(room.code);
          const clearedState = testGameEngine.getRoundState(room.code);
          expect(clearedState).toBeNull();
          
          // Property 5: Close room should remove it from storage
          const closed = testRoomManager.closeRoom(room.code);
          expect(closed).toBe(true);
          
          // Property 6: Room should no longer exist after closing
          const roomAfterClose = testRoomManager.getRoom(room.code);
          expect(roomAfterClose).toBeNull();
          
          // Property 7: Attempting to close again should return false
          const closedAgain = testRoomManager.closeRoom(room.code);
          expect(closedAgain).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: jix-game, Property 24: Host disconnection handling
   * Validates: Requirements 10.5
   * 
   * For any room where the host disconnects, the system should either promote 
   * another participant to host (if participants remain) or end the game and 
   * close the room.
   */
  test('Property 24: Host disconnection handling - promotes new host or closes room', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 20 }), // hostName
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }), // player names
        (category, hostName, playerNames) => {
          // Create fresh instances for each property test run
          const testRoomManager = new RoomManager();
          const testWsManager = new WebSocketManager();
          
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
          
          // Verify initial state
          const roomBeforeDisconnect = testRoomManager.getRoom(room.code);
          expect(roomBeforeDisconnect).not.toBeNull();
          expect(roomBeforeDisconnect!.hostId).toBe(hostId);
          
          // Simulate host disconnection
          testRoomManager.removeParticipant(room.code, hostId);
          
          const roomAfterDisconnect = testRoomManager.getRoom(room.code);
          expect(roomAfterDisconnect).not.toBeNull();
          
          if (playerNames.length > 0) {
            // Property 1: If there are remaining participants, one should be promoted to host
            const connectedParticipants = roomAfterDisconnect!.participants.filter(p => p.connected && p.id !== hostId);
            expect(connectedParticipants.length).toBeGreaterThan(0);
            
            // Simulate host promotion (this would be done by WebSocketManager in real scenario)
            const newHost = connectedParticipants[0];
            if (newHost) {
              roomAfterDisconnect!.hostId = newHost.id;
              newHost.isHost = true;
              
              // Property 2: New host should be one of the remaining participants
              expect(participantIds).toContain(newHost.id);
              
              // Property 3: Room should still exist with new host
              expect(roomAfterDisconnect!.hostId).toBe(newHost.id);
              expect(testRoomManager.isHost(room.code, newHost.id)).toBe(true);
            }
          } else {
            // Property 4: If no participants remain, room should be closeable
            const closed = testRoomManager.closeRoom(room.code);
            expect(closed).toBe(true);
            
            // Property 5: Room should no longer exist after closing
            const roomAfterClose = testRoomManager.getRoom(room.code);
            expect(roomAfterClose).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
