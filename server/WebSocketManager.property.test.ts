/**
 * Property-based tests for WebSocketManager service
 * Using fast-check for property-based testing
 */

import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { WebSocketManager } from './WebSocketManager';
import { roomManager } from './RoomManager';
import type { Player, GameEvent } from '../shared/types';
import type { ServerWebSocket } from 'bun';

// Mock WebSocket for testing
class MockWebSocket {
  public sentMessages: string[] = [];
  public data: any;
  public closed = false;

  constructor(data: any) {
    this.data = data;
  }

  send(message: string): void {
    this.sentMessages.push(message);
  }

  close(code?: number, reason?: string): void {
    this.closed = true;
  }
}

describe('WebSocketManager Property-Based Tests', () => {
  // Feature: jix-game, Property 6: Join broadcast consistency
  // Validates: Requirements 3.5, 9.1
  test('join broadcast consistency - all existing participants receive PLAYER_JOINED event', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ), // existing participants
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }), // new participant
        (category, hostId, hostName, existingParticipants, newParticipant) => {
          // Ensure all participant IDs are unique
          const allIds = [hostId, ...existingParticipants.map(p => p.id), newParticipant.id];
          const uniqueIds = new Set(allIds);
          fc.pre(uniqueIds.size === allIds.length);

          // Create fresh instances for each property test run
          const testWsManager = new WebSocketManager();

          // Create room with host using singleton roomManager
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Add existing participants and establish their WebSocket connections
          const existingMockSockets: MockWebSocket[] = [];
          
          for (const participant of existingParticipants) {
            const player: Player = {
              id: participant.id,
              name: participant.name,
              isHost: false,
              score: 0,
              connected: true,
            };

            // Add participant to room
            roomManager.addParticipant(roomCode, player);

            // Create mock WebSocket for this participant
            const mockWs = new MockWebSocket({
              playerId: participant.id,
              roomCode,
              playerName: participant.name,
            });

            // Establish WebSocket connection
            testWsManager.handleConnection(
              mockWs as any as ServerWebSocket<any>,
              participant.id,
              roomCode,
              participant.name
            );

            existingMockSockets.push(mockWs);
          }

          // Clear any messages sent during setup
          existingMockSockets.forEach(ws => {
            ws.sentMessages = [];
          });

          // Now add the new participant
          const newPlayer: Player = {
            id: newParticipant.id,
            name: newParticipant.name,
            isHost: false,
            score: 0,
            connected: true,
          };

          // Add new participant to room
          const addResult = roomManager.addParticipant(roomCode, newPlayer);
          expect(addResult).toBe(true);

          // Create mock WebSocket for new participant
          const newMockWs = new MockWebSocket({
            playerId: newParticipant.id,
            roomCode,
            playerName: newParticipant.name,
          });

          // Establish WebSocket connection for new participant
          testWsManager.handleConnection(
            newMockWs as any as ServerWebSocket<any>,
            newParticipant.id,
            roomCode,
            newParticipant.name
          );

          // Broadcast the PLAYER_JOINED event (simulating what the server does)
          testWsManager.broadcast(roomCode, {
            type: 'PLAYER_JOINED',
            player: newPlayer,
          });

          // Property: All existing connected participants should receive PLAYER_JOINED event
          for (const mockWs of existingMockSockets) {
            // Each existing participant should have received at least one message
            expect(mockWs.sentMessages.length).toBeGreaterThan(0);

            // Find the PLAYER_JOINED message
            const playerJoinedMessages = mockWs.sentMessages
              .map(msg => JSON.parse(msg))
              .filter((event: GameEvent) => event.type === 'PLAYER_JOINED');

            // Should have received exactly one PLAYER_JOINED event
            expect(playerJoinedMessages.length).toBeGreaterThanOrEqual(1);

            // The event should contain the new player's information
            const joinEvent = playerJoinedMessages[playerJoinedMessages.length - 1];
            expect(joinEvent.player.id).toBe(newParticipant.id);
            expect(joinEvent.player.name).toBe(newParticipant.name);
            expect(joinEvent.player.isHost).toBe(false);
            expect(joinEvent.player.connected).toBe(true);
          }

          // Property: The new participant should also receive the broadcast
          expect(newMockWs.sentMessages.length).toBeGreaterThan(0);
          const newPlayerMessages = newMockWs.sentMessages
            .map(msg => JSON.parse(msg))
            .filter((event: GameEvent) => event.type === 'PLAYER_JOINED');
          expect(newPlayerMessages.length).toBeGreaterThanOrEqual(1);

          // Cleanup: close the room after test
          roomManager.closeRoom(roomCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 8: Game start broadcast
  // Validates: Requirements 4.4, 6.1
  test('game start broadcast - all participants receive GAME_STARTED and QUESTION_RECEIVED events', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ), // participants
        (category, hostId, hostName, participants) => {
          // Ensure all participant IDs are unique
          const allIds = [hostId, ...participants.map(p => p.id)];
          const uniqueIds = new Set(allIds);
          fc.pre(uniqueIds.size === allIds.length);

          // Create fresh instances for each property test run
          const testWsManager = new WebSocketManager();

          // Create room with host
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Add participants and establish their WebSocket connections
          const allMockSockets: MockWebSocket[] = [];
          
          // Add host socket
          const hostMockWs = new MockWebSocket({
            playerId: hostId,
            roomCode,
            playerName: hostName,
          });
          testWsManager.handleConnection(
            hostMockWs as any as ServerWebSocket<any>,
            hostId,
            roomCode,
            hostName
          );
          allMockSockets.push(hostMockWs);

          // Add other participants
          for (const participant of participants) {
            const player: Player = {
              id: participant.id,
              name: participant.name,
              isHost: false,
              score: 0,
              connected: true,
            };

            roomManager.addParticipant(roomCode, player);

            const mockWs = new MockWebSocket({
              playerId: participant.id,
              roomCode,
              playerName: participant.name,
            });

            testWsManager.handleConnection(
              mockWs as any as ServerWebSocket<any>,
              participant.id,
              roomCode,
              participant.name
            );

            allMockSockets.push(mockWs);
          }

          // Clear any messages sent during setup
          allMockSockets.forEach(ws => {
            ws.sentMessages = [];
          });

          // Start the game
          roomManager.startGame(roomCode);

          // Broadcast GAME_STARTED event
          testWsManager.broadcast(roomCode, {
            type: 'GAME_STARTED',
          });

          // Broadcast QUESTION_RECEIVED event (simulating what happens after game starts)
          const mockQuestion = {
            id: 'q1',
            text: 'Test question?',
            options: [
              { id: 'a1', text: 'Option 1' },
              { id: 'a2', text: 'Option 2' },
            ],
            correctAnswerId: 'a1',
            category: category,
          };

          testWsManager.broadcast(roomCode, {
            type: 'QUESTION_RECEIVED',
            question: mockQuestion,
          });

          // Property: All participants should receive GAME_STARTED event
          for (const mockWs of allMockSockets) {
            const messages = mockWs.sentMessages.map(msg => JSON.parse(msg));
            
            const gameStartedEvents = messages.filter(
              (event: GameEvent) => event.type === 'GAME_STARTED'
            );
            expect(gameStartedEvents.length).toBeGreaterThanOrEqual(1);

            // Property: All participants should receive QUESTION_RECEIVED event
            const questionReceivedEvents = messages.filter(
              (event: GameEvent) => event.type === 'QUESTION_RECEIVED'
            );
            expect(questionReceivedEvents.length).toBeGreaterThanOrEqual(1);

            // Verify the question data is correct
            const questionEvent = questionReceivedEvents[0];
            expect(questionEvent.question).toBeDefined();
            expect(questionEvent.question.id).toBe('q1');
            expect(questionEvent.question.text).toBe('Test question?');
          }

          // Cleanup
          roomManager.closeRoom(roomCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 19: Answer submission broadcast
  // Validates: Requirements 9.2
  test('answer submission broadcast - all participants receive ANSWER_SUBMITTED event', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ), // participants
        fc.integer({ min: 0, max: 10 }), // index of participant who submits answer
        (category, hostId, hostName, participants, answerIndex) => {
          // Ensure all participant IDs are unique
          const allIds = [hostId, ...participants.map(p => p.id)];
          const uniqueIds = new Set(allIds);
          fc.pre(uniqueIds.size === allIds.length);
          fc.pre(participants.length > 0);
          
          // Ensure answerIndex is valid
          const submittingParticipantIndex = answerIndex % participants.length;
          const submittingParticipant = participants[submittingParticipantIndex];
          fc.pre(submittingParticipant !== undefined);

          // Create fresh instances for each property test run
          const testWsManager = new WebSocketManager();

          // Create room with host
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Add participants and establish their WebSocket connections
          const allMockSockets: MockWebSocket[] = [];
          
          for (const participant of participants) {
            const player: Player = {
              id: participant.id,
              name: participant.name,
              isHost: false,
              score: 0,
              connected: true,
            };

            roomManager.addParticipant(roomCode, player);

            const mockWs = new MockWebSocket({
              playerId: participant.id,
              roomCode,
              playerName: participant.name,
            });

            testWsManager.handleConnection(
              mockWs as any as ServerWebSocket<any>,
              participant.id,
              roomCode,
              participant.name
            );

            allMockSockets.push(mockWs);
          }

          // Clear any messages sent during setup
          allMockSockets.forEach(ws => {
            ws.sentMessages = [];
          });

          // Broadcast ANSWER_SUBMITTED event for the submitting participant
          testWsManager.broadcast(roomCode, {
            type: 'ANSWER_SUBMITTED',
            playerId: submittingParticipant.id,
          });

          // Property: All participants should receive ANSWER_SUBMITTED event
          for (const mockWs of allMockSockets) {
            const messages = mockWs.sentMessages.map(msg => JSON.parse(msg));
            
            const answerSubmittedEvents = messages.filter(
              (event: GameEvent) => event.type === 'ANSWER_SUBMITTED'
            );
            expect(answerSubmittedEvents.length).toBeGreaterThanOrEqual(1);

            // Verify the event contains the correct player ID
            const answerEvent = answerSubmittedEvents[0];
            expect(answerEvent.playerId).toBe(submittingParticipant.id);
          }

          // Cleanup
          roomManager.closeRoom(roomCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 21: Disconnect notification
  // Validates: Requirements 9.5
  test('disconnect notification - remaining participants receive PLAYER_LEFT event', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 5 }
        ), // participants (at least 2 so one can disconnect)
        fc.integer({ min: 0, max: 10 }), // index of participant who disconnects
        (category, hostId, hostName, participants, disconnectIndex) => {
          // Ensure all participant IDs are unique
          const allIds = [hostId, ...participants.map(p => p.id)];
          const uniqueIds = new Set(allIds);
          fc.pre(uniqueIds.size === allIds.length);
          fc.pre(participants.length >= 2);
          
          // Ensure disconnectIndex is valid
          const disconnectingParticipantIndex = disconnectIndex % participants.length;
          const disconnectingParticipant = participants[disconnectingParticipantIndex];
          fc.pre(disconnectingParticipant !== undefined);

          // Create fresh instances for each property test run
          const testWsManager = new WebSocketManager();

          // Create room with host
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Add participants and establish their WebSocket connections
          const allMockSockets: Map<string, MockWebSocket> = new Map();
          
          for (const participant of participants) {
            const player: Player = {
              id: participant.id,
              name: participant.name,
              isHost: false,
              score: 0,
              connected: true,
            };

            roomManager.addParticipant(roomCode, player);

            const mockWs = new MockWebSocket({
              playerId: participant.id,
              roomCode,
              playerName: participant.name,
            });

            testWsManager.handleConnection(
              mockWs as any as ServerWebSocket<any>,
              participant.id,
              roomCode,
              participant.name
            );

            allMockSockets.set(participant.id, mockWs);
          }

          // Clear any messages sent during setup
          allMockSockets.forEach(ws => {
            ws.sentMessages = [];
          });

          // Disconnect one participant
          testWsManager.handleDisconnection(disconnectingParticipant.id);

          // Property: All remaining participants should receive PLAYER_LEFT event
          for (const [participantId, mockWs] of allMockSockets) {
            if (participantId === disconnectingParticipant.id) {
              // Skip the disconnected participant
              continue;
            }

            const messages = mockWs.sentMessages.map(msg => JSON.parse(msg));
            
            const playerLeftEvents = messages.filter(
              (event: GameEvent) => event.type === 'PLAYER_LEFT'
            );
            expect(playerLeftEvents.length).toBeGreaterThanOrEqual(1);

            // Verify the event contains the correct player ID
            const leftEvent = playerLeftEvents[0];
            expect(leftEvent.playerId).toBe(disconnectingParticipant.id);
          }

          // Property: The participant list should be updated
          const updatedRoom = roomManager.getRoom(roomCode);
          expect(updatedRoom).not.toBeNull();
          
          const disconnectedPlayer = updatedRoom?.participants.find(
            p => p.id === disconnectingParticipant.id
          );
          expect(disconnectedPlayer?.connected).toBe(false);

          // Cleanup
          roomManager.closeRoom(roomCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 20: Game state consistency
  // Validates: Requirements 9.4, 9.1
  test('game state consistency - all participants receive state updates from host actions', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ), // participants
        (category, hostId, hostName, participants) => {
          // Ensure all participant IDs are unique
          const allIds = [hostId, ...participants.map(p => p.id)];
          const uniqueIds = new Set(allIds);
          fc.pre(uniqueIds.size === allIds.length);

          // Create fresh instances for each property test run
          const testWsManager = new WebSocketManager();

          // Create room with host
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Add participants and establish their WebSocket connections
          const allMockSockets: MockWebSocket[] = [];
          
          // Add host socket
          const hostMockWs = new MockWebSocket({
            playerId: hostId,
            roomCode,
            playerName: hostName,
          });
          testWsManager.handleConnection(
            hostMockWs as any as ServerWebSocket<any>,
            hostId,
            roomCode,
            hostName
          );
          allMockSockets.push(hostMockWs);

          // Add other participants
          for (const participant of participants) {
            const player: Player = {
              id: participant.id,
              name: participant.name,
              isHost: false,
              score: 0,
              connected: true,
            };

            roomManager.addParticipant(roomCode, player);

            const mockWs = new MockWebSocket({
              playerId: participant.id,
              roomCode,
              playerName: participant.name,
            });

            testWsManager.handleConnection(
              mockWs as any as ServerWebSocket<any>,
              participant.id,
              roomCode,
              participant.name
            );

            allMockSockets.push(mockWs);
          }

          // Clear any messages sent during setup
          allMockSockets.forEach(ws => {
            ws.sentMessages = [];
          });

          // Host initiates game start (state change)
          const startTime = Date.now();
          roomManager.startGame(roomCode);

          // Broadcast the state change
          testWsManager.broadcast(roomCode, {
            type: 'GAME_STARTED',
          });

          const broadcastTime = Date.now();
          const timeDiff = broadcastTime - startTime;

          // Property: All participants should receive the state update
          for (const mockWs of allMockSockets) {
            const messages = mockWs.sentMessages.map(msg => JSON.parse(msg));
            
            const gameStartedEvents = messages.filter(
              (event: GameEvent) => event.type === 'GAME_STARTED'
            );
            expect(gameStartedEvents.length).toBeGreaterThanOrEqual(1);
          }

          // Property: The broadcast should happen within 500ms (requirement 9.1)
          // Note: In a real system, this would measure network latency
          // In our test, we're just verifying the broadcast happens quickly
          expect(timeDiff).toBeLessThan(500);

          // Property: All participants should have consistent game state
          const updatedRoom = roomManager.getRoom(roomCode);
          expect(updatedRoom?.gameState).toBe('IN_PROGRESS');

          // Cleanup
          roomManager.closeRoom(roomCode);
        }
      ),
      { numRuns: 100 }
    );
  });
});