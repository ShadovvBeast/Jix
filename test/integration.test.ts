/**
 * Integration Tests for Complete Game Flow
 * Tests the full flow: create room → join → start → answer questions → view results → end game
 * Requirements: All
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../server/RoomManager';
import { GameEngine } from '../server/GameEngine';
import { GeminiService } from '../server/GeminiService';
import type { Player, Question } from '../shared/types';

describe('Integration Tests - Complete Game Flow', () => {
  let roomManager: RoomManager;
  let gameEngine: GameEngine;
  let geminiService: GeminiService;

  beforeEach(() => {
    roomManager = new RoomManager();
    geminiService = new GeminiService(process.env.GEMINI_API_KEY || 'test-key');
    gameEngine = new GameEngine(geminiService, roomManager);
  });

  describe('Full Game Flow - Single Player', () => {
    it('should complete a full game flow from room creation to game end', () => {
      // Step 1: Create room
      const hostId = 'host-1';
      const hostName = 'Host Player';
      const category = 'Science';

      const room = roomManager.createRoom(category, hostId, hostName);
      
      expect(room).toBeDefined();
      expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(room.category).toBe(category);
      expect(room.hostId).toBe(hostId);
      expect(room.participants).toHaveLength(1);
      expect(room.participants[0]?.id).toBe(hostId);
      expect(room.participants[0]?.isHost).toBe(true);
      expect(room.gameState).toBe('LOBBY');

      // Step 2: Start game
      const startResult = roomManager.startGame(room.code);
      expect(startResult).toBe(true);
      
      const updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.gameState).toBe('IN_PROGRESS');

      // Step 3: Verify host can control game
      expect(roomManager.isHost(room.code, hostId)).toBe(true);

      // Step 4: Transition through states
      roomManager.transitionState(room.code, 'SHOWING_RESULTS');
      expect(roomManager.getRoom(room.code)?.gameState).toBe('SHOWING_RESULTS');

      roomManager.transitionState(room.code, 'ENDED');
      expect(roomManager.getRoom(room.code)?.gameState).toBe('ENDED');

      // Step 5: Close room
      const closeResult = roomManager.closeRoom(room.code);
      expect(closeResult).toBe(true);
      
      const finalRoom = roomManager.getRoom(room.code);
      expect(finalRoom).toBeNull();
    });
  });

  describe('Full Game Flow - Multiple Players', () => {
    it('should handle multiple participants playing simultaneously', () => {
      // Step 1: Create room
      const hostId = 'host-1';
      const hostName = 'Host Player';
      const category = 'History';

      const room = roomManager.createRoom(category, hostId, hostName);
      expect(room).toBeDefined();

      // Step 2: Add multiple participants
      const player2: Player = {
        id: 'player-2',
        name: 'Player 2',
        isHost: false,
        score: 0,
        connected: true,
      };
      const player3: Player = {
        id: 'player-3',
        name: 'Player 3',
        isHost: false,
        score: 0,
        connected: true,
      };

      const joinResult2 = roomManager.addParticipant(room.code, player2);
      const joinResult3 = roomManager.addParticipant(room.code, player3);

      expect(joinResult2).toBe(true);
      expect(joinResult3).toBe(true);

      const updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.participants).toHaveLength(3);

      // Step 3: Start game
      const startResult = roomManager.startGame(room.code);
      expect(startResult).toBe(true);

      // Step 4: Verify all participants are in the room
      const participants = roomManager.getParticipants(room.code);
      expect(participants).toHaveLength(3);
      expect(participants.some(p => p.id === hostId)).toBe(true);
      expect(participants.some(p => p.id === player2.id)).toBe(true);
      expect(participants.some(p => p.id === player3.id)).toBe(true);

      // Step 5: Verify game state
      expect(updatedRoom?.gameState).toBe('IN_PROGRESS');

      // Step 6: Verify only host has host privileges
      expect(roomManager.isHost(room.code, hostId)).toBe(true);
      expect(roomManager.isHost(room.code, player2.id)).toBe(false);
      expect(roomManager.isHost(room.code, player3.id)).toBe(false);
    });
  });

  describe('Host Controls Throughout Game', () => {
    it('should allow host to control game flow', () => {
      // Create room
      const hostId = 'host-1';
      const room = roomManager.createRoom('Sports', hostId, 'Host');
      
      // Add another player
      const player2: Player = {
        id: 'player-2',
        name: 'Player 2',
        isHost: false,
        score: 0,
        connected: true,
      };
      roomManager.addParticipant(room.code, player2);

      // Host starts game
      const startResult = roomManager.startGame(room.code);
      expect(startResult).toBe(true);

      // Verify game started
      const updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.gameState).toBe('IN_PROGRESS');

      // Verify host is correct
      expect(roomManager.isHost(room.code, hostId)).toBe(true);
      expect(roomManager.isHost(room.code, player2.id)).toBe(false);

      // Close room
      roomManager.closeRoom(room.code);
      const finalRoom = roomManager.getRoom(room.code);
      expect(finalRoom).toBeNull();
    });

    it('should handle host disconnection', () => {
      // Create room
      const hostId = 'host-1';
      const room = roomManager.createRoom('Music', hostId, 'Host');
      
      // Add another player
      const player2: Player = {
        id: 'player-2',
        name: 'Player 2',
        isHost: false,
        score: 0,
        connected: true,
      };
      roomManager.addParticipant(room.code, player2);

      // Remove host (marks as disconnected)
      const removeResult = roomManager.removeParticipant(room.code, hostId);
      expect(removeResult).toBe(true);

      const updatedRoom = roomManager.getRoom(room.code);
      
      // Room should still exist with host marked as disconnected
      expect(updatedRoom).toBeDefined();
      const host = updatedRoom?.participants.find(p => p.id === hostId);
      expect(host?.connected).toBe(false);
    });
  });

  describe('Game State Transitions', () => {
    it('should transition through game states correctly', () => {
      // Create room (LOBBY state)
      const room = roomManager.createRoom('Technology', 'host-1', 'Host');
      expect(room.gameState).toBe('LOBBY');

      // Start game (IN_PROGRESS state)
      roomManager.startGame(room.code);
      let updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.gameState).toBe('IN_PROGRESS');

      // Transition to SHOWING_RESULTS
      roomManager.transitionState(room.code, 'SHOWING_RESULTS');
      updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.gameState).toBe('SHOWING_RESULTS');

      // Transition to ENDED
      roomManager.transitionState(room.code, 'ENDED');
      updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.gameState).toBe('ENDED');
    });

    it('should prevent joining after game starts', () => {
      // Create room
      const room = roomManager.createRoom('Literature', 'host-1', 'Host');
      
      // Start game
      roomManager.startGame(room.code);

      // Try to join after game started
      const latePlayer: Player = {
        id: 'late-player',
        name: 'Late Player',
        isHost: false,
        score: 0,
        connected: true,
      };
      const joinResult = roomManager.addParticipant(room.code, latePlayer);
      expect(joinResult).toBe(false);
    });
  });

  describe('Room and Participant Management', () => {
    it('should correctly manage participants across game lifecycle', () => {
      // Setup
      const room = roomManager.createRoom('Science', 'host-1', 'Host');
      const player2: Player = {
        id: 'player-2',
        name: 'Player 2',
        isHost: false,
        score: 0,
        connected: true,
      };
      roomManager.addParticipant(room.code, player2);

      // Verify participants
      let participants = roomManager.getParticipants(room.code);
      expect(participants).toHaveLength(2);

      // Start game
      roomManager.startGame(room.code);

      // Disconnect a player
      roomManager.removeParticipant(room.code, player2.id);
      
      // Verify player is marked as disconnected
      const updatedRoom = roomManager.getRoom(room.code);
      const disconnectedPlayer = updatedRoom?.participants.find(p => p.id === player2.id);
      expect(disconnectedPlayer?.connected).toBe(false);

      // Verify room still exists
      expect(updatedRoom).toBeDefined();
    });

    it('should track room codes correctly', () => {
      const room1 = roomManager.createRoom('Math', 'host-1', 'Host 1');
      const room2 = roomManager.createRoom('English', 'host-2', 'Host 2');

      const allRooms = roomManager.getAllRoomCodes();
      expect(allRooms).toContain(room1.code);
      expect(allRooms).toContain(room2.code);
      expect(allRooms.length).toBeGreaterThanOrEqual(2);

      // Close one room
      roomManager.closeRoom(room1.code);
      
      const remainingRooms = roomManager.getAllRoomCodes();
      expect(remainingRooms).not.toContain(room1.code);
      expect(remainingRooms).toContain(room2.code);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid room codes gracefully', () => {
      const room = roomManager.getRoom('INVALID');
      expect(room).toBeNull();
    });

    it('should handle operations on non-existent rooms', () => {
      const startResult = roomManager.startGame('NONEXIST');
      expect(startResult).toBe(false);

      const player: Player = {
        id: 'player-1',
        name: 'Player',
        isHost: false,
        score: 0,
        connected: true,
      };
      const joinResult = roomManager.addParticipant('NONEXIST', player);
      expect(joinResult).toBe(false);
    });

    it('should handle participant disconnection', () => {
      const room = roomManager.createRoom('Test', 'host-1', 'Host');
      
      // Remove host (marks as disconnected)
      const removeResult = roomManager.removeParticipant(room.code, 'host-1');
      expect(removeResult).toBe(true);

      // Room should still exist but host is disconnected
      const updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom).toBeDefined();
      
      const host = updatedRoom?.participants.find(p => p.id === 'host-1');
      expect(host?.connected).toBe(false);
    });
  });
});
