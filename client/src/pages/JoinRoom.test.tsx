/**
 * Unit tests for JoinRoom component
 * Requirements: 3.2, 3.3
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JoinRoom from './JoinRoom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch
global.fetch = vi.fn() as any;

// Mock sessionStorage
const mockSessionStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe('JoinRoom Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSessionStorage.setItem.mockClear();
    
    // Set up sessionStorage mock
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test: Room code input validation
   * Requirements: 3.2
   */
  it('should render room code input field', () => {
    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/room code/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('maxLength', '6');
  });

  /**
   * Test: Join button is disabled with invalid input
   * Requirements: 3.2
   */
  it('should disable join button when room code is not 6 characters', () => {
    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const joinButton = screen.getByRole('button', { name: /join room with entered code/i });
    expect(joinButton).toBeDisabled();

    const input = screen.getByLabelText(/room code/i);
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(joinButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'ABC123' } });
    expect(joinButton).not.toBeDisabled();
  });

  /**
   * Test: Room code input converts to uppercase
   * Requirements: 3.2
   */
  it('should convert room code input to uppercase', () => {
    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/room code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc123' } });
    expect(input.value).toBe('ABC123');
  });

  /**
   * Test: Error display for invalid room codes
   * Requirements: 3.3
   */
  it('should display error when room is not found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Room not found' }),
    });

    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/room code/i);
    const joinButton = screen.getByRole('button', { name: /join room with entered code/i });

    fireEvent.change(input, { target: { value: 'XYZ999' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/room not found/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  /**
   * Test: Error display when game already started
   * Requirements: 3.3
   */
  it('should display error when game has already started', async () => {
    // Mock room check response - game already started
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 'ABC123',
        gameState: 'IN_PROGRESS',
      }),
    });

    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/room code/i);
    const joinButton = screen.getByRole('button', { name: /join room with entered code/i });

    fireEvent.change(input, { target: { value: 'ABC123' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot join.*game has already started/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  /**
   * Test: Successful join redirects to lobby
   * Requirements: 3.2
   */
  it('should redirect to lobby on successful join', async () => {
    const roomCode = 'ABC123';

    // Mock room check response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: roomCode,
        gameState: 'LOBBY',
      }),
    });

    // Mock join response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        roomCode,
      }),
    });

    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/room code/i);
    const joinButton = screen.getByRole('button', { name: /join room with entered code/i });

    fireEvent.change(input, { target: { value: roomCode } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully joined room/i)).toBeInTheDocument();
    });

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/lobby/${roomCode}`);
    }, { timeout: 1000 });

    // Verify sessionStorage was updated
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('playerId', expect.any(String));
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('playerName', expect.any(String));
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isHost', 'false');
  });

  /**
   * Test: QR scanner button is present
   * Requirements: 3.1
   */
  it('should render QR code scanner button', () => {
    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const scanButton = screen.getByRole('button', { name: /scan qr code/i });
    expect(scanButton).toBeInTheDocument();
  });

  /**
   * Test: Back to home button
   */
  it('should navigate back to home when back button is clicked', () => {
    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to home/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  /**
   * Test: Loading state disables buttons
   */
  it('should disable buttons during loading', async () => {
    // Mock a slow response
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ code: 'ABC123', gameState: 'LOBBY' }),
      }), 100))
    );

    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/room code/i);
    const joinButton = screen.getByRole('button', { name: /join room with entered code/i });

    fireEvent.change(input, { target: { value: 'ABC123' } });
    fireEvent.click(joinButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText(/joining/i)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back to home/i });
    expect(backButton).toBeDisabled();
  });

  /**
   * Test: Invalid room code format validation
   * Requirements: 3.2
   */
  it('should show error for invalid room code format', async () => {
    render(
      <MemoryRouter>
        <JoinRoom />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/room code/i);
    const joinButton = screen.getByRole('button', { name: /join room with entered code/i });

    // Try with special characters
    fireEvent.change(input, { target: { value: 'ABC@#$' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid room code format/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
