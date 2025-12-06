# Requirements Document

## Introduction

Jix is a multiplayer quiz game that uses AI (Google Gemini) to generate multiple-choice questions based on user-selected categories. Players can create rooms, invite others via QR code or room search, and compete by answering AI-generated questions in real-time.

## Glossary

- **Jix System**: The complete multiplayer quiz game application
- **Game Room**: A virtual space where multiple participants join to play together
- **Room Host**: The user who creates a Game Room
- **Participant**: A user who joins a Game Room to play
- **Category**: A topic area for quiz questions (e.g., Science, History, Sports)
- **Question Round**: A single multiple-choice question presented to all Participants
- **Gemini AI**: Google's AI service used to generate quiz questions
- **QR Code**: A scannable code that allows quick room joining
- **Room Code**: A unique identifier for a Game Room

## Requirements

### Requirement 1

**User Story:** As a user, I want to select a quiz category, so that I can start a game on a topic I'm interested in.

#### Acceptance Criteria

1. WHEN the Jix System starts, THEN the Jix System SHALL display a text input field for custom category entry
2. WHEN the Jix System starts, THEN the Jix System SHALL display category buttons below the input field with predefined options
3. WHEN a user clicks a category button, THEN the Jix System SHALL select that category and proceed to room creation
4. WHEN a user types a custom category and submits, THEN the Jix System SHALL validate the input is non-empty and proceed to room creation
5. WHEN a user submits an empty category, THEN the Jix System SHALL prevent room creation and display an error message

### Requirement 2

**User Story:** As a room host, I want to create a game room after selecting a category, so that other players can join my game.

#### Acceptance Criteria

1. WHEN a category is selected, THEN the Jix System SHALL create a unique Game Room with a Room Code
2. WHEN a Game Room is created, THEN the Jix System SHALL generate a QR Code containing the Room Code
3. WHEN a Game Room is created, THEN the Jix System SHALL display the Room Code and QR Code to the Room Host
4. WHEN a Game Room is created, THEN the Jix System SHALL store the selected category with the Game Room
5. WHEN a Game Room is created, THEN the Jix System SHALL add the Room Host as the first Participant

### Requirement 3

**User Story:** As a participant, I want to join a game room using a QR code or room search, so that I can play with others.

#### Acceptance Criteria

1. WHEN a user scans a QR Code, THEN the Jix System SHALL extract the Room Code and join the corresponding Game Room
2. WHEN a user searches for a room by Room Code, THEN the Jix System SHALL validate the code exists and join that Game Room
3. WHEN a user attempts to join a non-existent room, THEN the Jix System SHALL display an error message and prevent joining
4. WHEN a user successfully joins a Game Room, THEN the Jix System SHALL add them to the Participant list
5. WHEN a user joins a Game Room, THEN the Jix System SHALL notify all existing Participants of the new arrival

### Requirement 4

**User Story:** As a room host, I want to start the quiz when all players have joined, so that we can begin playing together.

#### Acceptance Criteria

1. WHEN the Room Host is in a Game Room, THEN the Jix System SHALL display a start game button
2. WHEN the Room Host clicks the start button, THEN the Jix System SHALL initiate the first Question Round
3. WHEN a game starts, THEN the Jix System SHALL prevent new Participants from joining
4. WHEN a game starts, THEN the Jix System SHALL notify all Participants that the game has begun

### Requirement 5

**User Story:** As the system, I want to generate multiple-choice questions using Gemini AI, so that players receive relevant quiz content.

#### Acceptance Criteria

1. WHEN a Question Round begins, THEN the Jix System SHALL send a request to Gemini AI with the Game Room category
2. WHEN requesting questions from Gemini AI, THEN the Jix System SHALL use structured output format to ensure consistent response structure
3. WHEN requesting questions from Gemini AI, THEN the Jix System SHALL use the gemini-2.0-flash model
4. WHEN Gemini AI returns a question, THEN the Jix System SHALL validate the response contains a question text, multiple answer options, and a correct answer
5. WHEN Gemini AI fails to respond, THEN the Jix System SHALL retry the request up to three times before displaying an error

### Requirement 6

**User Story:** As a participant, I want to see and answer multiple-choice questions, so that I can compete in the quiz.

#### Acceptance Criteria

1. WHEN a Question Round starts, THEN the Jix System SHALL display the question text to all Participants simultaneously
2. WHEN a question is displayed, THEN the Jix System SHALL show all answer options as selectable choices
3. WHEN a Participant selects an answer, THEN the Jix System SHALL record their response and timestamp
4. WHEN a Participant submits an answer, THEN the Jix System SHALL prevent them from changing their response
5. WHEN all Participants have answered or a time limit expires, THEN the Jix System SHALL reveal the correct answer

### Requirement 7

**User Story:** As a participant, I want to see my score and other players' scores, so that I can track my performance.

#### Acceptance Criteria

1. WHEN a Participant answers correctly, THEN the Jix System SHALL increment their score
2. WHEN a Participant answers incorrectly, THEN the Jix System SHALL maintain their current score
3. WHEN a Question Round completes, THEN the Jix System SHALL display all Participants' current scores
4. WHEN displaying scores, THEN the Jix System SHALL rank Participants from highest to lowest score
5. WHEN the game ends, THEN the Jix System SHALL display final rankings and scores

### Requirement 8

**User Story:** As a system administrator, I want the application to use Bun runtime and React with TypeScript, so that the application is built with modern, performant technologies.

#### Acceptance Criteria

1. WHEN the Jix System is built, THEN the Jix System SHALL use Bun as the JavaScript runtime
2. WHEN the Jix System frontend is developed, THEN the Jix System SHALL use React with TypeScript
3. WHEN the Jix System makes API calls, THEN the Jix System SHALL use the provided Gemini API key
4. WHEN TypeScript code is compiled, THEN the Jix System SHALL enforce strict type checking
5. WHEN the application runs, THEN the Jix System SHALL handle real-time communication between Participants in a Game Room

### Requirement 9

**User Story:** As a participant, I want real-time updates when other players join or answer questions, so that I have a synchronized game experience.

#### Acceptance Criteria

1. WHEN a Participant joins a Game Room, THEN the Jix System SHALL broadcast the update to all existing Participants within 500 milliseconds
2. WHEN a Participant submits an answer, THEN the Jix System SHALL update the waiting status for all Participants
3. WHEN all Participants have answered, THEN the Jix System SHALL immediately transition to the results phase
4. WHEN the Room Host starts the game, THEN the Jix System SHALL synchronize the game state across all Participants
5. WHEN a Participant disconnects, THEN the Jix System SHALL notify remaining Participants and update the player list

### Requirement 10

**User Story:** As a room host, I want to control the game flow, so that I can manage the pace and progression of the quiz.

#### Acceptance Criteria

1. WHEN viewing results, THEN the Jix System SHALL provide the Room Host with a button to proceed to the next question
2. WHEN the Room Host requests the next question, THEN the Jix System SHALL initiate a new Question Round
3. WHEN the Room Host decides to end the game, THEN the Jix System SHALL display final results and close the Game Room
4. WHEN a Game Room is closed, THEN the Jix System SHALL disconnect all Participants gracefully
5. WHEN the Room Host disconnects, THEN the Jix System SHALL either transfer host privileges or end the game
