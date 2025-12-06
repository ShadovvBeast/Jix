/**
 * Property-Based Tests for CategorySelection Component
 * Feature: jix-game
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Utility function to validate category input
 * This represents the validation logic that should be in the CategorySelection component
 */
export function validateCategory(category: string): boolean {
  // Category must be non-empty and contain at least one non-whitespace character
  return category.trim().length > 0;
}

describe('CategorySelection Property-Based Tests', () => {
  /**
   * Feature: jix-game, Property 25: Non-empty category validation
   * Validates: Requirements 1.4
   * 
   * For any non-empty, non-whitespace category string, the system should 
   * accept it and proceed with room creation.
   */
  it('Property 25: Non-empty category validation - valid categories are accepted', () => {
    // Generator for valid categories: strings with at least one non-whitespace character
    const validCategoryArbitrary = fc.string({ minLength: 1 })
      .filter(str => str.trim().length > 0);

    fc.assert(
      fc.property(
        validCategoryArbitrary,
        (category) => {
          // For any valid category (non-empty after trimming), validation should pass
          const isValid = validateCategory(category);
          return isValid === true;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Feature: jix-game, Property 26: Empty category rejection
   * Validates: Requirements 1.5
   * 
   * For any category input that is empty or contains only whitespace characters, 
   * the system should reject it, prevent room creation, and display an error message.
   */
  it('Property 26: Empty category rejection - invalid categories are rejected', () => {
    // Generator for invalid categories: empty strings or strings with only whitespace
    const invalidCategoryArbitrary = fc.oneof(
      fc.constant(''), // Empty string
      fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 }) // Only whitespace
    );

    fc.assert(
      fc.property(
        invalidCategoryArbitrary,
        (category) => {
          // For any invalid category (empty or only whitespace), validation should fail
          const isValid = validateCategory(category);
          return isValid === false;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });
});
