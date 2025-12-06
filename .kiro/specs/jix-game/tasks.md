# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Initialize Bun project with TypeScript configuration
  - Install React, Vite, and necessary dependencies (ws, qrcode, fast-check, vitest)
  - Configure Vitest for testing with fast-check integration
  - Set up project directory structure (client/, server/, shared/)
  - Create environment configuration for Gemini API key
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 2. Implement shared type definitions and utilities





  - Create TypeScript interfaces for Player, Room, Question, GameState, and events
  - Implement room code generation utility function
  - Implement QR code encoding and decoding utilities
  - _Requirements: 2.1, 2.2_

- [x] 2.1 Write property test for room code generation






  - **Property 1: Room code uniqueness**
  - **Validates: Requirements 2.1**

- [x] 2.2 Write property test for QR code round-trip






  - **Property 2: QR code round-trip**
  - **Validates: Requirements 2.2, 3.1**

- [x] 3. Build backend room management service





  - Implement RoomManager service with in-memory storage
  - Create room creation logic with category and host assignment
  - Implement room lookup by code
  - Add participant management (add, remove, list)
  - Implement room state transitions (LOBBY → IN_PROGRESS → SHOWING_RESULTS → ENDED)
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4_

- [x] 3.1 Write property test for room creation completeness



  - **Property 3: Room creation completeness**
  - **Validates: Requirements 2.4, 2.5**

- [x] 3.2 Write property test for valid room join



  - **Property 4: Valid room join success**
  - **Validates: Requirements 3.2, 3.4**







  - **Property 5: Invalid room join rejection**
  - **Validates: Requirements 3.3**

- [x] 3.4 Write property test for post-game state immutability




  - **Property 9: Post-game state immutability**
  - **Validates: Requirements 4.3**

- [x] 4. Implement Gemini AI integration service





  - Create GeminiService with API client configuration
  - Implement question generation with structured output schema
  - Add request formatting with category and model specification (gemini-2.0-flash)
  - Implement response validation for question structure
  - Add retry logic with exponential backoff (up to 3 attempts)
  - Handle API errors and timeouts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.3_

- [x] 4.1 Write property test for Gemini request structure






  - **Property 10: Gemini request structure**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 4.2 Write property test for question response validation






  - **Property 11: Question response validation**
  - **Validates: Requirements 5.4**

- [x] 4.3 Write property test for retry exhaustion






  - **Property 12: Retry exhaustion**
  - **Validates: Requirements 5.5**
-

- [x] 4.4 Write property test for API key usage





  - **Property 27: API key usage**
  - **Validates: Requirements 8.3**

- [x] 5. Build game engine service








  - Implement GameEngine service for game flow management
  - Create round start logic that fetches questions from Gemini
  - Implement answer submission with validation and timestamp recording
  - Add answer immutability enforcement (reject duplicate submissions)
  - Implement score calculation (increment for correct, preserve for incorrect)
  - Create round completion detection (all answered or timeout)
  - Implement score ranking with sorting logic
  - _Requirements: 6.3, 6.4, 7.1, 7.2, 7.4_

- [x] 5.1 Write property test for answer immutability





  - **Property 13: Answer immutability**
  - **Validates: Requirements 6.4**

- [x] 5.2 Write property test for answer recording completeness



  - **Property 14: Answer recording completeness**
  - **Validates: Requirements 6.3**

- [x] 5.3 Write property test for correct answer score increment



  - **Property 16: Correct answer score increment**
  - **Validates: Requirements 7.1**

- [x] 5.4 Write property test for incorrect answer score preservation



  - **Property 17: Incorrect answer score preservation**
  - **Validates: Requirements 7.2**

- [x] 5.5 Write property test for score ranking correctness




  - **Property 18: Score ranking correctness**
  - **Validates: Requirements 7.4**

- [x] 6. Implement WebSocket server and event broadcasting





  - Set up WebSocket server with Bun
  - Make sure the server uses port 9188 and the client uses 9144
  - Implement connection handling with player ID and room code validation
  - Create broadcast function for room-wide events
  - Implement targeted messaging to specific players
  - Add disconnection handling with cleanup
  - Implement event types (PLAYER_JOINED, PLAYER_LEFT, GAME_STARTED, QUESTION_RECEIVED, etc.)
  - _Requirements: 3.5, 4.4, 6.1, 9.1, 9.2, 9.5_

