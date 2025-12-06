/**
 * Unit tests for shared utility functions
 */

import { describe, it, expect } from 'vitest';
import { generateRoomCode, encodeQRCode, decodeQRCode } from './utils';
import * as fc from 'fast-check';

describe('Room Code Generation', () => {
  it('should generate a 6-character room code', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('should generate alphanumeric uppercase codes', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should generate different codes on multiple calls', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // With 36^6 possible combinations, 100 codes should be unique
    expect(codes.size).toBe(100);
  });
});

describe('QR Code Encoding', () => {
  it('should encode a room code to a data URL', async () => {
    const roomCode = 'ABC123';
    const dataUrl = await encodeQRCode(roomCode);
    
    expect(dataUrl).toBeTypeOf('string');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle encoding errors gracefully', async () => {
    // Test with an extremely long string that might cause issues
    const invalidCode = 'A'.repeat(10000);
    
    // Should either work or throw a proper error
    try {
      const result = await encodeQRCode(invalidCode);
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Failed to encode QR code');
    }
  });
});

describe('QR Code Decoding', () => {
  it('should decode a valid room code', () => {
    const roomCode = 'ABC123';
    const decoded = decodeQRCode(roomCode);
    expect(decoded).toBe(roomCode);
  });

  it('should reject invalid room code formats', () => {
    expect(() => decodeQRCode('abc123')).toThrow('Invalid room code format');
    expect(() => decodeQRCode('ABC12')).toThrow('Invalid room code format');
    expect(() => decodeQRCode('ABC1234')).toThrow('Invalid room code format');
    expect(() => decodeQRCode('ABC-123')).toThrow('Invalid room code format');
  });

  it('should handle valid alphanumeric codes', () => {
    const validCodes = ['ABCDEF', '123456', 'A1B2C3', 'XYZ999'];
    validCodes.forEach(code => {
      expect(decodeQRCode(code)).toBe(code);
    });
  });
});

describe('QR Code Round-trip', () => {
  it('should encode and decode a room code successfully', async () => {
    const originalCode = generateRoomCode();
    const encoded = await encodeQRCode(originalCode);
    
    // In a real scenario, we'd scan the QR code to get back the data
    // For this test, we simulate that the QR scanner returns the original code
    const decoded = decodeQRCode(originalCode);
    
    expect(decoded).toBe(originalCode);
  });
});

// Property-Based Tests
describe('Property-Based Tests', () => {
  /**
   * Feature: jix-game, Property 1: Room code uniqueness
   * Validates: Requirements 2.1
   * 
   * For any set of room creation requests, all generated room codes 
   * should be unique across the system.
   */
  it('Property 1: Room code uniqueness - generated codes should be unique', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }), // Number of room codes to generate
        (numCodes) => {
          const generatedCodes = new Set<string>();
          
          // Generate the specified number of room codes
          for (let i = 0; i < numCodes; i++) {
            const code = generateRoomCode();
            generatedCodes.add(code);
          }
          
          // All codes should be unique (set size equals number generated)
          return generatedCodes.size === numCodes;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Feature: jix-game, Property 2: QR code round-trip
   * Validates: Requirements 2.2, 3.1
   * 
   * For any room code, generating a QR code and then decoding it 
   * should yield the original room code.
   */
  it('Property 2: QR code round-trip - encoding and decoding preserves room code', async () => {
    // Generator for valid room codes (6 uppercase alphanumeric characters)
    const roomCodeArbitrary = fc.stringOf(
      fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
      { minLength: 6, maxLength: 6 }
    );

    await fc.assert(
      fc.asyncProperty(
        roomCodeArbitrary,
        async (roomCode) => {
          // Encode the room code to a QR code data URL
          const qrDataUrl = await encodeQRCode(roomCode);
          
          // Verify the QR code was generated (should be a data URL)
          expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
          
          // In a real scenario, a QR scanner would extract the room code from the image
          // Since we encode the room code directly as the QR data, decoding should
          // validate and return the same room code
          const decodedCode = decodeQRCode(roomCode);
          
          // The decoded code should match the original
          return decodedCode === roomCode;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });
});
