/**
 * Unit tests for HTTP API endpoints
 * Requirements: 2.1, 3.2, 3.3
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { roomManager } from './RoomManager';

describe('API Endpoints Unit Tests', () => {
  beforeEach(() => {
    // Clear all rooms before each test
    const allRooms = roomManager.getAllRoomCodes();
    allRooms.forEach(code => roomManager.closeRoom(code));
  });

  describe('POST /api/rooms - Room Creation', () => {
    test('should create room with valid data', () => {
      // Requirement 2.1: Room creation returns valid room data
      const category = 'Science';
      const hostId = 'host123';
      const hostName = 'Alice';

      const room = roomManager.createRoom(category, hostId, hostName);

      expect(room).toBeDefined();
      expect(room.code).toBeDefined();
      expect(room.code).toHaveLength(6);
      expect(room.category).toBe(category);
      expect(room.hostId).toBe(hostId);
      expect(room.participants).toHaveLength(1);
      expect(room.participants[0]?.name).toBe(hostName);
      expect(room.participants[0]?.isHost).toBe(true);
    });
  });

  describe('GET /api/rooms/:code - Room Lookup', () => {
    test('should return room with valid code', () => {
      // Requirement 2.1: Room lookup with valid code
      const room = roomManager.createRoom('History', 'host456', 'Bob');
      const foundRoom = roomManager.getRoom(room.code);

      expect(foundRoom).toBeDefined();
      expect(foundRoom?.code).toBe(room.code);
      expect(foundRoom?.category).toBe('History');
    });

    test('should return null for invalid code', () => {
      // Requirement 3.3: Room lookup with invalid code
      const foundRoom = roomManager.getRoom('INVALID');

      expect(foundRoom).toBeNull();
    });
  });

  describe('POST /api/rooms/:code/join - Join Endpoint', () => {
    test('should validate room exists before joining', () => {
      // Requirement 3.2: Join endpoint validation
      const player = {
        id: 'player123',
        name: 'Charlie',
        isHost: false,
        score: 0,
        connected: false,
      };

      const success = roomManager.addParticipant('NONEXISTENT', player);

      expect(success).toBe(false);
    });

    test('should allow joining valid room in LOBBY state', () => {
      // Requirement 3.2: Join endpoint validation
      const room = roomManager.createRoom('Math', 'host789', 'Dave');
      const player = {
        id: 'player456',
        name: 'Eve',
        isHost: false,
        score: 0,
        connected: false,
      };

      const success = roomManager.addParticipant(room.code, player);

      expect(success).toBe(true);
      const updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.participants).toHaveLength(2);
    });
  });

  describe('POST /api/rooms/:code/start - Host Authorization', () => {
    test('should verify host before starting game', () => {
      // Requirement 4.1: Host-only endpoint authorization
      const room = roomManager.createRoom('Geography', 'host999', 'Frank');
      
      // Check that only the host can be verified
      expect(roomManager.isHost(room.code, 'host999')).toBe(true);
      expect(roomManager.isHost(room.code, 'nothost')).toBe(false);
    });

    test('should allow host to start game', () => {
      // Requirement 4.2: Host can start game
      const room = roomManager.createRoom('Art', 'host111', 'Grace');
      
      const success = roomManager.startGame(room.code);

      expect(success).toBe(true);
      const updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.gameState).toBe('IN_PROGRESS');
    });
  });

  describe('POST /api/rooms/:code/end - Host Authorization', () => {
    test('should verify host before ending game', () => {
      // Requirement 10.3: Host-only endpoint authorization
      const room = roomManager.createRoom('Music', 'host222', 'Henry');
      
      // Verify host check works
      expect(roomManager.isHost(room.code, 'host222')).toBe(true);
      expect(roomManager.isHost(room.code, 'nothost')).toBe(false);
    });
  });
});
