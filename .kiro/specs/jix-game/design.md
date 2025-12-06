# Design Document

## Overview

Jix is a real-time multiplayer quiz game that leverages Google's Gemini AI to generate contextual multiple-choice questions. The application uses a client-server architecture with WebSocket connections for real-time synchronization, React TypeScript for the frontend, and Bun as the runtime environment. The system supports room-based gameplay where a host creates a room with a selected category, participants join via QR code or room search, and all players answer AI-generated questions simultaneously.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  React Client   │         HTTP/REST          │   Bun Server    │
│  (TypeScript)   │◄──────────────────────────►│                 │
│                 │                             │                 │
└─────────────────┘                             └────────┬────────┘
                                                         │
                                                         │ HTTPS
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Gemini AI     │
                                                │  (2.0-flash)    │
                                                └─────────────────┘
```

### Technology Stack

- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Frontend**: React 18+ with TypeScript, Vite for bundling
- **Backend**: Bun HTTP server with WebSocket support
- **Real-time Communication**: WebSockets (ws library or Bun native)
- **AI Service**: Google Gemini API (gemini-2.0-flash model)
- **QR Code Generation**: qrcode library
- **State Management**: React Context API or Zustand
- **Styling**: Tailwind CSS or CSS Modules

### Communication Patterns

1. **REST API**: Initial room creation, room lookup, static data
2. **WebSocket**: Real-time game state synchronization, player actions, question delivery
3. **Server-Sent Events (Alternative)**: One-way real-time updates if WebSocket overhead is unnecessary

## Components and Interfaces

### Frontend Components

#### 1. CategorySelection Component
- Displays text input for custom categories
- Renders predefined category buttons
- Validates input and triggers room creation
- Props: `onCategorySelect: (category: string) => void`

#### 2. RoomLobby Component
- Shows room code and QR code
- Displays list of joined participants
- Provides "Start Game" button for host
- Shows waiting status for non-host participants
- Props: `roomCode: string`, `participants: Player[]`, `isHost: boolean`, `onStartGame: () => void`

#### 3. JoinRoom Component
- Provides room code input field
- Integrates QR code scanner
- Handles room joining logic
- Props: `onJoinSuccess: (roomCode: string) => void`

#### 4. QuestionDisplay Component
- Renders question text
- Displays multiple-choice options as buttons
- Shows timer countdown
- Disables interaction after answer submission
- Props: `question: Question`, `onAnswerSubmit: (answerId: string) => void`, `hasAnswered: boolean`

#### 5. ScoreBoard Component
- Displays current scores for all participants
- Shows rankings
- Highlights current user
- Props: `scores: PlayerScore[]`, `currentUserId: string`

#### 6. ResultsDisplay Component
- Shows correct answer
- Displays who answered correctly
- Shows updated scores
- Provides "Next Question" button for host
- Props: `question: Question`, `correctAnswer: string`, `playerAnswers: PlayerAnswer[]`, `scores: PlayerScore[]`, `isHost: boolean`, `onNextQuestion: () => void`

### Backend Services

#### 1. RoomManager Service
```typescript
interface RoomManager {
  createRoom(category: string, hostId: string): Room;
  getRoom(roomCode: string): Room | null;
  addParticipant(roomCode: string, participant: Player): boolean;
  removeParticipant(roomCode: string, participantId: string): void;
  startGame(roomCode: string): boolean;
  closeRoom(roomCode: string): void;
}
```

#### 2. GeminiService
```typescript
interface GeminiService {
  generateQuestion(category: string, difficulty?: string): Promise<Question>;
  validateApiKey(): Promise<boolean>;
}
```

#### 3. GameEngine Service
```typescript
interface GameEngine {
  startRound(roomCode: string): Promise<void>;
  submitAnswer(roomCode: string, playerId: string, answerId: string): void;
  calculateScores(roomCode: string): PlayerScore[];
  endRound(roomCode: string): RoundResults;
  nextRound(roomCode: string): Promise<void>;
}
```

#### 4. WebSocketManager Service
```typescript
interface WebSocketManager {
  broadcast(roomCode: string, event: GameEvent): void;
  sendToPlayer(playerId: string, event: GameEvent): void;
  handleConnection(ws: WebSocket, playerId: string): void;
  handleDisconnection(playerId: string): void;
}
```

## Data Models

### Core Types

```typescript
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  connected: boolean;
}

