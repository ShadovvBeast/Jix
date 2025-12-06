/**
 * WebSocketManager Service
 * Manages WebSocket connections and event broadcasting
 * Handles connection validation, room-wide broadcasts, and targeted messaging
 */

import type { ServerWebSocket } from 'bun';
import type { GameEvent, Player } from '../shared/types';
import { roomManager } from './RoomManager';

interface WebSocketData {
  playerId: string;
  roomCode: string;
  playerName: string;
}

export class WebSocketManager {
  private connections: Map<string, ServerWebSocket<WebSocketData>> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  /**
   * Handles new WebSocket connection
   * Requirements: 3.5, 9.1
   * @param ws - The WebSocket connection
   * @param playerId - The player's unique ID
   * @param roomCode - The room code to join
   * @param playerName - The player's display name
   * @returns true if connection successful, false otherwise
   */
  handleConnection(
    ws: ServerWebSocket<WebSocketData>,
    playerId: string,
    roomCode: string,
    playerName: string
  ): boolean {
    // Validate room exists
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      this.sendToSocket(ws, {
        type: 'ERROR',
        message: 'Room not found',
      });
      return false;
    }

    // Store connection
    this.connections.set(playerId, ws);
    this.playerToRoom.set(playerId, roomCode);

    // Update player connection status
    const existingPlayer = room.participants.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.connected = true;
    }

    console.log(`Player ${playerId} (${playerName}) connected to room ${roomCode}`);
    return true;
  }

  /**
   * Handles WebSocket disconnection with cleanup
   * Requirements: 9.5, 10.5
   * @param playerId - The player's unique ID
   */
  handleDisconnection(playerId: string): void {
    const roomCode = this.playerToRoom.get(playerId);
    
    if (!roomCode) {
      console.log(`Player ${playerId} disconnected (no room found)`);
      this.connections.delete(playerId);
      return;
    }

    const room = roomManager.getRoom(roomCode);
    
    if (room) {
      // Mark player as disconnected
      roomManager.removeParticipant(roomCode, playerId);

      // Broadcast disconnection to other players
      this.broadcast(roomCode, {
        type: 'PLAYER_LEFT',
        playerId,
      });

      // Handle host disconnection (Requirement 10.5)
      if (room.hostId === playerId) {
        const connectedParticipants = room.participants.filter(p => p.connected && p.id !== playerId);
        
        if (connectedParticipants.length > 0) {
          // Promote first connected participant to host
          const newHost = connectedParticipants[0];
          if (newHost) {
            room.hostId = newHost.id;
            newHost.isHost = true;
            console.log(`Host disconnected. Promoted ${newHost.id} to host in room ${roomCode}`);
            
            // Notify all participants of host change
            this.broadcast(roomCode, {
              type: 'ERROR',
              message: `Host disconnected. ${newHost.name} is now the host.`,
            });
          }
        } else {
          // No participants left, close the room
          console.log(`Host disconnected and no participants remain. Closing room ${roomCode}`);
          roomManager.closeRoom(roomCode);
        }
      }
    }

    // Clean up connection tracking
    this.connections.delete(playerId);
    this.playerToRoom.delete(playerId);
    
    console.log(`Player ${playerId} disconnected from room ${roomCode}`);
  }

  /**
   * Broadcasts an event to all connected players in a room
   * Requirements: 3.5, 4.4, 6.1, 9.1, 9.2
   * @param roomCode - The room code
   * @param event - The game event to broadcast
   */
  broadcast(roomCode: string, event: GameEvent): void {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) {
      console.warn(`Attempted to broadcast to non-existent room: ${roomCode}`);
      return;
    }

    // Send to all connected participants in the room
    let sentCount = 0;
    for (const participant of room.participants) {
      if (participant.connected) {
        const ws = this.connections.get(participant.id);
        if (ws) {
          this.sendToSocket(ws, event);
          sentCount++;
        }
      }
    }

    console.log(`Broadcast ${event.type} to ${sentCount} players in room ${roomCode}`);
  }

  /**
   * Sends an event to a specific player
   * @param playerId - The player's unique ID
   * @param event - The game event to send
   */
  sendToPlayer(playerId: string, event: GameEvent): void {
    const ws = this.connections.get(playerId);
    
    if (!ws) {
      console.warn(`Attempted to send to disconnected player: ${playerId}`);
      return;
    }

    this.sendToSocket(ws, event);
    console.log(`Sent ${event.type} to player ${playerId}`);
  }

  /**
   * Helper method to send data through a WebSocket
   * @param ws - The WebSocket connection
   * @param event - The game event to send
   */
  private sendToSocket(ws: ServerWebSocket<WebSocketData>, event: GameEvent): void {
    try {
      ws.send(JSON.stringify(event));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Gets the room code for a player
   * @param playerId - The player's unique ID
   * @returns The room code or null if not found
   */
  getRoomForPlayer(playerId: string): string | null {
    return this.playerToRoom.get(playerId) || null;
  }

  /**
   * Gets all connected player IDs in a room
   * @param roomCode - The room code
   * @returns Array of connected player IDs
   */
  getConnectedPlayers(roomCode: string): string[] {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return [];
    }

    return room.participants
      .filter(p => p.connected && this.connections.has(p.id))
      .map(p => p.id);
  }

  /**
   * Checks if a player is connected
   * @param playerId - The player's unique ID
   * @returns true if connected, false otherwise
   */
  isConnected(playerId: string): boolean {
    return this.connections.has(playerId);
  }

  /**
   * Gets the total number of active connections
   * @returns Number of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
