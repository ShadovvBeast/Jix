/**
 * GameEngine Service
 * Manages game flow, question rounds, answer submissions, and scoring
 * 
 * Requirements: 6.3, 6.4, 7.1, 7.2, 7.4
 */

import type { Question, PlayerAnswer, PlayerScore, RoundResults, Room } from '../shared/types';
import { GameState } from '../shared/types';
import { GeminiService } from './GeminiService';
import { RoomManager } from './RoomManager';

interface RoundState {
  question: Question;
  answers: Map<string, PlayerAnswer>; // playerId -> PlayerAnswer
  startTime: number;
}

export class GameEngine {
  private geminiService: GeminiService;
  private roomManager: RoomManager;
  private roundStates: Map<string, RoundState> = new Map(); // roomCode -> RoundState

  constructor(geminiService: GeminiService, roomManager: RoomManager) {
    this.geminiService = geminiService;
    this.roomManager = roomManager;
  }

  /**
   * Start a new round by fetching a question from Gemini
   * Requirement 6.1: Display question to all participants
   * @param roomCode - The room code
   * @returns The generated question
   * @throws Error if room not found or question generation fails
   */
  async startRound(roomCode: string): Promise<Question> {
    const room = this.roomManager.getRoom(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    // Generate question using Gemini
    const question = await this.geminiService.generateQuestion(room.category);

    // Initialize round state
    this.roundStates.set(roomCode, {
      question,
      answers: new Map(),
      startTime: Date.now(),
    });

    // Update room with current question
    room.currentQuestion = question;
    room.questionHistory.push(question);

    return question;
  }

  /**
   * Submit an answer for a player
   * Requirement 6.3: Record response and timestamp
   * Requirement 6.4: Prevent changing response (answer immutability)
   * @param roomCode - The room code
   * @param playerId - The player ID
   * @param answerId - The selected answer ID
   * @returns true if submission successful, false if duplicate or invalid
   */
  submitAnswer(roomCode: string, playerId: string, answerId: string): boolean {
    const roundState = this.roundStates.get(roomCode);
    
    if (!roundState) {
      throw new Error('No active round for this room');
    }

    // Requirement 6.4: Enforce answer immutability - reject duplicate submissions
    if (roundState.answers.has(playerId)) {
      return false;
    }

    const room = this.roomManager.getRoom(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }

    // Validate that the player is in the room
    const player = room.participants.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not in room');
    }

    // Validate that the answer ID is valid
    const isValidAnswer = roundState.question.options.some(opt => opt.id === answerId);
    if (!isValidAnswer) {
      throw new Error('Invalid answer ID');
    }

    // Requirement 6.3: Record answer with timestamp and correctness
    const isCorrect = answerId === roundState.question.correctAnswerId;
    const playerAnswer: PlayerAnswer = {
      playerId,
      answerId,
      timestamp: Date.now(),
      isCorrect,
    };

    roundState.answers.set(playerId, playerAnswer);

    return true;
  }

  /**
   * Calculate scores for all players in a room
   * Requirement 7.1: Increment score for correct answers
   * Requirement 7.2: Maintain score for incorrect answers
   * @param roomCode - The room code
   * @returns Array of player scores
   */
  calculateScores(roomCode: string): PlayerScore[] {
    const room = this.roomManager.getRoom(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    const roundState = this.roundStates.get(roomCode);

    // Update player scores based on current round answers
    if (roundState) {
      for (const participant of room.participants) {
        const answer = roundState.answers.get(participant.id);
        
        if (answer && answer.isCorrect) {
          // Requirement 7.1: Increment score for correct answer
          participant.score += 1;
        }
        // Requirement 7.2: Score preserved for incorrect answers (no change)
      }
    }

    // Create score array with rankings
    const scores: PlayerScore[] = room.participants.map(p => ({
      playerId: p.id,
      playerName: p.name,
      score: p.score,
      rank: 0, // Will be set by ranking logic
    }));

    // Requirement 7.4: Rank players from highest to lowest score
    return this.rankScores(scores);
  }

  /**
   * Rank scores from highest to lowest
   * Requirement 7.4: Sort participants by score
   * @param scores - Array of player scores
   * @returns Sorted array with rank assigned
   */
  private rankScores(scores: PlayerScore[]): PlayerScore[] {
    // Sort by score descending (highest first)
    const sorted = [...scores].sort((a, b) => b.score - a.score);

    // Assign ranks (1-indexed)
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      const currentScore = sorted[i];
      const prevScore = sorted[i - 1];
      
      if (i > 0 && currentScore && prevScore && currentScore.score < prevScore.score) {
        currentRank = i + 1;
      }
      
      if (currentScore) {
        currentScore.rank = currentRank;
      }
    }

    return sorted;
  }

  /**
   * End the current round and get results
   * Requirement 6.5: Reveal correct answer when round completes
   * @param roomCode - The room code
   * @returns Round results including correct answer and player answers
   */
  endRound(roomCode: string): RoundResults {
    const roundState = this.roundStates.get(roomCode);
    
    if (!roundState) {
      throw new Error('No active round for this room');
    }

    // Calculate updated scores
    const updatedScores = this.calculateScores(roomCode);

    // Collect all player answers
    const playerAnswers = Array.from(roundState.answers.values());

    const results: RoundResults = {
      question: roundState.question,
      correctAnswerId: roundState.question.correctAnswerId,
      playerAnswers,
      updatedScores,
    };

    return results;
  }

  /**
   * Check if all participants have answered
   * Requirement 6.5: Detect when all participants have answered
   * @param roomCode - The room code
   * @returns true if all connected participants have answered
   */
  hasAllAnswered(roomCode: string): boolean {
    const room = this.roomManager.getRoom(roomCode);
    const roundState = this.roundStates.get(roomCode);

    if (!room || !roundState) {
      return false;
    }

    // Count connected participants
    const connectedParticipants = room.participants.filter(p => p.connected);
    
    // Check if all connected participants have submitted answers
    return connectedParticipants.every(p => roundState.answers.has(p.id));
  }

  /**
   * Start the next round
   * Requirement 10.2: Initiate new question round
   * @param roomCode - The room code
   * @returns The new question
   */
  async nextRound(roomCode: string): Promise<Question> {
    // Clear previous round state
    this.roundStates.delete(roomCode);

    // Start new round
    return await this.startRound(roomCode);
  }

  /**
   * Get the current round state for a room
   * @param roomCode - The room code
   * @returns The round state or null if no active round
   */
  getRoundState(roomCode: string): RoundState | null {
    return this.roundStates.get(roomCode) || null;
  }

  /**
   * Clear round state for a room (used when game ends)
   * @param roomCode - The room code
   */
  clearRoundState(roomCode: string): void {
    this.roundStates.delete(roomCode);
  }
}
