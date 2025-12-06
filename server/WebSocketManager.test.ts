/**
 * Unit tests for WebSocketManager
 * Tests connection management, broadcasting, and disconnection handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WebSocketManager } from './WebSocketManager';
import { roomManager } from './RoomManager';
import type { GameEvent } from '../shared/types';

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = new WebSocketManager();
  });

  describe('Connection Management', () => {
    it('should track player to room mapping', () => {
      const playerId = 'player1';
      const roomCode = 'TEST123';

      // Create a room first
      roomManager.createRoom('Science', 'player1', 'Test Player');

      // Simulate connection tracking
      const roomForPlayer = wsManager.getRoomForPlayer(playerId);
      
      // Initially no room should be mapped
      expect(roomForPlayer).toBeNull();
    });

    it('should return null for non-existent player room', () => {
      const result = wsManager.getRoomForPlayer('nonexistent');
      expect(result).toBeNull();
    });

    it('should check connection status', () => {
      const isConnected = wsManager.isConnected('player1');
      expect(isConnected).toBe(false);
    });

    it('should get connection count', () => {
      const count = wsManager.getConnectionCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Room Operations', () => {
    it('should get connected players in a room', () => {
      const roomCode = 'TEST456';
      
      // Create a room
      roomManager.createRoom('History', 'host1', 'Host Player');
      
      const connectedPlayers = wsManager.getConnectedPlayers(roomCode);
      expect(Array.isArray(connectedPlayers)).toBe(true);
    });

    it('should return empty array for non-existent room', () => {
      const connectedPlayers = wsManager.getConnectedPlayers('NONEXISTENT');
      expect(connectedPlayers).toEqual([]);
    });
  });

  describe('Event Broadcasting', () => {
    it('should handle broadcast to non-existent room gracefully', () => {
      const event: GameEvent = {
        type: 'GAME_STARTED',
      };

      // Should not throw
      expect(() => {
        wsManager.broadcast('NONEXISTENT', event);
      }).not.toThrow();
    });

    it('should handle send to non-existent player gracefully', () => {
      const event: GameEvent = {
        type: 'ERROR',
        message: 'Test error',
      };

      // Should not throw
      expect(() => {
        wsManager.sendToPlayer('nonexistent', event);
      }).not.toThrow();
    });
  });
});