interface Room {
  code: string;
  category: string;
  hostId: string;
  participants: Player[];
  gameState: GameState;
  currentQuestion: Question | null;
  questionHistory: Question[];
  createdAt: Date;
}

enum GameState {
  LOBBY = 'LOBBY',
  IN_PROGRESS = 'IN_PROGRESS',
  SHOWING_RESULTS = 'SHOWING_RESULTS',
  ENDED = 'ENDED'
}

interface Question {
  id: string;
  text: string;
  options: AnswerOption[];
  correctAnswerId: string;
  category: string;
  difficulty?: string;
}

interface AnswerOption {
  id: string;
  text: string;
}

interface PlayerAnswer {
  playerId: string;
  answerId: string;
  timestamp: number;
  isCorrect: boolean;
}

interface PlayerScore {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

interface RoundResults {
  question: Question;
  correctAnswerId: string;
  playerAnswers: PlayerAnswer[];
  updatedScores: PlayerScore[];
}

// WebSocket Events
type GameEvent =
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'GAME_STARTED' }
  | { type: 'QUESTION_RECEIVED'; question: Question }
  | { type: 'ANSWER_SUBMITTED'; playerId: string }
  | { type: 'ROUND_ENDED'; results: RoundResults }
  | { type: 'GAME_ENDED'; finalScores: PlayerScore[] }
  | { type: 'ERROR'; message: string };
```

### Gemini API Integration

```typescript
interface GeminiRequest {
  contents: {
    parts: { text: string }[];
  }[];
  generationConfig: {
    responseMimeType: string;
    responseSchema: object;
  };
}

