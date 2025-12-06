/**
 * ResultsDisplay Component
 * Shows the correct answer, participant answer status, and updated scores after a round
 * Requirements: 6.5, 7.3, 10.1, 10.2
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Sparkles, ArrowRight, Loader } from 'lucide-react';
import type { Question, PlayerAnswer, PlayerScore } from '../../../shared/types';

interface ResultsDisplayProps {
  question: Question;
  correctAnswerId: string;
  playerAnswers: PlayerAnswer[];
  scores: PlayerScore[];
  isHost: boolean;
  onNextQuestion: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  question,
  correctAnswerId,
  playerAnswers,
  scores,
  isHost,
  onNextQuestion,
}) => {
  const answerMap = new Map(
    playerAnswers.map((pa) => [pa.playerId, pa])
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        className="glass rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            <Sparkles className="mx-auto text-yellow-500 mb-2" size={40} />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            {question.text}
          </h2>
          <p className="text-gray-600 font-semibold">Round Results</p>
        </div>

        <motion.div
          className="space-y-3"
          role="list"
          aria-label="Answer options"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {question.options.map((option, index) => {
            const isCorrect = option.id === correctAnswerId;

            return (
              <motion.div
                key={option.id}
                role="listitem"
                className={`p-5 rounded-2xl font-bold text-left border-2 transition-all relative overflow-hidden ${
                  isCorrect
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-500 shadow-xl glow-green'
                    : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}
                variants={{
                  hidden: { x: -50, opacity: 0 },
                  visible: {
                    x: 0,
                    opacity: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 100,
                    },
                  },
                }}
                animate={isCorrect ? { scale: [1, 1.02, 1] } : {}}
                transition={isCorrect ? { duration: 0.5, repeat: 2 } : {}}
              >
                <div className="flex items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg mr-4 ${
                      isCorrect
                        ? 'bg-white/30'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 text-lg">
                    {option.text}
                    {isCorrect && <span className="sr-only"> (Correct answer)</span>}
                  </span>
                  {isCorrect && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle size={28} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      <motion.div
        className="glass rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4 text-center">
          Player Results
        </h3>
        <motion.div
          className="space-y-2"
          role="list"
          aria-label="Player results"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {scores.map((playerScore, index) => {
            const playerAnswer = answerMap.get(playerScore.playerId);
            const isCorrect = playerAnswer?.isCorrect ?? false;

            return (
              <motion.div
                key={playerScore.playerId}
                role="listitem"
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  isCorrect
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300'
                    : 'bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300'
                }`}
                aria-label={`${playerScore.playerName}: ${isCorrect ? 'correct' : 'incorrect'}, ${playerScore.score} points`}
                variants={{
                  hidden: { x: -30, opacity: 0 },
                  visible: {
                    x: 0,
                    opacity: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 100,
                    },
                  },
                }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: index * 0.05 }}
                  >
                    {isCorrect ? (
                      <CheckCircle className="text-green-600" size={28} />
                    ) : (
                      <XCircle className="text-red-600" size={28} />
                    )}
                  </motion.div>
                  <span className="font-bold text-gray-900">
                    {playerScore.playerName}
                  </span>
                </div>
                <div className="text-xl font-black text-gray-700">
                  {playerScore.score} pts
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {isHost ? (
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={onNextQuestion}
            aria-label="Start next question"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg rounded-2xl shadow-2xl relative overflow-hidden group"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Next Question
              <ArrowRight size={24} />
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          className="text-center"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-3 glass-dark text-white font-bold px-6 py-4 rounded-2xl shadow-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader size={24} />
            </motion.div>
            <p>Waiting for host to start the next question...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ResultsDisplay;
