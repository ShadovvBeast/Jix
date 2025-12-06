import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { Player } from '../../../shared/types';
import LoadingSpinner from './LoadingSpinner';

interface RoomLobbyProps {
  roomCode: string;
  participants: Player[];
  isHost: boolean;
  onStartGame: () => void;
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (playerId: string) => void;
  error?: string | null;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomCode,
  participants,
  isHost,
  onStartGame,
  error,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && roomCode) {
      QRCode.toCanvas(canvasRef.current, roomCode, {
        width: 200,
        margin: 2,
      }).catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [roomCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-6 md:p-8 fade-in">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6">
          Room Lobby
        </h2>

        {/* Error Display */}
        {error && (
          <div 
            className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded slide-in"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Room Code Display */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-600 mb-2" id="room-code-label">Room Code</p>
          <p 
            className="text-3xl md:text-4xl font-bold text-blue-600 tracking-wider"
            aria-labelledby="room-code-label"
            role="text"
          >
            {roomCode}
          </p>
        </div>

        {/* QR Code Display */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <canvas 
              ref={canvasRef} 
              aria-label={`QR code for room ${roomCode}`}
              role="img"
            />
          </div>
        </div>

        {/* Participants List */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Players ({participants.length})
          </h3>
          <div className="space-y-2" role="list" aria-label="Players in room">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                role="listitem"
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg transition-all hover:bg-gray-100 slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                aria-label={`${participant.name}${participant.isHost ? ', host' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                    aria-hidden="true"
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800">
                    {participant.name}
                  </span>
                </div>
                {participant.isHost && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button or Waiting Message */}
        {isHost ? (
          <button
            onClick={onStartGame}
            aria-label="Start the game"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all hover:scale-105 focus:ring-4 focus:ring-green-300"
          >
            Start Game
          </button>
        ) : (
          <div className="text-center py-3 px-6 bg-gray-100 rounded-lg" role="status" aria-live="polite">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <LoadingSpinner size="sm" />
              <p>Waiting for host to start the game...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