interface GeminiQuestionSchema {
  type: 'object';
  properties: {
    question: { type: 'string' };
    options: {
      type: 'array';
      items: {
        type: 'object';
        properties: {
          id: { type: 'string' };
          text: { type: 'string' };
        };
      };
    };
    correctAnswerId: { type: 'string' };
  };
  required: ['question', 'options', 'correctAnswerId'];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Room Management Properties

**Property 1: Room code uniqueness**
*For any* set of room creation requests, all generated room codes should be unique across the system.
**Validates: Requirements 2.1**

**Property 2: QR code round-trip**
*For any* room code, generating a QR code and then decoding it should yield the original room code.
**Validates: Requirements 2.2, 3.1**

**Property 3: Room creation completeness**
*For any* room creation with a category and host, the resulting room should contain: the host as a participant, the specified category, a valid room code, and be in LOBBY state.
**Validates: Requirements 2.4, 2.5**

### Joining and Participant Management Properties

**Property 4: Valid room join success**
*For any* existing room code, attempting to join with that code should succeed and add the participant to the room's participant list.
**Validates: Requirements 3.2, 3.4**

**Property 5: Invalid room join rejection**
*For any* room code that does not exist in the system, attempting to join should fail with an error and not create any participant records.
**Validates: Requirements 3.3**

**Property 6: Join broadcast consistency**
*For any* participant joining a room, all existing connected participants in that room should receive a PLAYER_JOINED event containing the new participant's information.
**Validates: Requirements 3.5, 9.1**

### Game State Properties

**Property 7: Game start state transition**
*For any* room in LOBBY state, when the host starts the game, the room state should transition to IN_PROGRESS and no new participants should be able to join.
**Validates: Requirements 4.2, 4.3**

**Property 8: Game start broadcast**
*For any* game start event, all participants in the room should receive a GAME_STARTED notification and a QUESTION_RECEIVED event.
**Validates: Requirements 4.4, 6.1**

**Property 9: Post-game state immutability**
*For any* room in IN_PROGRESS or later states, the participant list should not accept new additions.
**Validates: Requirements 4.3**

### Question Generation Properties

**Property 10: Gemini request structure**
*For any* question generation request, the request to Gemini should include the room's category, use structured output format with the question schema, and specify the gemini-2.0-flash model.
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 11: Question response validation**
*For any* response from Gemini AI, if accepted by the system, it must contain a non-empty question text, at least 2 answer options, and a correctAnswerId that matches one of the option IDs.
**Validates: Requirements 5.4**

**Property 12: Retry exhaustion**
*For any* failed Gemini API request, the system should retry up to 3 times, and only after the 3rd failure should it return an error to the user.
**Validates: Requirements 5.5**

### Answer Submission Properties

**Property 13: Answer immutability**
*For any* participant who has submitted an answer in a round, subsequent answer submissions from that participant in the same round should be rejected and the original answer should remain unchanged.
**Validates: Requirements 6.4**

**Property 14: Answer recording completeness**
*For any* answer submission, the system should record the participant ID, answer ID, timestamp, and whether the answer is correct.
**Validates: Requirements 6.3**

**Property 15: Round completion trigger**
*For any* question round, when all participants have submitted answers OR a time limit expires, the system should transition to SHOWING_RESULTS state and broadcast the correct answer.
**Validates: Requirements 6.5, 9.3**

### Scoring Properties

**Property 16: Correct answer score increment**
*For any* participant who submits a correct answer, their score should increase by exactly 1 point.
**Validates: Requirements 7.1**

**Property 17: Incorrect answer score preservation**
*For any* participant who submits an incorrect answer, their score should remain unchanged from before the submission.
**Validates: Requirements 7.2**

**Property 18: Score ranking correctness**
*For any* set of participant scores, when displayed, they should be ordered from highest to lowest score, with ties maintaining stable ordering.
**Validates: Requirements 7.4**

### Real-time Synchronization Properties

**Property 19: Answer submission broadcast**
*For any* answer submission, all participants in the room should receive an ANSWER_SUBMITTED event indicating which participant has answered.
**Validates: Requirements 9.2**

**Property 20: Game state consistency**
*For any* game state change initiated by the host, all connected participants should receive the state update and have consistent game state within 500ms.
**Validates: Requirements 9.4, 9.1**

**Property 21: Disconnect notification**
*For any* participant disconnection, all remaining connected participants should receive a PLAYER_LEFT event and the participant list should be updated to reflect the disconnection.
**Validates: Requirements 9.5**

### Host Control Properties

**Property 22: Next round initiation**
*For any* room in SHOWING_RESULTS state, when the host requests the next question, the system should transition to IN_PROGRESS, generate a new question, and broadcast it to all participants.
**Validates: Requirements 10.2**

**Property 23: Game termination cleanup**
*For any* active game room, when the host ends the game, the system should transition to ENDED state, display final scores, and gracefully disconnect all participants.
**Validates: Requirements 10.3, 10.4**

**Property 24: Host disconnection handling**
*For any* room where the host disconnects, the system should either promote another participant to host (if participants remain) or end the game and close the room.
**Validates: Requirements 10.5**

### Input Validation Properties

**Property 25: Non-empty category validation**
*For any* non-empty, non-whitespace category string, the system should accept it and proceed with room creation.
**Validates: Requirements 1.4**

**Property 26: Empty category rejection**
*For any* category input that is empty or contains only whitespace characters, the system should reject it, prevent room creation, and display an error message.
**Validates: Requirements 1.5**

### Configuration Properties

**Property 27: API key usage**
*For any* API call to Gemini, the request should include the configured API key in the authorization header.
**Validates: Requirements 8.3**

## Error Handling

### Error Categories

1. **Network Errors**
   - WebSocket disconnections: Implement automatic reconnection with exponential backoff
   - HTTP request failures: Retry with timeout limits
   - Gemini API failures: Retry up to 3 times as specified

2. **Validation Errors**
   - Invalid room codes: Return 404 with clear error message
   - Empty category input: Display inline validation error
   - Malformed Gemini responses: Log error and retry request

3. **State Errors**
   - Joining full/started games: Return error with game state explanation
   - Duplicate answer submissions: Silently ignore with log entry
   - Invalid state transitions: Log error and maintain current state

4. **Timeout Errors**
   - Question generation timeout: 30-second limit, fallback to error state
   - Answer submission timeout: Configurable per-question timer
   - WebSocket ping timeout: 60 seconds, trigger reconnection

### Error Recovery Strategies

- **Graceful Degradation**: If Gemini API is unavailable, allow host to input custom questions
- **State Reconciliation**: On reconnection, sync client state with server state
- **Partial Failure Handling**: If some participants disconnect, continue game with remaining players
- **Idempotent Operations**: Ensure duplicate requests (e.g., answer submissions) don't corrupt state

## Testing Strategy

### Unit Testing

The application will use **Vitest** as the testing framework for unit tests, chosen for its excellent TypeScript support, fast execution with Bun, and modern API.

Unit tests will cover:

1. **Component Rendering**: Verify components render with correct props
2. **User Interactions**: Test button clicks, form submissions, input validation
3. **State Management**: Verify state updates and context providers
4. **Service Functions**: Test room code generation, score calculation, QR encoding/decoding
5. **API Integration**: Test Gemini API request formatting and response parsing
6. **Error Boundaries**: Verify error states are handled gracefully

Example unit test areas:
- CategorySelection component renders input and buttons
- Room code generation produces valid alphanumeric codes
- Score calculation correctly increments for correct answers
- QR code encoding/decoding functions work correctly
- Gemini API request builder includes all required fields

### Property-Based Testing

The application will use **fast-check** as the property-based testing library, which integrates well with Vitest and provides powerful generators for TypeScript.

Each property-based test will:
- Run a minimum of 100 iterations to ensure thorough coverage
- Use appropriate generators (strings, numbers, arrays, objects)
- Be tagged with a comment referencing the design document property
- Test universal properties that should hold across all valid inputs

Property-based tests will verify:

1. **Invariants**: Properties that must always hold (e.g., room codes are unique, scores never decrease on wrong answers)
2. **Round-trip Properties**: Operations that should be reversible (e.g., QR encode/decode)
3. **Idempotence**: Operations that can be repeated safely (e.g., duplicate answer submissions)
4. **Metamorphic Properties**: Relationships between inputs and outputs (e.g., score ranking order)
5. **State Transitions**: Valid state machine transitions (e.g., LOBBY → IN_PROGRESS → SHOWING_RESULTS)

Tag format for property-based tests:
```typescript
// Feature: jix-game, Property 1: Room code uniqueness
test.prop([fc.array(fc.string())])('room codes are unique', (categories) => {
  // test implementation
});
```

### Integration Testing

Integration tests will verify:
- WebSocket connection and message flow
- End-to-end game flow from room creation to game completion
- Multiple clients interacting simultaneously
- Gemini API integration with real API calls (in separate test suite)

### Testing Approach

- **Implementation-first development**: Implement features before writing corresponding tests
- **Complementary coverage**: Unit tests catch specific bugs, property tests verify general correctness
- **Fast feedback**: Unit tests run on every change, property tests run in CI/CD
- **Realistic data**: Use generators that produce realistic game scenarios

## Security Considerations

1. **API Key Protection**: Store Gemini API key in environment variables, never expose to client
2. **Input Sanitization**: Validate and sanitize all user inputs (room codes, categories, player names)
3. **Rate Limiting**: Implement rate limits on room creation and API calls to prevent abuse
4. **WebSocket Authentication**: Validate player IDs and room codes on WebSocket connections
5. **CORS Configuration**: Restrict API access to known origins in production

## Performance Considerations

1. **WebSocket Efficiency**: Use binary protocols for large payloads if needed
2. **Caching**: Cache Gemini responses for common categories to reduce API calls
3. **Room Cleanup**: Implement automatic cleanup of inactive rooms after 1 hour
4. **Connection Pooling**: Reuse HTTP connections for Gemini API calls
5. **Lazy Loading**: Load components on-demand to reduce initial bundle size

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│              CDN (Static Assets)            │
│         (React App, Images, CSS)            │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│           Bun Server (Single Instance)      │
│  ┌────────────┐  ┌──────────────────────┐  │
│  │ HTTP API   │  │  WebSocket Server    │  │
│  └────────────┘  └──────────────────────┘  │
│  ┌─────────────────────────────────────┐   │
│  │      In-Memory Room Storage         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│          Google Gemini API                  │
└─────────────────────────────────────────────┘
```

**Deployment Notes**:
- Single Bun server instance for MVP (can scale horizontally with Redis for room state)
- Static assets served via CDN
- Environment variables for API keys and configuration
- Health check endpoint for monitoring
- Graceful shutdown handling for active games
