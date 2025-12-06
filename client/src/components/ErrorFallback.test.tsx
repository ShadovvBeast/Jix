/**
 * Unit tests for ErrorFallback component
 * Requirements: 5.5, 9.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorFallback from './ErrorFallback';

describe('ErrorFallback Component', () => {
  it('should display error message', () => {
    render(
      <ErrorFallback
        error="Network connection failed"
        showRetry={false}
        showGoBack={false}
      />
    );

    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('should show retry button when enabled', () => {
    const onRetry = vi.fn();
    
    render(
      <ErrorFallback
        error="Network error"
        onRetry={onRetry}
        showRetry={true}
        showGoBack={false}
      />
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should show go back button when enabled', () => {
    const onGoBack = vi.fn();
    
    render(
      <ErrorFallback
        error="Page not found"
        onGoBack={onGoBack}
        showRetry={false}
        showGoBack={true}
      />
    );

    const goBackButton = screen.getByText('Go Back');
    expect(goBackButton).toBeInTheDocument();
    
    fireEvent.click(goBackButton);
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it('should show both buttons when both are enabled', () => {
    const onRetry = vi.fn();
    const onGoBack = vi.fn();
    
    render(
      <ErrorFallback
        error="Error occurred"
        onRetry={onRetry}
        onGoBack={onGoBack}
        showRetry={true}
        showGoBack={true}
      />
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('should not show buttons when callbacks are not provided', () => {
    render(
      <ErrorFallback
        error="Error occurred"
        showRetry={true}
        showGoBack={true}
      />
    );

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Go Back')).not.toBeInTheDocument();
  });

  it('should display error icon', () => {
    const { container } = render(
      <ErrorFallback
        error="Error"
        showRetry={false}
        showGoBack={false}
      />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
