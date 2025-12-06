import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreBoard from './ScoreBoard';
import type { PlayerScore } from '../../../shared/types';

describe('ScoreBoard Component', () => {
  const mockScores: PlayerScore[] = [
    {
      playerId: '1',
      playerName: 'Alice',
      score: 10,
      rank: 1,
    },
    {
      playerId: '2',
      playerName: 'Bob',
      score: 7,
      rank: 2,
    },
    {
      playerId: '3',
      playerName: 'Charlie',
      score: 5,
      rank: 3,
    },
  ];

  it('should display all participants with their scores', () => {
    render(<ScoreBoard scores={mockScores} currentUserId="1" />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display scores in correct order (highest to lowest)', () => {
    const unorderedScores: PlayerScore[] = [
      {
        playerId: '2',
        playerName: 'Bob',
        score: 7,
        rank: 2,
      },
      {
        playerId: '1',
        playerName: 'Alice',
        score: 10,
        rank: 1,
      },
      {
        playerId: '3',
        playerName: 'Charlie',
        score: 5,
        rank: 3,
      },
    ];

    render(<ScoreBoard scores={unorderedScores} currentUserId="1" />);

    const playerNames = screen.getAllByTestId(/^player-/);
    expect(playerNames[0]).toHaveTextContent('Alice');
    expect(playerNames[1]).toHaveTextContent('Bob');
    expect(playerNames[2]).toHaveTextContent('Charlie');
  });

  it('should highlight current user score', () => {
    render(<ScoreBoard scores={mockScores} currentUserId="2" />);

    const bobRow = screen.getByTestId('player-2');
    expect(bobRow).toHaveClass('bg-blue-100');
  });

  it('should display ranking labels correctly', () => {
    render(<ScoreBoard scores={mockScores} currentUserId="1" />);

    expect(screen.getByText('1st')).toBeInTheDocument();
    expect(screen.getByText('2nd')).toBeInTheDocument();
    expect(screen.getByText('3rd')).toBeInTheDocument();
  });

  it('should display ranking labels for positions beyond 3rd', () => {
    const extendedScores: PlayerScore[] = [
      ...mockScores,
      {
        playerId: '4',
        playerName: 'David',
        score: 3,
        rank: 4,
      },
      {
        playerId: '5',
        playerName: 'Eve',
        score: 1,
        rank: 5,
      },
    ];

    render(<ScoreBoard scores={extendedScores} currentUserId="1" />);

    expect(screen.getByText('4th')).toBeInTheDocument();
    expect(screen.getByText('5th')).toBeInTheDocument();
  });

  it('should handle empty scores array', () => {
    render(<ScoreBoard scores={[]} currentUserId="1" />);

    expect(screen.getByText('Scoreboard')).toBeInTheDocument();
  });

  it('should update when scores change', () => {
    const { rerender } = render(
      <ScoreBoard scores={mockScores} currentUserId="1" />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    const updatedScores: PlayerScore[] = [
      {
        playerId: '1',
        playerName: 'Alice',
        score: 15,
        rank: 1,
      },
      {
        playerId: '2',
        playerName: 'Bob',
        score: 7,
        rank: 2,
      },
      {
        playerId: '3',
        playerName: 'Charlie',
        score: 5,
        rank: 3,
      },
    ];

    rerender(<ScoreBoard scores={updatedScores} currentUserId="1" />);

    expect(screen.getByText('15')).toBeInTheDocument();
  });
});
