import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsDisplay from './ResultsDisplay';
import type { Question, PlayerAnswer, PlayerScore } from '../../../shared/types';

describe('ResultsDisplay Component', () => {
  const mockQuestion: Question = {
    id: 'q1',
    text: 'What is the capital of France?',
    options: [
      { id: 'a1', text: 'London' },
      { id: 'a2', text: 'Paris' },
      { id: 'a3', text: 'Berlin' },
      { id: 'a4', text: 'Madrid' },
    ],
    correctAnswerId: 'a2',
    category: 'Geography',
  };

  const mockPlayerAnswers: PlayerAnswer[] = [
    {
      playerId: '1',
      answerId: 'a2',
      timestamp: Date.now(),
      isCorrect: true,
    },
    {
      playerId: '2',
      answerId: 'a1',
      timestamp: Date.now(),
      isCorrect: false,
    },
    {
      playerId: '3',
      answerId: 'a2',
      timestamp: Date.now(),
      isCorrect: true,
    },
  ];

  const mockScores: PlayerScore[] = [
    {
      playerId: '1',
      playerName: 'Alice',
      score: 5,
      rank: 1,
    },
    {
      playerId: '2',
      playerName: 'Bob',
      score: 3,
      rank: 2,
    },
    {
      playerId: '3',
      playerName: 'Charlie',
      score: 4,
      rank: 2,
    },
  ];

  it('should highlight the correct answer', () => {
    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    // The correct answer "Paris" should be highlighted
    const parisOption = screen.getByText('Paris').closest('.bg-green-100');
    expect(parisOption).toBeInTheDocument();
    expect(parisOption).toHaveClass('bg-green-100', 'border-green-500');
  });

  it('should display which participants answered correctly', () => {
    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    // Alice and Charlie answered correctly
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
    
    // Check for correct/incorrect indicators
    const aliceRow = screen.getByText(/Alice/).closest('div');
    expect(aliceRow).toHaveTextContent('✓');
  });

  it('should display which participants answered incorrectly', () => {
    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    // Bob answered incorrectly
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    
    const bobRow = screen.getByText(/Bob/).closest('div');
    expect(bobRow).toHaveTextContent('✗');
  });

  it('should show updated scores after the round', () => {
    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    // Scores should be displayed with "pts" suffix
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('3 pts')).toBeInTheDocument();
    expect(screen.getByText('4 pts')).toBeInTheDocument();
  });

  it('should show next button for host only', () => {
    const { rerender } = render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={true}
        onNextQuestion={() => {}}
      />
    );

    // Host should see the next button
    expect(screen.getByText('Next Question')).toBeInTheDocument();

    // Non-host should not see the next button
    rerender(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    expect(screen.queryByText('Next Question')).not.toBeInTheDocument();
  });

  it('should show waiting message for non-host participants', () => {
    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    expect(screen.getByText(/Waiting for host/)).toBeInTheDocument();
  });

  it('should call onNextQuestion when host clicks next button', async () => {
    const user = userEvent.setup();
    const mockOnNextQuestion = vi.fn();

    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={true}
        onNextQuestion={mockOnNextQuestion}
      />
    );

    const nextButton = screen.getByText('Next Question');
    await user.click(nextButton);

    expect(mockOnNextQuestion).toHaveBeenCalledTimes(1);
  });

  it('should display the question text', () => {
    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });

  it('should display all answer options', () => {
    render(
      <ResultsDisplay
        question={mockQuestion}
        correctAnswerId="a2"
        playerAnswers={mockPlayerAnswers}
        scores={mockScores}
        isHost={false}
        onNextQuestion={() => {}}
      />
    );

    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });
});