- [x] 6.1 Write property test for join broadcast consistency






  - **Property 6: Join broadcast consistency**
  - **Validates: Requirements 3.5, 9.1**

- [x] 6.2 Write property test for game start broadcast



  - **Property 8: Game start broadcast**
  - **Validates: Requirements 4.4, 6.1**


- [X] 6.3 Write property test for answer submission broadcast

  - **Property 19: Answer submission broadcast**
  - **Validates: Requirements 9.2**


- [X] 6.4 Write property test for disconnect notification

  - **Property 21: Disconnect notification**
  - **Validates: Requirements 9.5**

- [x] 6.5 Write property test for game state consistency



  - **Property 20: Game state consistency**
  - **Validates: Requirements 9.4, 9.1**

- [x] 7. Create HTTP API endpoints





  - Implement POST /api/rooms endpoint for room creation
  - Implement GET /api/rooms/:code endpoint for room lookup
  - Implement POST /api/rooms/:code/join endpoint for joining rooms
  - Implement POST /api/rooms/:code/start endpoint for starting games (host only)
  - Implement POST /api/rooms/:code/end endpoint for ending games (host only)
  - Add input validation and error handling for all endpoints
  - _Requirements: 2.1, 2.2, 2.3, 3.2, 4.1, 4.2, 10.3_

- [x] 7.1 Write unit tests for API endpoints



  - Test room creation returns valid room data
  - Test room lookup with valid and invalid codes
  - Test join endpoint validation
  - Test host-only endpoint authorization
  - _Requirements: 2.1, 3.2, 3.3_

- [ ] 8. Build React frontend foundation
  - Set up Vite project with React and TypeScript
  - Configure Tailwind CSS for styling
  - Create React Router setup with routes
  - Implement WebSocket client hook for real-time communication
  - Create global state management with Context API or Zustand
  - Add error boundary component
  - _Requirements: 8.2_

- [ ] 9. Implement CategorySelection component
  - Create UI with text input for custom categories
  - Add predefined category buttons below input
  - Implement category validation (non-empty, non-whitespace)
  - Add error message display for invalid input
  - Connect to room creation API
  - Handle loading and error states
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 9.1 Write property test for non-empty category validation
  - **Property 25: Non-empty category validation**
  - **Validates: Requirements 1.4**

- [ ]* 9.2 Write property test for empty category rejection
  - **Property 26: Empty category rejection**
  - **Validates: Requirements 1.5**

- [ ]* 9.3 Write unit tests for CategorySelection component
  - Test input field renders on mount
  - Test category buttons render on mount
  - Test button click triggers callback with correct category
  - Test empty input shows error
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 10. Implement RoomLobby component
  - Display room code prominently
  - Generate and display QR code using qrcode library
  - Show list of joined participants with real-time updates
  - Implement "Start Game" button for host (hidden for non-hosts)
  - Show waiting message for non-host participants
  - Listen for PLAYER_JOINED and PLAYER_LEFT WebSocket events
  - _Requirements: 2.2, 2.3, 3.5, 4.1_

- [ ]* 10.1 Write unit tests for RoomLobby component
  - Test room code and QR code display
  - Test participant list rendering
  - Test start button visibility for host vs non-host
  - _Requirements: 2.3, 4.1_

- [ ] 11. Implement JoinRoom component
  - Create room code input field with validation
  - Add QR code scanner integration (using device camera)
  - Implement room join API call
  - Handle join errors (room not found, game already started)
  - Display success/error messages
  - Redirect to lobby on successful join
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 11.1 Write unit tests for JoinRoom component
  - Test room code input validation
  - Test error display for invalid room codes
  - Test successful join redirects to lobby
  - _Requirements: 3.2, 3.3_

