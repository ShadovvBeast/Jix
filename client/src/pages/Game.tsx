import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useWebSocketContext } from '../context/WebSocketContext';
import QuestionDisplay from '../components/QuestionDisplay';
import ResultsDisplay from '../components/ResultsDisplay';
import ScoreBoard from '../components/ScoreBoard';

const Game: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { sendMessage, isConnected, error: wsError, reconnect } = useWebSocketContext();

  // Verify player info on mount
  useEffect(() => {
    if (!state.playerId || !state.playerName || !roomCode) {
      navigate('/');
    }
  }, [state.playerId, state.playerName, roomCode, navigate]);

  // Handle answer submission
  const handleAnswerSubmit = useCallback((answerId: string) => {
    dispatch({ type: 'SET_CURRENT_ANSWER', payload: answerId });
    sendMessage({
      type: 'SUBMIT_ANSWER',
      answerId,
    });
  }, [sendMessage, dispatch]);

  // Handle next question (host only)
  const handleNextQuestion = useCallback(() => {
    sendMessage({
      type: 'NEXT_QUESTION',
    });
  }, [sendMessage]);

  // Handle end game (host only)
  const handleEndGame = useCallback(() => {
    sendMessage({
      type: 'END_GAME',
    });
  }, [sendMessage]);

  // Handle game ended - navigate back to home
  useEffect(() => {
    if (state.gameState === 'ENDED') {
      setTimeout(() => {
        navigate('/');
      }, 10000); // Give users 10 seconds to see final scores
    }
  }, [state.gameState, navigate]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Connecting...
          </h2>
          <p className="text-center text-gray-600 mb-4">
            Establishing connection to game server
          </p>
          
          {/* Show WebSocket error if present */}
          {wsError && (
            <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="text-sm">{wsError}</p>
              {wsError.includes('failed') && (
                <button
                  onClick={reconnect}
                  className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
          
          {/* Loading spinner */}
          {!wsError?.includes('failed') && (
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Error Display */}
        {state.error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {state.error}
          </div>
        )}

        {/* Game State: IN_PROGRESS - Show Question */}
        {state.gameState === 'IN_PROGRESS' && state.currentQuestion && (
          <div className="space-y-4">
            <QuestionDisplay
              question={state.currentQuestion}
              onAnswerSubmit={handleAnswerSubmit}
              hasAnswered={state.currentAnswer !== null}
            />
            
            {/* Show scoreboard below question */}
            <ScoreBoard
              scores={state.scores}
              currentUserId={state.playerId || ''}
            />

            {/* Host controls */}
            {state.isHost && (
              <div className="bg-white rounded-lg shadow-xl p-4">
                <button
                  onClick={handleEndGame}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                >
                  End Game
                </button>
              </div>
            )}
          </div>
        )}

        {/* Game State: SHOWING_RESULTS - Show Results */}
        {state.gameState === 'SHOWING_RESULTS' && state.roundResults && (
          <div className="space-y-4">
            <ResultsDisplay
              question={state.roundResults.question}
              correctAnswerId={state.roundResults.correctAnswerId}
              playerAnswers={state.roundResults.playerAnswers}
              scores={state.roundResults.updatedScores}
              isHost={state.isHost}
              onNextQuestion={handleNextQuestion}
            />
            
            {/* Host controls - End Game button */}
            {state.isHost && (
              <div className="bg-white rounded-lg shadow-xl p-4">
                <button
                  onClick={handleEndGame}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                >
                  End Game
                </button>
              </div>
            )}
          </div>
        )}

        {/* Game State: ENDED - Show Final Scores */}
        {state.gameState === 'ENDED' && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
              Game Over!
            </h2>
            <ScoreBoard
              scores={state.scores}
              currentUserId={state.playerId || ''}
            />
            <p className="text-center text-gray-600 mt-6">
              Returning to home in a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
