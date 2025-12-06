/**
 * ResultsDisplay Component
 * Shows the correct answer, participant answer status, and updated scores after a round
 * Requirements: 6.5, 7.3, 10.1, 10.2
 */

import React from 'react';
import type { Question, PlayerAnswer, PlayerScore } from '../../../shared/types';
import LoadingSpinner from './LoadingSpinner';

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
  // Create a map of player answers for quick lookup
  const answerMap = new Map(
    playerAnswers.map((pa) => [pa.playerId, pa])
  );

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      {/* Question Text */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-2">
          {question.text}
        </h2>
        <p className="text-center text-gray-600">Round Results</p>
      </div>

      {/* Answer Options with Correct Answer Highlighted (Requirement 6.5) */}
      <div className="space-y-3 mb-6" role="list" aria-label="Answer options">
        {question.options.map((option, index) => {
          const isCorrect = option.id === correctAnswerId;

          return (
            <div
              key={option.id}
              role="listitem"
              className={`w-full p-4 rounded-lg font-medium text-left border-2 transition-all slide-in ${
                isCorrect
                  ? 'bg-green-100 border-green-500 ring-4 ring-green-200 pulse-success'
                  : 'bg-gray-50 border-gray-200'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center">
                <span className="flex-1">
                  {option.text}
                  {isCorrect && <span className="sr-only"> (Correct answer)</span>}
                </span>
                {isCorrect && (
                  <span className="ml-2 text-green-700 font-bold text-xl" aria-hidden="true">
                    ✓ Correct
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Participant Answer Status (Requirement 6.5, 7.3) */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Player Results
        </h3>
        <div className="space-y-2" role="list" aria-label="Player results">
          {scores.map((playerScore, index) => {
            const playerAnswer = answerMap.get(playerScore.playerId);
            const isCorrect = playerAnswer?.isCorrect ?? false;

            return (
              <div
                key={playerScore.playerId}
                role="listitem"
                className={`flex items-center justify-between p-3 rounded-lg transition-all slide-in ${
                  isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
                aria-label={`${playerScore.playerName}: ${isCorrect ? 'correct' : 'incorrect'}, ${playerScore.score} points`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-2xl ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}
                    aria-hidden="true"
                  >
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="font-medium text-gray-900">
                    {playerScore.playerName}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-700">
                  {playerScore.score} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Controls (Requirements 10.1, 10.2) */}
      {isHost ? (
        <div className="text-center">
          <button
            onClick={onNextQuestion}
            aria-label="Start next question"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-lg focus:ring-4 focus:ring-blue-300"
          >
            Next Question
          </button>
        </div>
      ) : (
        <div className="text-center" role="status" aria-live="polite">
          <div className="inline-flex items-center gap-2 text-gray-600 font-medium">
            <LoadingSpinner size="sm" />
            <p>Waiting for host to start the next question...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
