/**
 * Property-based tests for GameEngine service
 * Using fast-check for property-based testing
 */

import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameEngine } from './GameEngine';
import { GeminiService } from './GeminiService';
import { RoomManager } from './RoomManager';
import type { Question, AnswerOption } from '../shared/types';

describe('GameEngine Property-Based Tests', () => {
  // Feature: jix-game, Property 13: Answer immutability
  // Validates: Requirements 6.4
  test('answer immutability - once submitted, answers cannot be changed', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.string({ minLength: 1, maxLength: 50 }), // playerId
        fc.string({ minLength: 1, maxLength: 50 }), // playerName
        fc.string({ minLength: 1, maxLength: 100 }), // question text
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            text: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 2, maxLength: 6 }
        ), // answer options
        fc.nat(), // index for correct answer
        fc.nat(), // index for first answer submission
        fc.nat(), // index for second answer submission (attempt to change)
        (category, hostId, hostName, playerId, playerName, questionText, options, correctIndex, firstAnswerIndex, secondAnswerIndex) => {
          // Ensure we have valid indices
          fc.pre(options.length >= 2);
          const correctAnswerIndex = correctIndex % options.length;
          const firstIndex = firstAnswerIndex % options.length;
          const secondIndex = secondAnswerIndex % options.length;
          
          // Ensure the two answer attempts are different
          fc.pre(firstIndex !== secondIndex);
          
          // Ensure all option IDs are unique
          const optionIds = options.map(o => o.id);
          fc.pre(new Set(optionIds).size === optionIds.length);
          
          // Ensure player is different from host
          fc.pre(playerId !== hostId);

          // Create fresh services for each property test run
          const geminiService = new GeminiService('test-api-key');
          const roomManager = new RoomManager();
          const gameEngine = new GameEngine(geminiService, roomManager);

          // Create room and add participant
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;
          
          roomManager.addParticipant(roomCode, {
            id: playerId,
            name: playerName,
            isHost: false,
            score: 0,
            connected: true,
          });

          // Create a mock question
          const mockQuestion: Question = {
            id: 'test-q-' + Math.random(),
            text: questionText,
            options: options as AnswerOption[],
            correctAnswerId: options[correctAnswerIndex]!.id,
            category: category,
          };

          // Set up round state manually
          const roundState = {
            question: mockQuestion,
            answers: new Map(),
            startTime: Date.now(),
          };
          (gameEngine as any).roundStates.set(roomCode, roundState);

          // Update room with current question
          const updatedRoom = roomManager.getRoom(roomCode);
          if (updatedRoom) {
            updatedRoom.currentQuestion = mockQuestion;
          }

          // First answer submission
          const firstAnswerId = options[firstIndex]!.id;
          const firstSubmitResult = gameEngine.submitAnswer(roomCode, playerId, firstAnswerId);

          // Property: First submission should succeed
          expect(firstSubmitResult).toBe(true);

          // Get the recorded answer
          const state = gameEngine.getRoundState(roomCode);
          const recordedAnswer = state?.answers.get(playerId);
          
          // Property: Answer should be recorded
          expect(recordedAnswer).toBeDefined();
          expect(recordedAnswer?.playerId).toBe(playerId);
          expect(recordedAnswer?.answerId).toBe(firstAnswerId);
          
          const originalTimestamp = recordedAnswer?.timestamp;
          const originalIsCorrect = recordedAnswer?.isCorrect;

          // Attempt to change answer (second submission)
          const secondAnswerId = options[secondIndex]!.id;
          const secondSubmitResult = gameEngine.submitAnswer(roomCode, playerId, secondAnswerId);

          // Property: Second submission should fail (answer immutability)
          expect(secondSubmitResult).toBe(false);

          // Property: Original answer should remain unchanged
          const stateAfter = gameEngine.getRoundState(roomCode);
          const answerAfter = stateAfter?.answers.get(playerId);
          
          expect(answerAfter).toBeDefined();
          expect(answerAfter?.playerId).toBe(playerId);
          expect(answerAfter?.answerId).toBe(firstAnswerId); // Still the first answer
          expect(answerAfter?.timestamp).toBe(originalTimestamp); // Timestamp unchanged
          expect(answerAfter?.isCorrect).toBe(originalIsCorrect); // Correctness unchanged
          
          // Property: Answer should NOT be the second attempted answer
          expect(answerAfter?.answerId).not.toBe(secondAnswerId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

  // Feature: jix-game, Property 14: Answer recording completeness
  // Validates: Requirements 6.3
  test('answer recording completeness - answer records contain all required fields', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.string({ minLength: 1, maxLength: 50 }), // playerId
        fc.string({ minLength: 1, maxLength: 50 }), // playerName
        fc.string({ minLength: 1, maxLength: 100 }), // question text
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            text: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 2, maxLength: 6 }
        ), // answer options
        fc.nat(), // index for correct answer
        fc.nat(), // index for player's answer
        (category, hostId, hostName, playerId, playerName, questionText, options, correctIndex, answerIndex) => {
          // Ensure we have valid indices
          fc.pre(options.length >= 2);
          const correctAnswerIndex = correctIndex % options.length;
          const playerAnswerIndex = answerIndex % options.length;
          
          // Ensure all option IDs are unique
          const optionIds = options.map(o => o.id);
          fc.pre(new Set(optionIds).size === optionIds.length);
          
          // Ensure player is different from host
          fc.pre(playerId !== hostId);

          // Create fresh services for each property test run
          const geminiService = new GeminiService('test-api-key');
          const roomManager = new RoomManager();
          const gameEngine = new GameEngine(geminiService, roomManager);

          // Create room and add participant
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;
          
          roomManager.addParticipant(roomCode, {
            id: playerId,
            name: playerName,
            isHost: false,
            score: 0,
            connected: true,
          });

          // Create a mock question
          const mockQuestion: Question = {
            id: 'test-q-' + Math.random(),
            text: questionText,
            options: options as AnswerOption[],
            correctAnswerId: options[correctAnswerIndex]!.id,
            category: category,
          };

          // Set up round state manually
          const roundState = {
            question: mockQuestion,
            answers: new Map(),
            startTime: Date.now(),
          };
          const beforeSubmitTime = Date.now();
          (gameEngine as any).roundStates.set(roomCode, roundState);

          // Update room with current question
          const updatedRoom = roomManager.getRoom(roomCode);
          if (updatedRoom) {
            updatedRoom.currentQuestion = mockQuestion;
          }

          // Submit answer
          const answerId = options[playerAnswerIndex]!.id;
          const submitResult = gameEngine.submitAnswer(roomCode, playerId, answerId);

          // Property: Submission should succeed
          expect(submitResult).toBe(true);

          // Get the recorded answer
          const state = gameEngine.getRoundState(roomCode);
          const recordedAnswer = state?.answers.get(playerId);

          // Property: Answer record should contain participant ID
          expect(recordedAnswer).toBeDefined();
          expect(recordedAnswer?.playerId).toBe(playerId);

          // Property: Answer record should contain answer ID
          expect(recordedAnswer?.answerId).toBe(answerId);

          // Property: Answer record should contain timestamp
          expect(recordedAnswer?.timestamp).toBeDefined();
          expect(typeof recordedAnswer?.timestamp).toBe('number');
          expect(recordedAnswer?.timestamp).toBeGreaterThanOrEqual(beforeSubmitTime);
          expect(recordedAnswer?.timestamp).toBeLessThanOrEqual(Date.now());

          // Property: Answer record should contain correctness flag
          expect(recordedAnswer?.isCorrect).toBeDefined();
          expect(typeof recordedAnswer?.isCorrect).toBe('boolean');
          
          // Property: Correctness should match whether answer equals correct answer
          const expectedCorrectness = answerId === mockQuestion.correctAnswerId;
          expect(recordedAnswer?.isCorrect).toBe(expectedCorrectness);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 16: Correct answer score increment
  // Validates: Requirements 7.1
  test('correct answer score increment - score increases by exactly 1 for correct answers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.string({ minLength: 1, maxLength: 50 }), // playerId
        fc.string({ minLength: 1, maxLength: 50 }), // playerName
        fc.string({ minLength: 1, maxLength: 100 }), // question text
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            text: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 2, maxLength: 6 }
        ), // answer options
        fc.nat(), // index for correct answer
        fc.integer({ min: 0, max: 100 }), // initial score
        (category, hostId, hostName, playerId, playerName, questionText, options, correctIndex, initialScore) => {
          // Ensure we have valid indices
          fc.pre(options.length >= 2);
          const correctAnswerIndex = correctIndex % options.length;
          
          // Ensure all option IDs are unique
          const optionIds = options.map(o => o.id);
          fc.pre(new Set(optionIds).size === optionIds.length);
          
          // Ensure player is different from host
          fc.pre(playerId !== hostId);

          // Create fresh services for each property test run
          const geminiService = new GeminiService('test-api-key');
          const roomManager = new RoomManager();
          const gameEngine = new GameEngine(geminiService, roomManager);

          // Create room and add participant with initial score
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;
          
          roomManager.addParticipant(roomCode, {
            id: playerId,
            name: playerName,
            isHost: false,
            score: initialScore,
            connected: true,
          });

          // Create a mock question
          const mockQuestion: Question = {
            id: 'test-q-' + Math.random(),
            text: questionText,
            options: options as AnswerOption[],
            correctAnswerId: options[correctAnswerIndex]!.id,
            category: category,
          };

          // Set up round state manually
          const roundState = {
            question: mockQuestion,
            answers: new Map(),
            startTime: Date.now(),
          };
          (gameEngine as any).roundStates.set(roomCode, roundState);

          // Update room with current question
          const updatedRoom = roomManager.getRoom(roomCode);
          if (updatedRoom) {
            updatedRoom.currentQuestion = mockQuestion;
          }

          // Submit CORRECT answer
          const correctAnswerId = options[correctAnswerIndex]!.id;
          gameEngine.submitAnswer(roomCode, playerId, correctAnswerId);

          // Calculate scores
          const scores = gameEngine.calculateScores(roomCode);
          const playerScore = scores.find(s => s.playerId === playerId);

          // Property: Score should be incremented by exactly 1
          expect(playerScore).toBeDefined();
          expect(playerScore?.score).toBe(initialScore + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 17: Incorrect answer score preservation
  // Validates: Requirements 7.2
  test('incorrect answer score preservation - score remains unchanged for incorrect answers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.string({ minLength: 1, maxLength: 50 }), // playerId
        fc.string({ minLength: 1, maxLength: 50 }), // playerName
        fc.string({ minLength: 1, maxLength: 100 }), // question text
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            text: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 2, maxLength: 6 }
        ), // answer options
        fc.nat(), // index for correct answer
        fc.nat(), // index for incorrect answer
        fc.integer({ min: 0, max: 100 }), // initial score
        (category, hostId, hostName, playerId, playerName, questionText, options, correctIndex, incorrectIndex, initialScore) => {
          // Ensure we have valid indices
          fc.pre(options.length >= 2);
          const correctAnswerIndex = correctIndex % options.length;
          const incorrectAnswerIndex = incorrectIndex % options.length;
          
          // Ensure the incorrect answer is different from correct answer
          fc.pre(correctAnswerIndex !== incorrectAnswerIndex);
          
          // Ensure all option IDs are unique
          const optionIds = options.map(o => o.id);
          fc.pre(new Set(optionIds).size === optionIds.length);
          
          // Ensure player is different from host
          fc.pre(playerId !== hostId);

          // Create fresh services for each property test run
          const geminiService = new GeminiService('test-api-key');
          const roomManager = new RoomManager();
          const gameEngine = new GameEngine(geminiService, roomManager);

          // Create room and add participant with initial score
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;
          
          roomManager.addParticipant(roomCode, {
            id: playerId,
            name: playerName,
            isHost: false,
            score: initialScore,
            connected: true,
          });

          // Create a mock question
          const mockQuestion: Question = {
            id: 'test-q-' + Math.random(),
            text: questionText,
            options: options as AnswerOption[],
            correctAnswerId: options[correctAnswerIndex]!.id,
            category: category,
          };

          // Set up round state manually
          const roundState = {
            question: mockQuestion,
            answers: new Map(),
            startTime: Date.now(),
          };
          (gameEngine as any).roundStates.set(roomCode, roundState);

          // Update room with current question
          const updatedRoom = roomManager.getRoom(roomCode);
          if (updatedRoom) {
            updatedRoom.currentQuestion = mockQuestion;
          }

          // Submit INCORRECT answer
          const incorrectAnswerId = options[incorrectAnswerIndex]!.id;
          gameEngine.submitAnswer(roomCode, playerId, incorrectAnswerId);

          // Calculate scores
          const scores = gameEngine.calculateScores(roomCode);
          const playerScore = scores.find(s => s.playerId === playerId);

          // Property: Score should remain unchanged
          expect(playerScore).toBeDefined();
          expect(playerScore?.score).toBe(initialScore);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 18: Score ranking correctness
  // Validates: Requirements 7.4
  test('score ranking correctness - scores are ordered from highest to lowest', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // category
        fc.string({ minLength: 1, maxLength: 50 }), // hostId
        fc.string({ minLength: 1, maxLength: 50 }), // hostName
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            score: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ), // participants with scores
        (category, hostId, hostName, participants) => {
          // Ensure all participant IDs are unique
          const participantIds = participants.map(p => p.id);
          fc.pre(new Set(participantIds).size === participantIds.length);
          
          // Ensure host is not in the participants list
          fc.pre(!participants.some(p => p.id === hostId));

          // Create fresh services for each property test run
          const geminiService = new GeminiService('test-api-key');
          const roomManager = new RoomManager();
          const gameEngine = new GameEngine(geminiService, roomManager);

          // Create room
          const room = roomManager.createRoom(category, hostId, hostName);
          const roomCode = room.code;

          // Add participants with their scores
          for (const participant of participants) {
            roomManager.addParticipant(roomCode, {
              id: participant.id,
              name: participant.name,
              isHost: false,
              score: participant.score,
              connected: true,
            });
          }

          // Calculate scores (which includes ranking)
          const rankedScores = gameEngine.calculateScores(roomCode);

          // Property: Scores should be ordered from highest to lowest
          for (let i = 0; i < rankedScores.length - 1; i++) {
            const currentScore = rankedScores[i];
            const nextScore = rankedScores[i + 1];
            
            if (currentScore && nextScore) {
              expect(currentScore.score).toBeGreaterThanOrEqual(nextScore.score);
            }
          }

          // Property: Ranks should be assigned correctly (1-indexed)
          // First player should have rank 1
          if (rankedScores[0]) {
            expect(rankedScores[0].rank).toBe(1);
          }

          // Property: Ranks should increase or stay the same (for ties)
          for (let i = 0; i < rankedScores.length - 1; i++) {
            const currentScore = rankedScores[i];
            const nextScore = rankedScores[i + 1];
            
            if (currentScore && nextScore) {
              // If scores are equal, ranks should be equal
              if (currentScore.score === nextScore.score) {
                expect(currentScore.rank).toBe(nextScore.rank);
              } else {
                // If scores are different, next rank should be greater
                expect(nextScore.rank).toBeGreaterThan(currentScore.rank);
              }
            }
          }

          // Property: All original participants should be in the ranked list
          expect(rankedScores.length).toBe(participants.length + 1); // +1 for host

          // Property: Each participant's score should match their original score
          for (const participant of participants) {
            const rankedScore = rankedScores.find(s => s.playerId === participant.id);
            expect(rankedScore).toBeDefined();
            expect(rankedScore?.score).toBe(participant.score);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
