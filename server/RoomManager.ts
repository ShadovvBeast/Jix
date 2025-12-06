/**
 * RoomManager Service
 * Manages game rooms with in-memory storage
 * Handles room creation, participant management, and state transitions
 */

import type { Room, Player } from '../shared/types';
import { GameState } from '../shared/types';
import { generateRoomCode } from '../shared/utils';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  /**
   * Creates a new game room with the specified category and host
   * Requirements: 2.1, 2.4, 2.5
   * @param category - The quiz category for the room
   * @param hostId - The ID of the host player
   * @param hostName - The name of the host player
   * @returns The created room
   */
  createRoom(category: string, hostId: string, hostName: string): Room {
    // Generate unique room code
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    // Create host player
    const host: Player = {
      id: hostId,
      name: hostName,
      isHost: true,
      score: 0,
      connected: true,
    };

    // Create room with host as first participant
    const room: Room = {
      code: roomCode,
      category,
      hostId,
      participants: [host],
      gameState: GameState.LOBBY,
      currentQuestion: null,
      questionHistory: [],
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  /**
   * Retrieves a room by its code
   * Requirement: 2.3
   * @param roomCode - The room code to lookup
   * @returns The room if found, null otherwise
   */
  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null;
  }

  /**
   * Adds a participant to a room
   * Requirements: 3.2, 3.4
   * @param roomCode - The room code
   * @param participant - The player to add
   * @returns true if successful, false if room not found or game already started
   */
  addParticipant(roomCode: string, participant: Player): boolean {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return false;
    }

    // Prevent joining if game is not in LOBBY state (Requirement 4.3)
    if (room.gameState !== GameState.LOBBY) {
      return false;
    }

    // Check if participant already exists
    const existingParticipant = room.participants.find(p => p.id === participant.id);
    if (existingParticipant) {
      // Update connection status if reconnecting
      existingParticipant.connected = true;
      return true;
    }

    // Add new participant
    room.participants.push(participant);
    return true;
  }

  /**
   * Removes a participant from a room
   * Requirement: 3.3
   * @param roomCode - The room code
   * @param participantId - The ID of the participant to remove
   * @returns true if successful, false if room or participant not found
   */
  removeParticipant(roomCode: string, participantId: string): boolean {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return false;
    }

    const participantIndex = room.participants.findIndex(p => p.id === participantId);
    
    if (participantIndex === -1) {
      return false;
    }

    const participant = room.participants[participantIndex];
    if (participant) {
      // Mark as disconnected instead of removing to preserve game history
      participant.connected = false;
    }
    
    return true;
  }

  /**
   * Gets the list of participants in a room
   * @param roomCode - The room code
   * @returns Array of participants, or empty array if room not found
   */
  getParticipants(roomCode: string): Player[] {
    const room = this.rooms.get(roomCode);
    return room ? [...room.participants] : [];
  }

  /**
   * Transitions a room to a new game state
   * Validates state transitions according to game flow
   * @param roomCode - The room code
   * @param newState - The target game state
   * @returns true if transition successful, false otherwise
   */
  transitionState(roomCode: string, newState: GameState): boolean {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return false;
    }

    // Validate state transitions
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.LOBBY]: [GameState.IN_PROGRESS],
      [GameState.IN_PROGRESS]: [GameState.SHOWING_RESULTS, GameState.ENDED],
      [GameState.SHOWING_RESULTS]: [GameState.IN_PROGRESS, GameState.ENDED],
      [GameState.ENDED]: [], // Terminal state
    };

    const allowedStates = validTransitions[room.gameState];
    
    if (!allowedStates || !allowedStates.includes(newState)) {
      return false;
    }

    room.gameState = newState;
    return true;
  }

  /**
   * Starts a game (transitions from LOBBY to IN_PROGRESS)
   * Requirement: 4.2
   * @param roomCode - The room code
   * @returns true if successful, false otherwise
   */
  startGame(roomCode: string): boolean {
    return this.transitionState(roomCode, GameState.IN_PROGRESS);
  }

  /**
   * Closes a room and removes it from storage
   * Requirement: 10.3
   * @param roomCode - The room code
   * @returns true if room was closed, false if not found
   */
  closeRoom(roomCode: string): boolean {
    return this.rooms.delete(roomCode);
  }

  /**
   * Gets all active rooms (for debugging/admin purposes)
   * @returns Array of all room codes
   */
  getAllRoomCodes(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Checks if a player is the host of a room
   * @param roomCode - The room code
   * @param playerId - The player ID to check
   * @returns true if player is host, false otherwise
   */
  isHost(roomCode: string, playerId: string): boolean {
    const room = this.rooms.get(roomCode);
    return room ? room.hostId === playerId : false;
  }
}

// Export singleton instance
export const roomManager = new RoomManager();