- [ ] 12. Implement QuestionDisplay component
  - Display question text prominently
  - Render answer options as clickable buttons
  - Add optional countdown timer display
  - Disable answer buttons after submission
  - Show visual feedback for selected answer
  - Handle answer submission via WebSocket
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 12.1 Write unit tests for QuestionDisplay component
  - Test question and options render correctly
  - Test answer selection triggers callback
  - Test buttons disabled after submission
  - _Requirements: 6.2, 6.4_

- [ ] 13. Implement ScoreBoard component
  - Display all participants with their current scores
  - Implement ranking display (1st, 2nd, 3rd, etc.)
  - Highlight current user's score
  - Sort participants by score (highest to lowest)
  - Update scores in real-time from WebSocket events
  - _Requirements: 7.3, 7.4_

- [ ]* 13.1 Write unit tests for ScoreBoard component
  - Test scores display in correct order
  - Test current user highlighting
  - Test ranking labels
  - _Requirements: 7.3, 7.4_

- [ ] 14. Implement ResultsDisplay component
  - Show the correct answer highlighted
  - Display which participants answered correctly/incorrectly
  - Show updated scores after the round
  - Implement "Next Question" button for host
  - Show waiting message for non-host participants
  - Handle next round trigger via WebSocket
  - _Requirements: 6.5, 7.3, 10.1, 10.2_

- [ ]* 14.1 Write unit tests for ResultsDisplay component
  - Test correct answer is highlighted
  - Test participant answer status display
  - Test next button visibility for host only
  - _Requirements: 6.5, 10.1_

- [ ] 15. Implement game state management and flow
  - Connect all components with WebSocket event handlers
  - Implement state transitions (LOBBY → IN_PROGRESS → SHOWING_RESULTS)
  - Handle GAME_STARTED event to show first question
  - Handle QUESTION_RECEIVED event to display questions
  - Handle ROUND_ENDED event to show results
  - Handle GAME_ENDED event to show final scores
  - Implement automatic room cleanup on game end
  - _Requirements: 4.2, 4.3, 6.5, 9.3, 9.4, 10.2, 10.3_

- [ ]* 15.1 Write property test for game start state transition
  - **Property 7: Game start state transition**
  - **Validates: Requirements 4.2, 4.3**

- [ ]* 15.2 Write property test for round completion trigger
  - **Property 15: Round completion trigger**
  - **Validates: Requirements 6.5, 9.3**

- [ ]* 15.3 Write property test for next round initiation
  - **Property 22: Next round initiation**
  - **Validates: Requirements 10.2**

- [ ] 16. Implement host controls and game termination
  - Add "End Game" button for host in game view
  - Implement game termination API call
  - Handle graceful disconnection of all participants
  - Display final results screen with rankings
  - Implement host disconnection handling (promote new host or end game)
  - Add cleanup logic for closed rooms
  - _Requirements: 10.3, 10.4, 10.5_

- [ ]* 16.1 Write property test for game termination cleanup
  - **Property 23: Game termination cleanup**
  - **Validates: Requirements 10.3, 10.4**

- [ ]* 16.2 Write property test for host disconnection handling
  - **Property 24: Host disconnection handling**
  - **Validates: Requirements 10.5**

- [ ] 17. Add error handling and edge cases
  - Implement WebSocket reconnection logic with exponential backoff
  - Add timeout handling for question generation (30 seconds)
  - Implement fallback UI for Gemini API failures
  - Add network error displays throughout the app
  - Implement graceful handling of participant disconnections during game
  - Add validation for all user inputs
  - _Requirements: 5.5, 9.5_

- [ ]* 17.1 Write unit tests for error scenarios
  - Test WebSocket reconnection attempts
  - Test API timeout handling
  - Test network error displays
  - _Requirements: 5.5_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Polish UI and add final touches
  - Implement responsive design for mobile and desktop
  - Add loading spinners and skeleton screens
  - Implement smooth transitions between game states
  - Add sound effects or animations for correct/incorrect answers (optional)
  - Improve accessibility (ARIA labels, keyboard navigation)
  - Add favicon and meta tags
  - _Requirements: 1.1, 1.2_

- [ ]* 19.1 Write integration tests for complete game flow
  - Test full flow: create room → join → start → answer questions → view results → end game
  - Test multiple participants playing simultaneously
  - Test host controls throughout game
  - _Requirements: All_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
