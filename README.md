# Jix - Multiplayer Quiz Game

A real-time multiplayer quiz game powered by Google Gemini AI.

## Project Structure

```
jix-game/
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Bun backend (WebSocket + HTTP API)
├── shared/          # Shared types and utilities
├── test/            # Test configuration and utilities
└── .env             # Environment configuration
```

## Setup

1. Install dependencies:
```bash
bun install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Add your Gemini API key to .env
```

## Development

Run the client (Vite dev server):
```bash
bun run dev:client
```

Run the server (Bun with watch mode):
```bash
bun run dev:server
```

## Testing

Run tests once:
```bash
bun test
```

Run tests in watch mode:
```bash
bun run test:watch
```

## Tech Stack

- **Runtime**: Bun
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Bun HTTP + WebSocket
- **AI**: Google Gemini API (gemini-2.0-flash)
- **Testing**: Vitest + fast-check (property-based testing)
- **QR Codes**: qrcode library
Jix - Jix Your Mind
