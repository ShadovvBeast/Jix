/**
 * Jix Game Server
 * Entry point for the Bun server with WebSocket support
 * Requirements: 3.5, 4.4, 6.1, 9.1, 9.2, 9.5
 */

import type { ServerWebSocket } from 'bun';
import { wsManager } from './WebSocketManager';
import { roomManager } from './RoomManager';
import { GameEngine } from './GameEngine';
import { GeminiService } from './GeminiService';
import type { Player } from '../shared/types';
import { GameState } from '../shared/types';
import {
  validateRoomCode,
  validateCategory,
  validatePlayerName,
  validatePlayerId,
  validateAnswerId,
  sanitizeInput,
} from '../shared/validation';

// Initialize game services
const geminiService = new GeminiService(process.env.GEMINI_API_KEY || '');
const gameEngine = new GameEngine(geminiService, roomManager);

interface WebSocketData {
  playerId: string;
  roomCode: string;
  playerName: string;
}

const SERVER_PORT = 9188; // WebSocket server port
const CLIENT_PORT = 9144; // Client will run on this port

console.log('Jix server starting...');

/**
 * Bun server with WebSocket support
 */
const server = Bun.serve<WebSocketData>({
  port: SERVER_PORT,
  
  async fetch(req: Request, server: any) {
    const url = new URL(req.url);

    // WebSocket upgrade endpoint
    if (url.pathname === '/ws') {
      // Extract connection parameters from query string
      const playerId = url.searchParams.get('playerId');
      const roomCode = url.searchParams.get('roomCode');
      const playerName = url.searchParams.get('playerName');

      if (!playerId || !roomCode || !playerName) {
        return new Response('Missing required parameters: playerId, roomCode, playerName', {
          status: 400,
        });
      }

      // Validate room exists
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        return new Response('Room not found', { status: 404 });
      }

      // Upgrade to WebSocket
      const success = server.upgrade(req, {
        data: {
          playerId,
          roomCode,
          playerName,
        },
      });

      if (success) {
        return undefined; // Connection upgraded
      }

      return new Response('WebSocket upgrade failed', { status: 500 });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        connections: wsManager.getConnectionCount(),
        rooms: roomManager.getAllRoomCodes().length,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CORS headers for HTTP endpoints
    const allowedOrigins = [
      `http://localhost:${CLIENT_PORT}`,
      'https://jix.sb0.tech',
      'http://jix.sb0.tech',
    ];
    
    const origin = req.headers.get('origin') || '';
    const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    const headers = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // API Routes
    // POST /api/rooms - Create a new room (Requirements: 2.1, 2.2, 2.3)
    if (url.pathname === '/api/rooms' && req.method === 'POST') {
      try {
        const body = await req.json() as any;
        const { category, hostId, hostName } = body;

        // Validate required fields
        if (!category || typeof category !== 'string' || !validateCategory(category)) {
          return new Response(JSON.stringify({
            error: 'Category is required and must be a non-empty string',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        if (!hostId || typeof hostId !== 'string' || !validatePlayerId(hostId)) {
          return new Response(JSON.stringify({
            error: 'Host ID is required and must be a valid player ID',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        if (!hostName || typeof hostName !== 'string' || !validatePlayerName(hostName)) {
          return new Response(JSON.stringify({
            error: 'Host name is required and must be a valid player name',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Sanitize inputs
        const sanitizedCategory = sanitizeInput(category, 100);
        const sanitizedHostName = sanitizeInput(hostName, 50);

        // Create room with sanitized inputs
        const room = roomManager.createRoom(sanitizedCategory, hostId, sanitizedHostName);

        return new Response(JSON.stringify({
          code: room.code,
          category: room.category,
          hostId: room.hostId,
          participants: room.participants,
          gameState: room.gameState,
        }), {
          status: 201,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error creating room:', error);
        return new Response(JSON.stringify({
          error: 'Failed to create room',
        }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /api/rooms/:code - Get room information (Requirement: 2.3)
    if (url.pathname.startsWith('/api/rooms/') && req.method === 'GET') {
      const pathParts = url.pathname.split('/');
      const roomCode = pathParts[3];

      if (!roomCode) {
        return new Response(JSON.stringify({
          error: 'Room code is required',
        }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      const room = roomManager.getRoom(roomCode);

      if (!room) {
        return new Response(JSON.stringify({
          error: 'Room not found',
        }), {
          status: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        code: room.code,
        category: room.category,
        hostId: room.hostId,
        participants: room.participants,
        gameState: room.gameState,
      }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/rooms/:code/join - Join a room (Requirements: 3.2)
    if (url.pathname.match(/^\/api\/rooms\/[^/]+\/join$/) && req.method === 'POST') {
      try {
        const pathParts = url.pathname.split('/');
        const roomCode = pathParts[3]!;
        const body = await req.json() as any;
        const { playerId, playerName } = body;

        // Validate required fields
        if (!playerId || typeof playerId !== 'string') {
          return new Response(JSON.stringify({
            error: 'Player ID is required and must be a string',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        if (!playerName || typeof playerName !== 'string') {
          return new Response(JSON.stringify({
            error: 'Player name is required and must be a string',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Check if room exists
        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return new Response(JSON.stringify({
            error: 'Room not found',
          }), {
            status: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Create player object
        const player: Player = {
          id: playerId,
          name: playerName,
          isHost: false,
          score: 0,
          connected: false, // Will be set to true when WebSocket connects
        };

        // Add participant to room
        const success = roomManager.addParticipant(roomCode, player);

        if (!success) {
          return new Response(JSON.stringify({
            error: 'Cannot join room - game may have already started',
          }), {
            status: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          roomCode: room.code,
          category: room.category,
          gameState: room.gameState,
        }), {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error joining room:', error);
        return new Response(JSON.stringify({
          error: 'Failed to join room',
        }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /api/rooms/:code/start - Start a game (Requirements: 4.1, 4.2)
    if (url.pathname.match(/^\/api\/rooms\/[^/]+\/start$/) && req.method === 'POST') {
      try {
        const pathParts = url.pathname.split('/');
        const roomCode = pathParts[3]!;
        const body = await req.json() as any;
        const { playerId } = body;

        // Validate required fields
        if (!playerId || typeof playerId !== 'string') {
          return new Response(JSON.stringify({
            error: 'Player ID is required and must be a string',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Check if room exists
        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return new Response(JSON.stringify({
            error: 'Room not found',
          }), {
            status: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Verify player is the host
        if (!roomManager.isHost(roomCode, playerId)) {
          return new Response(JSON.stringify({
            error: 'Only the host can start the game',
          }), {
            status: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Start the game
        const success = roomManager.startGame(roomCode);

        if (!success) {
          return new Response(JSON.stringify({
            error: 'Failed to start game - invalid state transition',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          gameState: room.gameState,
        }), {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error starting game:', error);
        return new Response(JSON.stringify({
          error: 'Failed to start game',
        }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /api/rooms/:code/end - End a game (Requirement: 10.3)
    if (url.pathname.match(/^\/api\/rooms\/[^/]+\/end$/) && req.method === 'POST') {
      try {
        const pathParts = url.pathname.split('/');
        const roomCode = pathParts[3]!;
        const body = await req.json() as any;
        const { playerId } = body;

        // Validate required fields
        if (!playerId || typeof playerId !== 'string') {
          return new Response(JSON.stringify({
            error: 'Player ID is required and must be a string',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Check if room exists
        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return new Response(JSON.stringify({
            error: 'Room not found',
          }), {
            status: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Verify player is the host
        if (!roomManager.isHost(roomCode, playerId)) {
          return new Response(JSON.stringify({
            error: 'Only the host can end the game',
          }), {
            status: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Transition to ENDED state
        const transitioned = roomManager.transitionState(roomCode, GameState.ENDED);

        if (!transitioned) {
          return new Response(JSON.stringify({
            error: 'Failed to end game - invalid state transition',
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Broadcast GAME_ENDED event to all participants
        const scores = room.participants.map((p, index) => ({
          playerId: p.id,
          playerName: p.name,
          score: p.score,
          rank: index + 1,
        })).sort((a, b) => b.score - a.score);

        wsManager.broadcast(roomCode, {
          type: 'GAME_ENDED',
          finalScores: scores,
        });

        // Close the room
        roomManager.closeRoom(roomCode);

        return new Response(JSON.stringify({
          success: true,
          finalScores: scores,
        }), {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error ending game:', error);
        return new Response(JSON.stringify({
          error: 'Failed to end game',
        }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    // Default 404 response
    return new Response('Not Found', { status: 404, headers });
  },

  websocket: {
    /**
     * Handle new WebSocket connection
     */
    open(ws: ServerWebSocket<WebSocketData>) {
      const { playerId, roomCode, playerName } = ws.data;
      
      console.log(`WebSocket connection attempt: ${playerId} -> ${roomCode}`);
      
      const success = wsManager.handleConnection(ws, playerId, roomCode, playerName);
      
      if (success) {
        const room = roomManager.getRoom(roomCode);
        if (room) {
          // Find the player in the room
          const player = room.participants.find(p => p.id === playerId);
          
          if (player) {
            // Broadcast PLAYER_JOINED event to all participants (Requirement 3.5, 9.1)
            wsManager.broadcast(roomCode, {
              type: 'PLAYER_JOINED',
              player,
            });
          }
        }
      } else {
        ws.close(1008, 'Connection validation failed');
      }
    },

    /**
     * Handle incoming WebSocket messages
     */
    async message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
      try {
        const data = JSON.parse(message.toString());
        const { playerId, roomCode } = ws.data;

        console.log(`Message from ${playerId}:`, data);

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          wsManager.sendToPlayer(playerId, {
            type: 'ERROR',
            message: 'Room not found',
          });
          return;
        }

        // Handle different message types
        switch (data.type) {
          case 'START_GAME':
            // Requirement 4.2, 4.4: Start game and broadcast to all participants
            if (!roomManager.isHost(roomCode, playerId)) {
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Only the host can start the game',
              });
              return;
            }

            const started = roomManager.startGame(roomCode);
            if (!started) {
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Failed to start game',
              });
              return;
            }

            // Broadcast GAME_STARTED event
            wsManager.broadcast(roomCode, {
              type: 'GAME_STARTED',
            });

            // Start first round and send question
            try {
              const question = await gameEngine.startRound(roomCode);
              wsManager.broadcast(roomCode, {
                type: 'QUESTION_RECEIVED',
                question,
              });
            } catch (error) {
              console.error('Error starting round:', error);
              wsManager.broadcast(roomCode, {
                type: 'ERROR',
                message: 'Failed to generate question',
              });
            }
            break;

          case 'SUBMIT_ANSWER':
            // Requirement 6.3, 6.4, 9.2: Submit answer and broadcast
            const { answerId } = data;
            if (!answerId || !validateAnswerId(answerId)) {
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Valid answer ID is required',
              });
              return;
            }

            try {
              const submitted = gameEngine.submitAnswer(roomCode, playerId, answerId);
              if (!submitted) {
                wsManager.sendToPlayer(playerId, {
                  type: 'ERROR',
                  message: 'Answer already submitted or invalid',
                });
                return;
              }

              // Broadcast that player has answered
              wsManager.broadcast(roomCode, {
                type: 'ANSWER_SUBMITTED',
                playerId,
              });

              // Check if all players have answered
              if (gameEngine.hasAllAnswered(roomCode)) {
                // Transition to SHOWING_RESULTS
                roomManager.transitionState(roomCode, GameState.SHOWING_RESULTS);

                // End round and get results
                const results = gameEngine.endRound(roomCode);

                // Broadcast results
                wsManager.broadcast(roomCode, {
                  type: 'ROUND_ENDED',
                  results,
                });
              }
            } catch (error) {
              console.error('Error submitting answer:', error);
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Failed to submit answer',
              });
            }
            break;

          case 'NEXT_QUESTION':
            // Requirement 10.2: Host requests next question
            if (!roomManager.isHost(roomCode, playerId)) {
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Only the host can request the next question',
              });
              return;
            }

            // Transition back to IN_PROGRESS
            const transitioned = roomManager.transitionState(roomCode, GameState.IN_PROGRESS);
            if (!transitioned) {
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Invalid state transition',
              });
              return;
            }

            // Start next round
            try {
              const nextQuestion = await gameEngine.nextRound(roomCode);
              wsManager.broadcast(roomCode, {
                type: 'QUESTION_RECEIVED',
                question: nextQuestion,
              });
            } catch (error) {
              console.error('Error starting next round:', error);
              wsManager.broadcast(roomCode, {
                type: 'ERROR',
                message: 'Failed to generate next question',
              });
            }
            break;

          case 'END_GAME':
            // Requirement 10.3: Host ends the game
            if (!roomManager.isHost(roomCode, playerId)) {
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Only the host can end the game',
              });
              return;
            }

            // Transition to ENDED state
            const ended = roomManager.transitionState(roomCode, GameState.ENDED);
            if (!ended) {
              wsManager.sendToPlayer(playerId, {
                type: 'ERROR',
                message: 'Failed to end game',
              });
              return;
            }

            // Calculate final scores
            const finalScores = gameEngine.calculateScores(roomCode);

            // Broadcast GAME_ENDED event
            wsManager.broadcast(roomCode, {
              type: 'GAME_ENDED',
              finalScores,
            });

            // Clean up round state
            gameEngine.clearRoundState(roomCode);

            // Close room after a delay to allow clients to receive the message
            setTimeout(() => {
              roomManager.closeRoom(roomCode);
            }, 1000);
            break;

          default:
            console.log(`Unknown message type: ${data.type}`);
        }
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        wsManager.sendToPlayer(ws.data.playerId, {
          type: 'ERROR',
          message: 'Invalid message format',
        });
      }
    },

    /**
     * Handle WebSocket disconnection
     */
    close(ws: ServerWebSocket<WebSocketData>) {
      const { playerId } = ws.data;
      wsManager.handleDisconnection(playerId);
    },
  },
});

console.log(`✓ WebSocket server running on port ${SERVER_PORT}`);
console.log(`✓ Client should connect from port ${CLIENT_PORT}`);
console.log(`✓ WebSocket endpoint: ws://localhost:${SERVER_PORT}/ws`);
console.log(`✓ Health check: http://localhost:${SERVER_PORT}/health`);
