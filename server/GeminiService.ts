/**
 * GeminiService - Handles AI question generation using Google Gemini API
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.3
 */

import type { Question, AnswerOption } from '../shared/types';

interface GeminiQuestionResponse {
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswerId: string;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private maxRetries = 3;
  private timeout = 30000; // 30 seconds

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  /**
   * Generate a quiz question for the given category
   * Requirement 5.1: Send request with category
   * Requirement 5.2: Use structured output format
   * Requirement 5.3: Use gemini-2.5-flash model
   */
  async generateQuestion(category: string, difficulty?: string): Promise<Question> {
    let lastError: Error | null = null;

    // Requirement 5.5: Retry up to 3 times
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const question = await this.makeRequest(category, difficulty, attempt);
        return question;
      } catch (error) {
        lastError = error as Error;
        
        // If this is the last attempt, throw the error
        if (attempt === this.maxRetries - 1) {
          break;
        }

        // Exponential backoff: wait 2^attempt seconds
        const backoffMs = Math.pow(2, attempt) * 1000;
        await this.sleep(backoffMs);
      }
    }

    throw new Error(`Failed to generate question after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Make a single request to Gemini API
   */
  private async makeRequest(category: string, difficulty: string | undefined, attempt: number): Promise<Question> {
    const prompt = this.buildPrompt(category, difficulty);
    const requestBody = this.buildRequestBody(prompt);

    // Requirement 8.3: Use API key in request
    const url = `${this.baseUrl}?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as GeminiApiResponse;
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json() as GeminiApiResponse;

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      // Extract and parse the response
      const questionData = this.parseResponse(data);
      
      // Requirement 5.4: Validate response structure
      this.validateQuestionResponse(questionData);

      // Convert to Question format
      return this.convertToQuestion(questionData, category, difficulty);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 30 seconds');
      }
      
      throw error;
    }
  }

  /**
   * Build the prompt for question generation
   */
  private buildPrompt(category: string, difficulty?: string): string {
    const difficultyText = difficulty ? ` at ${difficulty} difficulty level` : '';
    return `Generate a multiple-choice quiz question about ${category}${difficultyText}. 
The question should have exactly 4 answer options, with one correct answer. 
Make the question engaging and educational.`;
  }

  /**
   * Build the request body with structured output schema
   * Requirement 5.2: Use structured output format
   */
  private buildRequestBody(prompt: string) {
    return {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The quiz question text',
            },
            options: {
              type: 'array',
              description: 'Array of answer options',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Unique identifier for the option (e.g., "a", "b", "c", "d")',
                  },
                  text: {
                    type: 'string',
                    description: 'The answer option text',
                  },
                },
                required: ['id', 'text'],
              },
            },
            correctAnswerId: {
              type: 'string',
              description: 'The id of the correct answer option',
            },
          },
          required: ['question', 'options', 'correctAnswerId'],
        },
      },
    };
  }

  /**
   * Parse the Gemini API response
   */
  private parseResponse(data: GeminiApiResponse): GeminiQuestionResponse {
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response candidates from Gemini API');
    }

    const candidate = data.candidates[0];
    if (!candidate || !candidate.content) {
      throw new Error('Invalid candidate structure in Gemini API response');
    }

    const content = candidate.content;
    if (!content.parts || content.parts.length === 0) {
      throw new Error('No content parts in Gemini API response');
    }

    const part = content.parts[0];
    if (!part || !part.text) {
      throw new Error('No text content in Gemini API response');
    }

    const textContent = part.text;
    
    try {
      return JSON.parse(textContent) as GeminiQuestionResponse;
    } catch (error) {
      throw new Error(`Failed to parse Gemini response as JSON: ${error}`);
    }
  }

  /**
   * Validate the question response structure
   * Requirement 5.4: Validate response contains required fields
   */
  private validateQuestionResponse(data: GeminiQuestionResponse): void {
    // Check for non-empty question text
    if (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
      throw new Error('Invalid response: question text is missing or empty');
    }

    // Check for at least 2 answer options
    if (!Array.isArray(data.options) || data.options.length < 2) {
      throw new Error('Invalid response: must have at least 2 answer options');
    }

    // Check that all options have id and text
    for (const option of data.options) {
      if (!option.id || typeof option.id !== 'string') {
        throw new Error('Invalid response: option missing id');
      }
      if (!option.text || typeof option.text !== 'string') {
        throw new Error('Invalid response: option missing text');
      }
    }

    // Check that correctAnswerId exists and matches one of the option IDs
    if (!data.correctAnswerId || typeof data.correctAnswerId !== 'string') {
      throw new Error('Invalid response: correctAnswerId is missing');
    }

    const optionIds = data.options.map(opt => opt.id);
    if (!optionIds.includes(data.correctAnswerId)) {
      throw new Error('Invalid response: correctAnswerId does not match any option id');
    }
  }

  /**
   * Convert Gemini response to Question format
   */
  private convertToQuestion(data: GeminiQuestionResponse, category: string, difficulty: string | undefined): Question {
    const options: AnswerOption[] = data.options.map(opt => ({
      id: opt.id,
      text: opt.text,
    }));

    return {
      id: this.generateQuestionId(),
      text: data.question,
      options,
      correctAnswerId: data.correctAnswerId,
      category,
      ...(difficulty && { difficulty }),
    };
  }

  /**
   * Generate a unique question ID
   */
  private generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Validate that the API key is configured
   */
  async validateApiKey(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  /**
   * Sleep utility for exponential backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
