/**
 * ScoreBoard Component
 * Displays all participants with their current scores and rankings
 * Requirements: 7.3, 7.4
 */

import React from 'react';
import type { PlayerScore } from '../../../shared/types';

interface ScoreBoardProps {
  scores: PlayerScore[];
  currentUserId: string;
}

/**
 * Formats rank number with appropriate suffix (1st, 2nd, 3rd, 4th, etc.)
 */
const formatRank = (rank: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = rank % 100;
  const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
  return `${rank}${suffix}`;
};

const ScoreBoard: React.FC<ScoreBoardProps> = ({ scores, currentUserId }) => {
  // Sort scores by rank (lowest rank number = highest score) (Requirement 7.4)
  const sortedScores = [...scores].sort((a, b) => a.rank - b.rank);

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center">
          Scoreboard
        </h2>

        {/* Scores List (Requirements 7.3, 7.4) */}
        <div className="space-y-2" role="list" aria-label="Player scores and rankings">
          {sortedScores.map((playerScore, index) => {
            const isCurrentUser = playerScore.playerId === currentUserId;

            return (
              <div
                key={playerScore.playerId}
                data-testid={`player-${playerScore.playerId}`}
                role="listitem"
                className={`flex items-center justify-between p-4 rounded-lg transition-all slide-in ${
                  isCurrentUser
                    ? 'bg-blue-100 border-2 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
                aria-label={`${formatRank(playerScore.rank)} place: ${playerScore.playerName}, ${playerScore.score} points${isCurrentUser ? ' (You)' : ''}`}
              >
                {/* Rank and Name */}
                <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs md:text-sm ${
                      playerScore.rank === 1
                        ? 'bg-yellow-400 text-yellow-900'
                        : playerScore.rank === 2
                        ? 'bg-gray-300 text-gray-800'
                        : playerScore.rank === 3
                        ? 'bg-orange-400 text-orange-900'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    aria-hidden="true"
                  >
                    {formatRank(playerScore.rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {playerScore.playerName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs md:text-sm text-blue-600">
                          (You)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div
                  className={`text-xl md:text-2xl font-bold ${
                    isCurrentUser ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {playerScore.score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedScores.length === 0 && (
          <div className="text-center py-8 text-gray-500" role="status">
            No scores yet. Start playing to see rankings!
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreBoard;
