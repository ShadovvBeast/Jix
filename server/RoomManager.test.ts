/**
 * Unit tests for RoomManager service
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { RoomManager } from './RoomManager';
import { GameState } from '../shared/types';
import type { Player } from '../shared/types';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    test('creates a room with unique code', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      
      expect(room.code).toBeDefined();
      expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(room.category).toBe('Science');
      expect(room.hostId).toBe('host1');
    });

    test('creates room in LOBBY state', () => {
      const room = roomManager.createRoom('History', 'host1', 'Bob');
      
      expect(room.gameState).toBe(GameState.LOBBY);
    });

    test('adds host as first participant', () => {
      const room = roomManager.createRoom('Math', 'host1', 'Charlie');
      
      expect(room.participants).toHaveLength(1);
      expect(room.participants[0]?.id).toBe('host1');
      expect(room.participants[0]?.name).toBe('Charlie');
      expect(room.participants[0]?.isHost).toBe(true);
      expect(room.participants[0]?.score).toBe(0);
      expect(room.participants[0]?.connected).toBe(true);
    });

    test('generates unique room codes', () => {
      const room1 = roomManager.createRoom('Science', 'host1', 'Alice');
      const room2 = roomManager.createRoom('History', 'host2', 'Bob');
      
      expect(room1.code).not.toBe(room2.code);
    });
  });

  describe('getRoom', () => {
    test('retrieves existing room by code', () => {
      const created = roomManager.createRoom('Science', 'host1', 'Alice');
      const retrieved = roomManager.getRoom(created.code);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.code).toBe(created.code);
      expect(retrieved?.category).toBe('Science');
    });

    test('returns null for non-existent room', () => {
      const room = roomManager.getRoom('INVALID');
      
      expect(room).toBeNull();
    });
  });

  describe('addParticipant', () => {
    test('adds participant to existing room in LOBBY', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      
      const participant: Player = {
        id: 'player2',
        name: 'Bob',
        isHost: false,
        score: 0,
        connected: true,
      };
      
      const result = roomManager.addParticipant(room.code, participant);
      
      expect(result).toBe(true);
      
      const updatedRoom = roomManager.getRoom(room.code);
      expect(updatedRoom?.participants).toHaveLength(2);
      expect(updatedRoom?.participants[1]?.id).toBe('player2');
    });

    test('returns false for non-existent room', () => {
      const participant: Player = {
        id: 'player1',
        name: 'Bob',
        isHost: false,
        score: 0,
        connected: true,
      };
      
      const result = roomManager.addParticipant('INVALID', participant);
      
      expect(result).toBe(false);
    });

    test('prevents joining when game is IN_PROGRESS', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      roomManager.startGame(room.code);
      
      const participant: Player = {
        id: 'player2',
        name: 'Bob',
        isHost: false,
        score: 0,
        connected: true,
      };
      
      const result = roomManager.addParticipant(room.code, participant);
      
      expect(result).toBe(false);
    });

    test('updates connection status for existing participant', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      
      const participant: Player = {
        id: 'player2',
        name: 'Bob',
        isHost: false,
        score: 0,
        connected: true,
      };
      
      roomManager.addParticipant(room.code, participant);
      roomManager.removeParticipant(room.code, 'player2');
      
      const result = roomManager.addParticipant(room.code, participant);
      
      expect(result).toBe(true);
      const updatedRoom = roomManager.getRoom(room.code);
      const reconnectedPlayer = updatedRoom?.participants.find(p => p.id === 'player2');
      expect(reconnectedPlayer?.connected).toBe(true);
    });
  });

  describe('removeParticipant', () => {
    test('marks participant as disconnected', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      
      const participant: Player = {
        id: 'player2',
        name: 'Bob',
        isHost: false,
        score: 0,
        connected: true,
      };
      
      roomManager.addParticipant(room.code, participant);
      const result = roomManager.removeParticipant(room.code, 'player2');
      
      expect(result).toBe(true);
      
      const updatedRoom = roomManager.getRoom(room.code);
      const disconnectedPlayer = updatedRoom?.participants.find(p => p.id === 'player2');
      expect(disconnectedPlayer?.connected).toBe(false);
    });

    test('returns false for non-existent room', () => {
      const result = roomManager.removeParticipant('INVALID', 'player1');
      
      expect(result).toBe(false);
    });

    test('returns false for non-existent participant', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      const result = roomManager.removeParticipant(room.code, 'nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('getParticipants', () => {
    test('returns list of participants', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      
      const participant: Player = {
        id: 'player2',
        name: 'Bob',
        isHost: false,
        score: 0,
        connected: true,
      };
      
      roomManager.addParticipant(room.code, participant);
      const participants = roomManager.getParticipants(room.code);
      
      expect(participants).toHaveLength(2);
      expect(participants[0]?.name).toBe('Alice');
      expect(participants[1]?.name).toBe('Bob');
    });

    test('returns empty array for non-existent room', () => {
      const participants = roomManager.getParticipants('INVALID');
      
      expect(participants).toEqual([]);
    });
  });

  describe('transitionState', () => {
    test('allows LOBBY to IN_PROGRESS transition', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      const result = roomManager.transitionState(room.code, GameState.IN_PROGRESS);
      
      expect(result).toBe(true);
      expect(roomManager.getRoom(room.code)?.gameState).toBe(GameState.IN_PROGRESS);
    });

    test('allows IN_PROGRESS to SHOWING_RESULTS transition', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      roomManager.transitionState(room.code, GameState.IN_PROGRESS);
      
      const result = roomManager.transitionState(room.code, GameState.SHOWING_RESULTS);
      
      expect(result).toBe(true);
      expect(roomManager.getRoom(room.code)?.gameState).toBe(GameState.SHOWING_RESULTS);
    });

    test('allows SHOWING_RESULTS to IN_PROGRESS transition', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      roomManager.transitionState(room.code, GameState.IN_PROGRESS);
      roomManager.transitionState(room.code, GameState.SHOWING_RESULTS);
      
      const result = roomManager.transitionState(room.code, GameState.IN_PROGRESS);
      
      expect(result).toBe(true);
      expect(roomManager.getRoom(room.code)?.gameState).toBe(GameState.IN_PROGRESS);
    });

    test('allows transition to ENDED from IN_PROGRESS', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      roomManager.transitionState(room.code, GameState.IN_PROGRESS);
      
      const result = roomManager.transitionState(room.code, GameState.ENDED);
      
      expect(result).toBe(true);
      expect(roomManager.getRoom(room.code)?.gameState).toBe(GameState.ENDED);
    });

    test('prevents invalid state transitions', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      
      // Cannot go from LOBBY to SHOWING_RESULTS
      const result = roomManager.transitionState(room.code, GameState.SHOWING_RESULTS);
      
      expect(result).toBe(false);
      expect(roomManager.getRoom(room.code)?.gameState).toBe(GameState.LOBBY);
    });

    test('prevents transitions from ENDED state', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      roomManager.transitionState(room.code, GameState.IN_PROGRESS);
      roomManager.transitionState(room.code, GameState.ENDED);
      
      const result = roomManager.transitionState(room.code, GameState.LOBBY);
      
      expect(result).toBe(false);
      expect(roomManager.getRoom(room.code)?.gameState).toBe(GameState.ENDED);
    });

    test('returns false for non-existent room', () => {
      const result = roomManager.transitionState('INVALID', GameState.IN_PROGRESS);
      
      expect(result).toBe(false);
    });
  });

  describe('startGame', () => {
    test('transitions room from LOBBY to IN_PROGRESS', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      const result = roomManager.startGame(room.code);
      
      expect(result).toBe(true);
      expect(roomManager.getRoom(room.code)?.gameState).toBe(GameState.IN_PROGRESS);
    });

    test('returns false for non-existent room', () => {
      const result = roomManager.startGame('INVALID');
      
      expect(result).toBe(false);
    });
  });

  describe('closeRoom', () => {
    test('removes room from storage', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      const result = roomManager.closeRoom(room.code);
      
      expect(result).toBe(true);
      expect(roomManager.getRoom(room.code)).toBeNull();
    });

    test('returns false for non-existent room', () => {
      const result = roomManager.closeRoom('INVALID');
      
      expect(result).toBe(false);
    });
  });

  describe('isHost', () => {
    test('returns true for host player', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      const result = roomManager.isHost(room.code, 'host1');
      
      expect(result).toBe(true);
    });

    test('returns false for non-host player', () => {
      const room = roomManager.createRoom('Science', 'host1', 'Alice');
      
      const participant: Player = {
        id: 'player2',
        name: 'Bob',
        isHost: false,
        score: 0,
        connected: true,
      };
      
      roomManager.addParticipant(room.code, participant);
      const result = roomManager.isHost(room.code, 'player2');
      
      expect(result).toBe(false);
    });

    test('returns false for non-existent room', () => {
      const result = roomManager.isHost('INVALID', 'player1');
      
      expect(result).toBe(false);
    });
  });
});
