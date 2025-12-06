import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomLobby from '../components/RoomLobby';
import { useGame } from '../context/GameContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Player } from '../../../shared/types';

const Lobby: React.FC = () => {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  // Load player info from sessionStorage on mount
  useEffect(() => {
    const playerId = sessionStorage.getItem('playerId');
    const playerName = sessionStorage.getItem('playerName');
    const isHost = sessionStorage.getItem('isHost') === 'true';

    if (playerId && playerName) {
      dispatch({ 
        type: 'SET_PLAYER_INFO', 
        payload: { playerId, playerName } 
      });
      
      // Set room info if we have a room code from URL
      const pathParts = window.location.pathname.split('/');
      const roomCode = pathParts[pathParts.length - 1];
      if (roomCode) {
        dispatch({ 
          type: 'SET_ROOM_INFO', 
          payload: { roomCode, category: '', isHost } 
        });
      }
    }
  }, [dispatch]);

  // Redirect if no room code
  useEffect(() => {
    if (!state.roomCode) {
      navigate('/');
    }
  }, [state.roomCode, navigate]);

  // Construct WebSocket URL only when we have valid values
  const wsUrl = state.playerId && state.roomCode && state.playerName
    ? `ws://localhost:9188/ws?playerId=${state.playerId}&roomCode=${state.roomCode}&playerName=${encodeURIComponent(state.playerName)}`
    : null;

  // WebSocket connection
  const { sendMessage, isConnected, error: wsError } = useWebSocket({
    url: wsUrl || '',
    onMessage: (message) => {
      switch (message.type) {
        case 'PLAYER_JOINED':
          dispatch({ type: 'ADD_PARTICIPANT', payload: message.player as Player });
          break;
        case 'PLAYER_LEFT':
          dispatch({ type: 'REMOVE_PARTICIPANT', payload: message.playerId as string });
          break;
        case 'GAME_STARTED':
          dispatch({ type: 'SET_GAME_STATE', payload: 'IN_PROGRESS' });
          navigate(`/game/${state.roomCode}`);
          break;
        case 'ERROR':
          dispatch({ type: 'SET_ERROR', payload: message.message as string });
          break;
      }
    },
    onError: () => {
      dispatch({ type: 'SET_ERROR', payload: 'Connection error occurred' });
    },
  });

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

  if (!state.roomCode) {
    return null;
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
