/**
 * QuestionDisplay Component
 * Displays a quiz question with multiple-choice options and handles answer submission
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React, { useState, useEffect } from 'react';
import type { Question } from '../../../shared/types';
import LoadingSpinner from './LoadingSpinner';

interface QuestionDisplayProps {
  question: Question;
  onAnswerSubmit: (answerId: string) => void;
  hasAnswered: boolean;
  timeLimit?: number; // Optional time limit in seconds
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  onAnswerSubmit,
  hasAnswered,
  timeLimit,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ?? null
  );

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setTimeRemaining(timeLimit ?? null);
  }, [question.id, timeLimit]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || hasAnswered) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, hasAnswered]);

  /**
   * Handles answer selection and submission (Requirements 6.3, 6.4)
   */
  const handleAnswerClick = (answerId: string) => {
    // Prevent selection if already answered (Requirement 6.4)
    if (hasAnswered) {
      return;
    }

    setSelectedAnswer(answerId);
    onAnswerSubmit(answerId);
  };

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      {/* Timer Display (if time limit is set) */}
      {timeLimit !== undefined && timeRemaining !== null && (
        <div className="mb-4 text-center" role="timer" aria-live="polite">
          <div
            className={`inline-block px-4 py-2 rounded-lg font-semibold transition-all ${
              timeRemaining <= 10
                ? 'bg-red-100 text-red-700 animate-pulse'
                : 'bg-blue-100 text-blue-700'
            }`}
            aria-label={`Time remaining: ${timeRemaining} seconds`}
          >
            Time Remaining: {timeRemaining}s
          </div>
        </div>
      )}

      {/* Question Text (Requirement 6.1) */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 
          className="text-xl md:text-2xl font-bold text-gray-900 text-center"
          role="heading"
          aria-level={2}
        >
          {question.text}
        </h2>
      </div>

      {/* Answer Options (Requirements 6.2, 6.3, 6.4) */}
      <div className="space-y-3" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option.id;
          const isDisabled = hasAnswered;

          return (
            <button
              key={option.id}
              onClick={() => handleAnswerClick(option.id)}
              disabled={isDisabled}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Option ${index + 1}: ${option.text}`}
              className={`w-full p-4 rounded-lg font-medium text-left transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white ring-4 ring-blue-300'
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              } ${
                isDisabled
                  ? 'cursor-not-allowed opacity-75'
                  : 'cursor-pointer hover:shadow-md hover:scale-102'
              } border-2 ${
                isSelected ? 'border-blue-600' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <span className="flex-1">{option.text}</span>
                {isSelected && (
                  <svg
                    className="w-6 h-6 ml-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Status Message */}
      {hasAnswered && (
        <div className="mt-6 text-center slide-in" role="status" aria-live="polite">
          <div className="inline-flex items-center gap-2 text-gray-600 font-medium">
            <LoadingSpinner size="sm" />
            <p>Answer submitted! Waiting for other players...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
