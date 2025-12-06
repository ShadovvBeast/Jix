/**
 * Property-based tests for GeminiService
 * Using fast-check for property-based testing
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { GeminiService } from './GeminiService';

describe('GeminiService Property-Based Tests', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // Feature: jix-game, Property 10: Gemini request structure
  // Validates: Requirements 5.1, 5.2, 5.3
  test('Gemini request structure - request includes category, structured output, and correct model', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // category (non-whitespace)
        fc.option(fc.constantFrom('easy', 'medium', 'hard'), { nil: undefined }), // difficulty (optional)
        async (category, difficulty) => {
          // Mock fetch to capture the request
          let capturedUrl: string | undefined;
          let capturedRequestBody: any;

          global.fetch = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
            capturedUrl = url.toString();
            if (options?.body) {
              capturedRequestBody = JSON.parse(options.body as string);
            }

            // Return a valid mock response
            return new Response(
              JSON.stringify({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            question: 'Sample question?',
                            options: [
                              { id: 'a', text: 'Option A' },
                              { id: 'b', text: 'Option B' },
                              { id: 'c', text: 'Option C' },
                              { id: 'd', text: 'Option D' },
                            ],
                            correctAnswerId: 'a',
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }) as any;

          // Create service and generate question
          const service = new GeminiService('test-api-key');
          await service.generateQuestion(category, difficulty);

          // Property 1: Request URL should contain the correct model endpoint
          // Requirement 5.3: Use gemini-2.5-flash model
          expect(capturedUrl).toBeDefined();
          expect(capturedUrl).toContain('gemini-2.5-flash:generateContent');

          // Property 2: Request should include API key
          // Requirement 8.3: Use API key in request
          expect(capturedUrl).toContain('key=test-api-key');

          // Property 3: Request body should have structured output format
          // Requirement 5.2: Use structured output format
          expect(capturedRequestBody).toBeDefined();
          expect(capturedRequestBody.generationConfig).toBeDefined();
          expect(capturedRequestBody.generationConfig.responseMimeType).toBe('application/json');
          expect(capturedRequestBody.generationConfig.responseSchema).toBeDefined();

          // Property 4: Response schema should match the expected structure
          const schema = capturedRequestBody.generationConfig.responseSchema;
          expect(schema.type).toBe('object');
          expect(schema.properties).toBeDefined();
          expect(schema.properties.question).toBeDefined();
          expect(schema.properties.options).toBeDefined();
          expect(schema.properties.correctAnswerId).toBeDefined();
          expect(schema.required).toEqual(['question', 'options', 'correctAnswerId']);

          // Property 5: Request should include the category in the prompt
          // Requirement 5.1: Send request with category
          expect(capturedRequestBody.contents).toBeDefined();
          expect(capturedRequestBody.contents).toHaveLength(1);
          expect(capturedRequestBody.contents[0].parts).toBeDefined();
          expect(capturedRequestBody.contents[0].parts).toHaveLength(1);
          
          const promptText = capturedRequestBody.contents[0].parts[0].text;
          expect(promptText).toBeDefined();
          expect(promptText).toContain(category);

          // Property 6: If difficulty is provided, it should be in the prompt
          if (difficulty) {
            expect(promptText).toContain(difficulty);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 11: Question response validation
  // Validates: Requirements 5.4
  test('Question response validation - accepted responses have valid structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // non-empty question text
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            text: fc.string({ minLength: 1, maxLength: 200 })
          }),
          { minLength: 2, maxLength: 6 } // at least 2 options
        ),
        fc.nat(), // index for correct answer
        async (questionText, options, correctAnswerIndex) => {
          // Ensure correctAnswerId matches one of the option IDs
          const correctAnswerId = options[correctAnswerIndex % options.length].id;

          // Mock fetch to return the generated response
          global.fetch = vi.fn(async () => {
            return new Response(
              JSON.stringify({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            question: questionText,
                            options: options,
                            correctAnswerId: correctAnswerId,
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }) as any;

          // Create service and generate question
          const service = new GeminiService('test-api-key');
          const result = await service.generateQuestion('test-category');

          // Property 1: Result should have non-empty question text
          expect(result.text).toBeDefined();
          expect(typeof result.text).toBe('string');
          expect(result.text.trim().length).toBeGreaterThan(0);

          // Property 2: Result should have at least 2 answer options
          expect(result.options).toBeDefined();
          expect(Array.isArray(result.options)).toBe(true);
          expect(result.options.length).toBeGreaterThanOrEqual(2);

          // Property 3: All options should have id and text
          for (const option of result.options) {
            expect(option.id).toBeDefined();
            expect(typeof option.id).toBe('string');
            expect(option.text).toBeDefined();
            expect(typeof option.text).toBe('string');
          }

          // Property 4: correctAnswerId should match one of the option IDs
          expect(result.correctAnswerId).toBeDefined();
          expect(typeof result.correctAnswerId).toBe('string');
          const optionIds = result.options.map(opt => opt.id);
          expect(optionIds).toContain(result.correctAnswerId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 12: Retry exhaustion
  // Validates: Requirements 5.5
  test('Retry exhaustion - system retries up to 3 times before returning error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // category
        fc.constantFrom(
          'Network error',
          'API timeout',
          'Invalid response',
          'Server error'
        ), // error type
        async (category, errorType) => {
          // Track the number of fetch calls
          let fetchCallCount = 0;

          // Mock fetch to always fail
          global.fetch = vi.fn(async () => {
            fetchCallCount++;
            
            // Simulate different types of failures
            if (errorType === 'Network error') {
              throw new Error('Network request failed');
            } else if (errorType === 'API timeout') {
              throw new Error('Request timeout');
            } else if (errorType === 'Invalid response') {
              return new Response(
                JSON.stringify({
                  error: {
                    message: 'Invalid request',
                    code: 400
                  }
                }),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            } else {
              return new Response(
                JSON.stringify({
                  error: {
                    message: 'Internal server error',
                    code: 500
                  }
                }),
                {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }
          }) as any;

          // Mock setTimeout to return immediately (no delays)
          // This avoids the complexity of fake timers while still testing retry logic
          const originalSetTimeout = global.setTimeout;
          global.setTimeout = ((callback: () => void) => {
            callback();
            return 0 as any;
          }) as any;

          try {
            // Create service and attempt to generate question
            const service = new GeminiService('test-api-key');
            
            // Property 1: The request should fail after retries
            let errorThrown = false;
            try {
              await service.generateQuestion(category);
            } catch (error) {
              errorThrown = true;
            }
            
            expect(errorThrown).toBe(true);

            // Property 2: The system should have made exactly 3 attempts
            // Requirement 5.5: Retry up to 3 times before displaying an error
            expect(fetchCallCount).toBe(3);
          } finally {
            // Restore original setTimeout
            global.setTimeout = originalSetTimeout;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: jix-game, Property 27: API key usage
  // Validates: Requirements 8.3
  test('API key usage - all API calls include the configured API key', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }), // API key (realistic length)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // category
        fc.option(fc.constantFrom('easy', 'medium', 'hard'), { nil: undefined }), // difficulty (optional)
        async (apiKey, category, difficulty) => {
          // Track the captured URL
          let capturedUrl: string | undefined;

          // Mock fetch to capture the request URL
          global.fetch = vi.fn(async (url: string | URL | Request) => {
            capturedUrl = url.toString();

            // Return a valid mock response
            return new Response(
              JSON.stringify({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            question: 'Sample question?',
                            options: [
                              { id: 'a', text: 'Option A' },
                              { id: 'b', text: 'Option B' },
                            ],
                            correctAnswerId: 'a',
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }) as any;

          // Create service with the generated API key
          const service = new GeminiService(apiKey);
          await service.generateQuestion(category, difficulty);

          // Property: The request URL should include the configured API key
          // Requirement 8.3: Use the provided Gemini API key
          expect(capturedUrl).toBeDefined();
          expect(capturedUrl).toContain(`key=${apiKey}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
