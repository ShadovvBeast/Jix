import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomLobby from './RoomLobby';
import type { Player } from '../../../shared/types';

describe('RoomLobby Component', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Alice',
      isHost: true,
      score: 0,
      connected: true,
    },
    {
      id: '2',
      name: 'Bob',
      isHost: false,
      score: 0,
      connected: true,
    },
  ];

  it('should display room code prominently', () => {
    render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={false}
        onStartGame={() => {}}
      />
    );

    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Room Code')).toBeInTheDocument();
  });

  it('should render QR code canvas', () => {
    const { container } = render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={false}
        onStartGame={() => {}}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should display list of participants', () => {
    render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={false}
        onStartGame={() => {}}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Players (2)')).toBeInTheDocument();
  });

  it('should show host badge for host participant', () => {
    render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={false}
        onStartGame={() => {}}
      />
    );

    const hostBadges = screen.getAllByText('Host');
    expect(hostBadges).toHaveLength(1);
  });

  it('should show start game button when user is host', () => {
    render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={true}
        onStartGame={() => {}}
      />
    );

    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.queryByText('Waiting for host to start the game...')).not.toBeInTheDocument();
  });

  it('should show waiting message when user is not host', () => {
    render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={false}
        onStartGame={() => {}}
      />
    );

    expect(screen.getByText('Waiting for host to start the game...')).toBeInTheDocument();
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
  });

  it('should call onStartGame when start button is clicked', async () => {
    const user = userEvent.setup();
    const mockStartGame = vi.fn();

    render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={true}
        onStartGame={mockStartGame}
      />
    );

    const startButton = screen.getByText('Start Game');
    await user.click(startButton);

    expect(mockStartGame).toHaveBeenCalledTimes(1);
  });

  it('should update participant list when participants change', () => {
    const { rerender } = render(
      <RoomLobby
        roomCode="ABC123"
        participants={mockPlayers}
        isHost={false}
        onStartGame={() => {}}
      />
    );

    expect(screen.getByText('Players (2)')).toBeInTheDocument();

    const updatedPlayers: Player[] = [
      ...mockPlayers,
      {
        id: '3',
        name: 'Charlie',
        isHost: false,
        score: 0,
        connected: true,
      },
    ];

    rerender(
      <RoomLobby
        roomCode="ABC123"
        participants={updatedPlayers}
        isHost={false}
        onStartGame={() => {}}
      />
    );

    expect(screen.getByText('Players (3)')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });
});
