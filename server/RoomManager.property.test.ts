/**
 * Property-based tests for RoomManager service
 * Using fast-check for property-based testing
 */

import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { RoomManager } from './RoomManager';
import { GameState } from '../shared/types';
import type { Player } from '../shared/types';

describe('RoomManager Property-Based Tests', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  // Feature: jix-game, Property 3: Room creation completeness
  // Validates: Requirements 2.4, 2.5
  test('room creation completeness - created room contains host, category, valid code, and LOBBY state', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        (category, hostId, hostName) => {
          // Create fresh RoomManager for each property test run
          const testRoomManager = new RoomManager();

          // Create room
          const room = testRoomManager.createRoom(category, hostId, hostName);

          // Property: Room should contain the host as a participant
          expect(room.participants).toHaveLength(1);
          const host = room.participants[0];
          expect(host?.id).toBe(hostId);
          expect(host?.name).toBe(hostName);
          expect(host?.isHost).toBe(true);
          expect(host?.score).toBe(0);
          expect(host?.connected).toBe(true);

          // Property: Room should contain the specified category
          expect(room.category).toBe(category);

          // Property: Room should have a valid room code (6 alphanumeric characters)
          expect(room.code).toMatch(/^[A-Z0-9]{6}$/);

          // Property: Room should be in LOBBY state
          expect(room.gameState).toBe(GameState.LOBBY);

          // Additional invariants
          expect(room.hostId).toBe(hostId);
          expect(room.currentQuestion).toBeNull();
          expect(room.questionHistory).toEqual([]);
          expect(room.createdAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 4: Valid room join success
  // Validates: Requirements 3.2, 3.4
  test('valid room join success - joining existing room adds participant to list', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.string({ minLength: 1, maxLength: 50 }), // participantId
        fc.string({ minLength: 1, maxLength: 50 }), // participantName
        (category, hostId, hostName, participantId, participantName) => {
          // Ensure participant is different from host
          fc.pre(participantId !== hostId);

          // Create fresh RoomManager for each property test run
          const testRoomManager = new RoomManager();

          // Create room
          const room = testRoomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Create participant
          const participant: Player = {
            id: participantId,
            name: participantName,
            isHost: false,
            score: 0,
            connected: true,
          };

          // Property: Joining with valid room code should succeed
          const joinResult = testRoomManager.addParticipant(roomCode, participant);
          expect(joinResult).toBe(true);

          // Property: Participant should be added to room's participant list
          const updatedRoom = testRoomManager.getRoom(roomCode);
          expect(updatedRoom).not.toBeNull();
          expect(updatedRoom?.participants).toHaveLength(2);

          // Property: The new participant should be in the list
          const addedParticipant = updatedRoom?.participants.find(p => p.id === participantId);
          expect(addedParticipant).toBeDefined();
          expect(addedParticipant?.name).toBe(participantName);
          expect(addedParticipant?.isHost).toBe(false);
          expect(addedParticipant?.score).toBe(0);
          expect(addedParticipant?.connected).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 5: Invalid room join rejection
  // Validates: Requirements 3.3
  test('invalid room join rejection - joining non-existent room fails without creating records', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^[A-Z0-9]{6}$/.test(s)), // invalid room code
        fc.string({ minLength: 1, maxLength: 50 }), // participantId
        fc.string({ minLength: 1, maxLength: 50 }), // participantName
        (invalidRoomCode, participantId, participantName) => {
          // Create fresh RoomManager for each property test run
          const testRoomManager = new RoomManager();

          // Ensure the room code doesn't exist
          const roomBefore = testRoomManager.getRoom(invalidRoomCode);
          fc.pre(roomBefore === null);

          // Create participant
          const participant: Player = {
            id: participantId,
            name: participantName,
            isHost: false,
            score: 0,
            connected: true,
          };

          // Property: Joining with invalid room code should fail
          const joinResult = testRoomManager.addParticipant(invalidRoomCode, participant);
          expect(joinResult).toBe(false);

          // Property: No room should be created
          const roomAfter = testRoomManager.getRoom(invalidRoomCode);
          expect(roomAfter).toBeNull();

          // Property: No participant records should be created
          const participants = testRoomManager.getParticipants(invalidRoomCode);
          expect(participants).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 9: Post-game state immutability
  // Validates: Requirements 4.3
  test('post-game state immutability - participant list does not accept new additions after LOBBY', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.string({ minLength: 1, maxLength: 50 }), // participantId
        fc.string({ minLength: 1, maxLength: 50 }), // participantName
        fc.constantFrom(GameState.IN_PROGRESS, GameState.SHOWING_RESULTS, GameState.ENDED), // post-lobby state
        (category, hostId, hostName, participantId, participantName, postLobbyState) => {
          // Ensure participant is different from host
          fc.pre(participantId !== hostId);

          // Create fresh RoomManager for each property test run
          const testRoomManager = new RoomManager();

          // Create room
          const room = testRoomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Transition to post-lobby state
          if (postLobbyState === GameState.IN_PROGRESS) {
            testRoomManager.transitionState(roomCode, GameState.IN_PROGRESS);
          } else if (postLobbyState === GameState.SHOWING_RESULTS) {
            testRoomManager.transitionState(roomCode, GameState.IN_PROGRESS);
            testRoomManager.transitionState(roomCode, GameState.SHOWING_RESULTS);
          } else if (postLobbyState === GameState.ENDED) {
            testRoomManager.transitionState(roomCode, GameState.IN_PROGRESS);
            testRoomManager.transitionState(roomCode, GameState.ENDED);
          }

          // Verify room is in post-lobby state
          const roomBeforeJoin = testRoomManager.getRoom(roomCode);
          expect(roomBeforeJoin?.gameState).toBe(postLobbyState);
          const participantCountBefore = roomBeforeJoin?.participants.length || 0;

          // Create participant
          const participant: Player = {
            id: participantId,
            name: participantName,
            isHost: false,
            score: 0,
            connected: true,
          };

          // Property: Joining should fail when room is not in LOBBY state
          const joinResult = testRoomManager.addParticipant(roomCode, participant);
          expect(joinResult).toBe(false);

          // Property: Participant list should remain unchanged
          const roomAfterJoin = testRoomManager.getRoom(roomCode);
          expect(roomAfterJoin?.participants.length).toBe(participantCountBefore);

          // Property: New participant should not be in the list
          const addedParticipant = roomAfterJoin?.participants.find(p => p.id === participantId);
          expect(addedParticipant).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
