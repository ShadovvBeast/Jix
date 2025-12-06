import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useWebSocket } from '../hooks/useWebSocket';
import QuestionDisplay from '../components/QuestionDisplay';
import ResultsDisplay from '../components/ResultsDisplay';
import ScoreBoard from '../components/ScoreBoard';

const Game: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!state.playerId || !state.playerName || !roomCode) {
      navigate('/');
      return;
    }

    const url = `ws://localhost:9188/ws?playerId=${state.playerId}&roomCode=${roomCode}&playerName=${encodeURIComponent(state.playerName)}`;
    setWsUrl(url);
  }, [state.playerId, state.playerName, roomCode, navigate]);

  // Handle WebSocket messages
  const handleMessage = useCallback((message: any) => {
    console.log('Game received message:', message);

    switch (message.type) {
      case 'GAME_STARTED':
        // Requirement 4.4: Handle game start
        dispatch({ type: 'SET_GAME_STATE', payload: 'IN_PROGRESS' });
        break;

      case 'QUESTION_RECEIVED':
        // Requirement 6.1: Display question
        dispatch({ type: 'SET_CURRENT_QUESTION', payload: message.question });
        dispatch({ type: 'SET_GAME_STATE', payload: 'IN_PROGRESS' });
        break;

      case 'ANSWER_SUBMITTED':
        // Requirement 9.2: Update waiting status
        console.log(`Player ${message.playerId} submitted answer`);
        break;

      case 'ROUND_ENDED':
        // Requirement 6.5: Show results
        dispatch({ type: 'SET_ROUND_RESULTS', payload: message.results });
        dispatch({ type: 'SET_SCORES', payload: message.results.updatedScores });
        dispatch({ type: 'SET_GAME_STATE', payload: 'SHOWING_RESULTS' });
        break;

      case 'GAME_ENDED':
        // Requirement 10.3: Show final scores
        dispatch({ type: 'SET_SCORES', payload: message.finalScores });
        dispatch({ type: 'SET_GAME_STATE', payload: 'ENDED' });
        break;

      case 'PLAYER_JOINED':
        // Update participant list
        dispatch({ type: 'ADD_PARTICIPANT', payload: message.player });
        break;

      case 'PLAYER_LEFT':
        // Update participant list
        dispatch({ type: 'REMOVE_PARTICIPANT', payload: message.playerId });
        break;

      case 'ERROR':
        dispatch({ type: 'SET_ERROR', payload: message.message });
        setTimeout(() => {
          dispatch({ type: 'SET_ERROR', payload: null });
        }, 5000);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [dispatch]);

  const { sendMessage, isConnected, error: wsError, isReconnecting, reconnect } = useWebSocket({
    url: wsUrl || '',
    onMessage: handleMessage,
    onOpen: () => {
      console.log('WebSocket connected');
      dispatch({ type: 'SET_ERROR', payload: null });
    },
    onClose: () => {
      console.log('WebSocket disconnected');
    },
    onError: () => {
      dispatch({ type: 'SET_ERROR', payload: 'Connection error occurred' });
    },
  });

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

  if (!wsUrl || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
          </h2>
          <p className="text-center text-gray-600 mb-4">
            {isReconnecting 
              ? 'Connection lost. Attempting to reconnect...' 
              : 'Establishing connection to game server'}
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
