/**
 * ScoreBoard Component
 * Displays all participants with their current scores and rankings
 * Requirements: 7.3, 7.4
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import type { PlayerScore } from '../../../shared/types';

interface ScoreBoardProps {
  scores: PlayerScore[];
  currentUserId: string;
}

const formatRank = (rank: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = rank % 100;
  const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
  return `${rank}${suffix}`;
};

const ScoreBoard: React.FC<ScoreBoardProps> = ({ scores, currentUserId }) => {
  const sortedScores = [...scores].sort((a, b) => a.rank - b.rank);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400" size={28} />;
      case 2:
        return <Medal className="text-gray-400" size={28} />;
      case 3:
        return <Award className="text-orange-400" size={28} />;
      default:
        return <Star className="text-gray-400" size={24} />;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-orange-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-orange-400 to-red-500';
      default:
        return 'from-gray-200 to-gray-300';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        className="glass rounded-3xl shadow-2xl p-6 md:p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Trophy className="text-yellow-500" size={32} />
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Leaderboard
          </h2>
          <Trophy className="text-yellow-500" size={32} />
        </div>

        <motion.div
          className="space-y-3"
          role="list"
          aria-label="Player scores and rankings"
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
          {sortedScores.map((playerScore, index) => {
            const isCurrentUser = playerScore.playerId === currentUserId;

            return (
              <motion.div
                key={playerScore.playerId}
                data-testid={`player-${playerScore.playerId}`}
                role="listitem"
                className={`relative p-4 md:p-5 rounded-2xl transition-all overflow-hidden ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-4 ring-purple-300 shadow-xl'
                    : 'glass-dark text-white hover:scale-102'
                }`}
                aria-label={`${formatRank(playerScore.rank)} place: ${playerScore.playerName}, ${playerScore.score} points${isCurrentUser ? ' (You)' : ''}`}
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
                whileHover={{ scale: 1.02 }}
              >
                {!isCurrentUser && playerScore.rank <= 3 && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${getRankGradient(playerScore.rank)} opacity-20`}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}

                <div className="flex items-center gap-4 relative z-10">
                  <motion.div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-sm md:text-base shadow-lg ${
                      isCurrentUser
                        ? 'bg-white/30'
                        : `bg-gradient-to-br ${getRankGradient(playerScore.rank)}`
                    }`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {getRankIcon(playerScore.rank)}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg truncate ${isCurrentUser ? 'text-white' : 'text-white'}`}>
                      {playerScore.playerName}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm font-semibold opacity-90">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-sm opacity-75">
                      {formatRank(playerScore.rank)} Place
                    </p>
                  </div>

                  <motion.div
                    className={`text-2xl md:text-3xl font-black ${isCurrentUser ? 'text-white' : 'text-white'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      delay: index * 0.05,
                    }}
                  >
                    {playerScore.score}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {sortedScores.length === 0 && (
          <div className="text-center py-12 text-gray-500" role="status">
            <Trophy className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="font-semibold">No scores yet. Start playing to see rankings!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ScoreBoard;
