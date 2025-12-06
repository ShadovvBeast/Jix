# Jix Frontend

React + TypeScript frontend for the Jix multiplayer quiz game.

## Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── ErrorBoundary.tsx
│   ├── context/          # Global state management
│   │   └── GameContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useWebSocket.ts
│   ├── pages/            # Route pages
│   │   ├── Home.tsx
│   │   ├── CreateRoom.tsx
│   │   ├── JoinRoom.tsx
│   │   ├── Lobby.tsx
│   │   └── Game.tsx
│   ├── App.tsx           # Main app with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Tailwind CSS
└── index.html
```

## Features

- **React Router**: Client-side routing with routes for home, create room, join room, lobby, and game
- **Tailwind CSS**: Utility-first CSS framework for styling
- **WebSocket Hook**: Custom hook for real-time communication with exponential backoff reconnection
- **Global State**: Context API for managing game state across components
- **Error Boundary**: Catches and displays errors gracefully

## Routes

- `/` - Home page with create/join options
- `/create` - Category selection and room creation
- `/join` - Join room by code or QR scan
- `/lobby/:roomCode` - Room lobby before game starts
- `/game/:roomCode` - Active game interface

## Development

```bash
# Start dev server (port 9144)
bun run dev:client

# Build for production
bun run build:client
```
