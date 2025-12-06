import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
        <motion.div
          className="max-w-2xl w-full glass rounded-3xl shadow-2xl p-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h2 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
            Connecting...
          </h2>
          <p className="text-center text-gray-700 mb-4 font-semibold">
            Establishing connection to game server
          </p>
          
          {wsError && (
            <motion.div
              className="mt-4 bg-yellow-100 border-2 border-yellow-400 text-yellow-700 px-4 py-3 rounded-2xl font-semibold"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm">{wsError}</p>
              {wsError.includes('failed') && (
                <motion.button
                  onClick={reconnect}
                  className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors font-bold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try Again
                </motion.button>
              )}
            </motion.div>
          )}
          
          {!wsError?.includes('failed') && (
            <div className="flex justify-center mt-4">
              <motion.div
                className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <AnimatePresence>
          {state.error && (
            <motion.div
              className="mb-4 bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-2xl font-semibold"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {state.error}
            </motion.div>
          )}
        </AnimatePresence>

        {state.gameState === 'IN_PROGRESS' && state.currentQuestion && (
          <div className="space-y-6">
            <QuestionDisplay
              question={state.currentQuestion}
              onAnswerSubmit={handleAnswerSubmit}
              hasAnswered={state.currentAnswer !== null}
            />
            
            <ScoreBoard
              scores={state.scores}
              currentUserId={state.playerId || ''}
            />

            {state.isHost && (
              <motion.div
                className="glass rounded-2xl shadow-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.button
                  onClick={handleEndGame}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 rounded-xl font-bold shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  End Game
                </motion.button>
              </motion.div>
            )}
          </div>
        )}

        {state.gameState === 'SHOWING_RESULTS' && state.roundResults && (
          <div className="space-y-6">
            <ResultsDisplay
              question={state.roundResults.question}
              correctAnswerId={state.roundResults.correctAnswerId}
              playerAnswers={state.roundResults.playerAnswers}
              scores={state.roundResults.updatedScores}
              isHost={state.isHost}
              onNextQuestion={handleNextQuestion}
            />
            
            {state.isHost && (
              <motion.div
                className="glass rounded-2xl shadow-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.button
                  onClick={handleEndGame}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 rounded-xl font-bold shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  End Game
                </motion.button>
              </motion.div>
            )}
          </div>
        )}

        {state.gameState === 'ENDED' && (
          <motion.div
            className="glass rounded-3xl shadow-2xl p-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.h2
              className="text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              🎉 Game Over! 🎉
            </motion.h2>
            <ScoreBoard
              scores={state.scores}
              currentUserId={state.playerId || ''}
            />
            <motion.p
              className="text-center text-gray-600 mt-6 font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Returning to home in a few seconds...
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Game;
