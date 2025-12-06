/**
 * Unit tests for QuestionDisplay component
 * Requirements: 6.2, 6.4
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionDisplay from './QuestionDisplay';
import type { Question } from '../../../shared/types';

describe('QuestionDisplay', () => {
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

  /**
   * Test: Question and options render correctly (Requirement 6.2)
   */
  it('should render question text and all answer options', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={false}
      />
    );

    // Verify question text is displayed
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();

    // Verify all options are displayed
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  /**
   * Test: Answer selection triggers callback (Requirement 6.2)
   */
  it('should call onAnswerSubmit when an answer is selected', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={false}
      />
    );

    // Click on the second option (Paris)
    const parisButton = screen.getByText('Paris');
    fireEvent.click(parisButton);

    // Verify callback was called with correct answer ID
    expect(mockOnAnswerSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnAnswerSubmit).toHaveBeenCalledWith('a2');
  });

  /**
   * Test: Buttons are disabled after submission (Requirement 6.4)
   */
  it('should disable all answer buttons after submission', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={true}
      />
    );

    // When hasAnswered is true, buttons are not rendered, instead a waiting message is shown
    const waitingMessage = screen.getByText(/waiting for other players/i);
    expect(waitingMessage).toBeDefined();
    
    // Verify no answer buttons are present
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  /**
   * Test: Cannot change answer after submission (Requirement 6.4)
   */
  it('should not call onAnswerSubmit when hasAnswered is true', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={true}
      />
    );

    // Try to click on an option
    const londonButton = screen.getByText('London');
    fireEvent.click(londonButton);

    // Verify callback was NOT called
    expect(mockOnAnswerSubmit).not.toHaveBeenCalled();
  });

  /**
   * Test: Visual feedback for selected answer
   */
  it('should show visual feedback when an answer is selected', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={false}
      />
    );

    // Click on an option
    const berlinButton = screen.getByText('Berlin');
    fireEvent.click(berlinButton);

    // Verify the button has selected styling (check for specific classes)
    expect(berlinButton.closest('button')).toHaveClass('bg-blue-600');
  });

  /**
   * Test: Timer display when timeLimit is provided
   */
  it('should display countdown timer when timeLimit is provided', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={false}
        timeLimit={30}
      />
    );

    // Verify timer is displayed
    expect(screen.getByText(/Time Remaining: 30s/)).toBeInTheDocument();
  });

  /**
   * Test: No timer display when timeLimit is not provided
   */
  it('should not display timer when timeLimit is not provided', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={false}
      />
    );

    // Verify timer is not displayed
    expect(screen.queryByText(/Time Remaining:/)).not.toBeInTheDocument();
  });

  /**
   * Test: Status message after answer submission
   */
  it('should display waiting message after answer is submitted', () => {
    const mockOnAnswerSubmit = vi.fn();

    render(
      <QuestionDisplay
        question={mockQuestion}
        onAnswerSubmit={mockOnAnswerSubmit}
        hasAnswered={true}
      />
    );

    // Verify waiting message is displayed
    expect(
      screen.getByText('Answer submitted! Waiting for other players...')
    ).toBeInTheDocument();
  });
});
