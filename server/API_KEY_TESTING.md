# Testing Your Gemini API Key

This document explains how to validate that your Gemini API key is properly configured and working.

## Quick Test

The project includes an integration test that validates your API key by making a real call to the Gemini API.

### Running the Test

```bash
npm test server/GeminiService.test.ts
```

### What the Test Does

The integration test will:
1. Check if a valid API key is configured in your `.env` file
2. Make a real API call to generate a quiz question
3. Validate the response structure
4. Confirm the API key is working correctly

### Expected Outcomes

#### ✅ Valid API Key
If your API key is valid, you'll see:
```
✅ Real API key validation successful!
   Generated question: "What is the chemical symbol for gold?..."
   Number of options: 4
```

#### ⚠️ No API Key Configured
If no valid API key is found, the test will skip gracefully:
```
⚠️  Skipping integration test: No valid API key configured in .env
   To run this test, add a valid Gemini API key to your .env file
   Get your API key from: https://aistudio.google.com/app/apikey
```

#### ❌ Invalid API Key
If the API key is invalid, you'll see:
```
❌ API key validation failed: The API key in .env is not valid
   Please check your API key at: https://aistudio.google.com/app/apikey
```

## Getting a Valid API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Add it to your `.env` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## API Key Format

A valid Gemini API key:
- Starts with `AIza`
- Is at least 30 characters long
- Contains alphanumeric characters

## Troubleshooting

### Test Always Skips
- Check that your `.env` file exists in the project root
- Verify the API key starts with `AIza`
- Ensure the key is at least 30 characters long

### API Key Not Valid Error
- Your API key may be expired or revoked
- Generate a new key from Google AI Studio
- Make sure you copied the entire key without extra spaces

### Network Errors
- Check your internet connection
- Verify you can access `https://generativelanguage.googleapis.com`
- Check if your firewall is blocking the request

## Property-Based Tests

In addition to the integration test, the project includes property-based tests that verify:
- API key is included in all requests (Property 27)
- Request structure is correct
- Response validation works properly

These tests use mocked responses and don't require a real API key.
