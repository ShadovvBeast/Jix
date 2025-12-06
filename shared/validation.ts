/**
 * Input validation utilities
 * Provides validation functions for user inputs throughout the application
 */

/**
 * Validates a room code format
 * Room codes should be 6 alphanumeric characters
 */
export function validateRoomCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  const roomCodePattern = /^[A-Z0-9]{6}$/;
  return roomCodePattern.test(code.toUpperCase());
}

/**
 * Validates a category name
 * Categories must be non-empty and contain at least one non-whitespace character
 */
export function validateCategory(category: string): boolean {
  if (!category || typeof category !== 'string') {
    return false;
  }
  return category.trim().length > 0;
}

/**
 * Validates a player name
 * Player names must be non-empty and within reasonable length
 */
export function validatePlayerName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}

/**
 * Validates a player ID format
 * Player IDs should follow the pattern: player-{timestamp}-{random}
 */
export function validatePlayerId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  const playerIdPattern = /^player-\d+-[a-z0-9]+$/;
  return playerIdPattern.test(id);
}

/**
 * Sanitizes user input by trimming whitespace and limiting length
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input.trim().substring(0, maxLength);
}

/**
 * Validates an answer ID
 * Answer IDs should be non-empty strings
 */
export function validateAnswerId(answerId: string): boolean {
  if (!answerId || typeof answerId !== 'string') {
    return false;
  }
  return answerId.trim().length > 0;
}
