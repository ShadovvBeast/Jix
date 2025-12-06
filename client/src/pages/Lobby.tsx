import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomLobby from '../components/RoomLobby';
import { useGame } from '../context/GameContext';
import { useWebSocketContext } from '../context/WebSocketContext';

const Lobby: React.FC = () => {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { sendMessage, isConnected, error: wsError } = useWebSocketContext();

  // Load player info from sessionStorage on mount
  useEffect(() => {
    const playerId = sessionStorage.getItem('playerId');
    const playerName = sessionStorage.getItem('playerName');
    const isHost = sessionStorage.getItem('isHost') === 'true';

    // Get room code from URL
    const pathParts = window.location.pathname.split('/');
    const roomCode = pathParts[pathParts.length - 1];

    // If we don't have player info in sessionStorage, redirect to home
    if (!playerId || !playerName || !roomCode) {
      navigate('/');
      return;
    }

    // Set player and room info
    dispatch({ 
      type: 'SET_PLAYER_INFO', 
      payload: { playerId, playerName } 
    });
    
    dispatch({ 
      type: 'SET_ROOM_INFO', 
      payload: { roomCode, category: '', isHost } 
    });
  }, [dispatch, navigate]);

  // Navigate to game when game starts
  useEffect(() => {
    if (state.gameState === 'IN_PROGRESS' && state.roomCode) {
      navigate(`/game/${state.roomCode}`);
    }
  }, [state.gameState, state.roomCode, navigate]);

  // Show connection error if present
  useEffect(() => {
    if (wsError) {
      dispatch({ type: 'SET_ERROR', payload: wsError });
    }
  }, [wsError, dispatch]);

  const handleStartGame = () => {
    // Send START_GAME message via WebSocket
    sendMessage({
      type: 'START_GAME',
    });
  };

  // Don't render until we have player info loaded
  if (!state.roomCode || !state.playerId || !state.playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Loading...
          </h2>
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show connection status
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Connecting to lobby...
          </h2>
          {wsError && (
            <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="text-sm">{wsError}</p>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoomLobby
      roomCode={state.roomCode}
      participants={state.participants}
      isHost={state.isHost}
      onStartGame={handleStartGame}
      error={state.error}
    />
  );
};

export default Lobby;
