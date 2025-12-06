/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateRoomCode,
  validateCategory,
  validatePlayerName,
  validatePlayerId,
  sanitizeInput,
  validateAnswerId,
} from './validation';

describe('Validation Utilities', () => {
  describe('validateRoomCode', () => {
    it('should accept valid 6-character alphanumeric codes', () => {
      expect(validateRoomCode('ABC123')).toBe(true);
      expect(validateRoomCode('XYZ789')).toBe(true);
      expect(validateRoomCode('000000')).toBe(true);
      expect(validateRoomCode('AAAAAA')).toBe(true);
    });

    it('should accept lowercase codes (case insensitive)', () => {
      expect(validateRoomCode('abc123')).toBe(true);
      expect(validateRoomCode('xyz789')).toBe(true);
    });

    it('should reject codes with wrong length', () => {
      expect(validateRoomCode('ABC12')).toBe(false); // Too short
      expect(validateRoomCode('ABC1234')).toBe(false); // Too long
      expect(validateRoomCode('')).toBe(false); // Empty
    });

    it('should reject codes with special characters', () => {
      expect(validateRoomCode('ABC-12')).toBe(false);
      expect(validateRoomCode('ABC 12')).toBe(false);
      expect(validateRoomCode('ABC@12')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateRoomCode(null as any)).toBe(false);
      expect(validateRoomCode(undefined as any)).toBe(false);
      expect(validateRoomCode(123456 as any)).toBe(false);
    });
  });

  describe('validateCategory', () => {
    it('should accept non-empty categories', () => {
      expect(validateCategory('Science')).toBe(true);
      expect(validateCategory('History')).toBe(true);
      expect(validateCategory('A')).toBe(true);
    });

    it('should reject empty or whitespace-only categories', () => {
      expect(validateCategory('')).toBe(false);
      expect(validateCategory('   ')).toBe(false);
      expect(validateCategory('\t\n')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateCategory(null as any)).toBe(false);
      expect(validateCategory(undefined as any)).toBe(false);
      expect(validateCategory(123 as any)).toBe(false);
    });

    it('should accept categories with leading/trailing whitespace', () => {
      expect(validateCategory('  Science  ')).toBe(true);
    });
  });

  describe('validatePlayerName', () => {
    it('should accept valid player names', () => {
      expect(validatePlayerName('Player1')).toBe(true);
      expect(validatePlayerName('John Doe')).toBe(true);
      expect(validatePlayerName('A')).toBe(true);
    });

    it('should reject empty or whitespace-only names', () => {
      expect(validatePlayerName('')).toBe(false);
      expect(validatePlayerName('   ')).toBe(false);
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(51);
      expect(validatePlayerName(longName)).toBe(false);
    });

    it('should accept names up to 50 characters', () => {
      const maxName = 'A'.repeat(50);
      expect(validatePlayerName(maxName)).toBe(true);
    });

    it('should reject non-string inputs', () => {
      expect(validatePlayerName(null as any)).toBe(false);
      expect(validatePlayerName(undefined as any)).toBe(false);
    });
  });

  describe('validatePlayerId', () => {
    it('should accept valid player ID format', () => {
      expect(validatePlayerId('player-1234567890-abc123')).toBe(true);
      expect(validatePlayerId('player-9999999999-xyz789')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validatePlayerId('player-abc-123')).toBe(false); // Non-numeric timestamp
      expect(validatePlayerId('user-1234567890-abc123')).toBe(false); // Wrong prefix
      expect(validatePlayerId('player-1234567890')).toBe(false); // Missing random part
      expect(validatePlayerId('1234567890-abc123')).toBe(false); // Missing prefix
    });

    it('should reject non-string inputs', () => {
      expect(validatePlayerId(null as any)).toBe(false);
      expect(validatePlayerId(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
      expect(sanitizeInput('\thello\n')).toBe('hello');
    });

    it('should limit length to default 100 characters', () => {
      const longInput = 'A'.repeat(150);
      const result = sanitizeInput(longInput);
      expect(result.length).toBe(100);
    });

    it('should limit length to custom max length', () => {
      const input = 'A'.repeat(100);
      const result = sanitizeInput(input, 50);
      expect(result.length).toBe(50);
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('validateAnswerId', () => {
    it('should accept non-empty answer IDs', () => {
      expect(validateAnswerId('a')).toBe(true);
      expect(validateAnswerId('option-1')).toBe(true);
      expect(validateAnswerId('123')).toBe(true);
    });

    it('should reject empty or whitespace-only IDs', () => {
      expect(validateAnswerId('')).toBe(false);
      expect(validateAnswerId('   ')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateAnswerId(null as any)).toBe(false);
      expect(validateAnswerId(undefined as any)).toBe(false);
    });
  });
});
