// Vitest setup file for fast-check integration
import { expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env file for tests
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  // .env file not found or couldn't be read - that's okay
  console.log('Note: .env file not loaded in tests');
}

// Configure fast-check defaults
// Minimum 100 iterations as per design document
export const FC_CONFIG = {
  numRuns: 100,
};
