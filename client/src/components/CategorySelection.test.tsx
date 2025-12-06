/**
 * Unit tests for CategorySelection Component
 * Requirements: 1.1, 1.2, 1.3, 1.5
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelection from './CategorySelection';

describe('CategorySelection Component', () => {
  /**
   * Test input field renders on mount (Requirement 1.1)
   */
  it('should render input field on mount', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Enter a custom category...');
    expect(input).toBeDefined();
    expect(input).toBeInstanceOf(HTMLInputElement);
  });

  /**
   * Test category buttons render on mount (Requirement 1.2)
   */
  it('should render predefined category buttons on mount', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} />);
    
    // Check for some predefined categories
    expect(screen.getByText('Science')).toBeDefined();
    expect(screen.getByText('History')).toBeDefined();
    expect(screen.getByText('Geography')).toBeDefined();
    expect(screen.getByText('Sports')).toBeDefined();
    expect(screen.getByText('Movies')).toBeDefined();
    expect(screen.getByText('Music')).toBeDefined();
    expect(screen.getByText('Technology')).toBeDefined();
    expect(screen.getByText('Literature')).toBeDefined();
  });

  /**
   * Test button click triggers callback with correct category (Requirement 1.3)
   */
  it('should trigger callback with correct category when button is clicked', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} />);
    
    const scienceButton = screen.getByText('Science');
    fireEvent.click(scienceButton);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('Science');
  });

  /**
   * Test empty input shows error (Requirement 1.5)
   */
  it('should show error when empty input is submitted', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Enter a custom category...');
    const submitButton = screen.getByText('Create');
    
    // Try to submit empty input
    fireEvent.click(submitButton);
    
    // Should show error message
    const errorMessage = screen.getByText('Category cannot be empty or contain only whitespace');
    expect(errorMessage).toBeDefined();
    
    // Callback should not be called
    expect(mockCallback).not.toHaveBeenCalled();
  });

  /**
   * Test whitespace-only input shows error (Requirement 1.5)
   */
  it('should show error when whitespace-only input is submitted', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Enter a custom category...') as HTMLInputElement;
    const submitButton = screen.getByText('Create');
    
    // Enter whitespace-only input
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);
    
    // Should show error message
    const errorMessage = screen.getByText('Category cannot be empty or contain only whitespace');
    expect(errorMessage).toBeDefined();
    
    // Callback should not be called
    expect(mockCallback).not.toHaveBeenCalled();
  });

  /**
   * Test valid custom category triggers callback (Requirement 1.4)
   */
  it('should trigger callback with trimmed category when valid input is submitted', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Enter a custom category...') as HTMLInputElement;
    const submitButton = screen.getByText('Create');
    
    // Enter valid category
    fireEvent.change(input, { target: { value: '  Custom Category  ' } });
    fireEvent.click(submitButton);
    
    // Callback should be called with trimmed value
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('Custom Category');
  });

  /**
   * Test loading state disables inputs
   */
  it('should disable inputs when loading', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Enter a custom category...') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /create room with custom category/i });
    const scienceButton = screen.getByRole('button', { name: /select science category/i });
    
    expect(input.disabled).toBe(true);
    expect(submitButton).toBeInstanceOf(HTMLButtonElement);
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    expect((scienceButton as HTMLButtonElement).disabled).toBe(true);
  });

  /**
   * Test error prop displays error message
   */
  it('should display error message when error prop is provided', () => {
    const mockCallback = vi.fn();
    const errorMessage = 'Failed to create room';
    render(<CategorySelection onCategorySelect={mockCallback} error={errorMessage} />);
    
    const error = screen.getByText(errorMessage);
    expect(error).toBeDefined();
  });

  /**
   * Test error clears when user starts typing
   */
  it('should clear validation error when user starts typing', () => {
    const mockCallback = vi.fn();
    render(<CategorySelection onCategorySelect={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Enter a custom category...') as HTMLInputElement;
    const submitButton = screen.getByText('Create');
    
    // Trigger error
    fireEvent.click(submitButton);
    expect(screen.getByText('Category cannot be empty or contain only whitespace')).toBeDefined();
    
    // Start typing
    fireEvent.change(input, { target: { value: 'S' } });
    
    // Error should be cleared
    expect(screen.queryByText('Category cannot be empty or contain only whitespace')).toBeNull();
  });
});
