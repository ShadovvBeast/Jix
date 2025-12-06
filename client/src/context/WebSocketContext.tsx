import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WebSocketMessage } from '../hooks/useWebSocket';
import { useGame } from './GameContext';

interface WebSocketContextType {
  sendMessage: (message: WebSocketMessage) => void;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state, dispatch } = useGame();
  const [wsUrl, setWsUrl] = useState('');

  // Update WebSocket URL when player/room info changes
  useEffect(() => {
    if (state.playerId && state.roomCode && state.playerName) {
      const url = `ws://localhost:9188/ws?playerId=${state.playerId}&roomCode=${state.roomCode}&playerName=${encodeURIComponent(state.playerName)}`;
      setWsUrl(url);
    } else {
      setWsUrl('');
    }
  }, [state.playerId, state.roomCode, state.playerName]);

  // WebSocket connection with message handling
  const { sendMessage, isConnected, error, reconnect } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      console.log('WebSocket message:', message);

      switch (message.type) {
        case 'PLAYER_JOINED':
          dispatch({ type: 'ADD_PARTICIPANT', payload: message.player });
          break;
        case 'PLAYER_LEFT':
          dispatch({ type: 'REMOVE_PARTICIPANT', payload: message.playerId });
          break;
        case 'GAME_STARTED':
          dispatch({ type: 'SET_GAME_STATE', payload: 'IN_PROGRESS' });
          break;
        case 'QUESTION_RECEIVED':
          dispatch({ type: 'SET_CURRENT_QUESTION', payload: message.question });
          dispatch({ type: 'SET_GAME_STATE', payload: 'IN_PROGRESS' });
          break;
        case 'ANSWER_SUBMITTED':
          console.log(`Player ${message.playerId} submitted answer`);
          break;
        case 'ROUND_ENDED':
          dispatch({ type: 'SET_ROUND_RESULTS', payload: message.results });
          dispatch({ type: 'SET_SCORES', payload: message.results.updatedScores });
          dispatch({ type: 'SET_GAME_STATE', payload: 'SHOWING_RESULTS' });
          break;
        case 'GAME_ENDED':
          dispatch({ type: 'SET_SCORES', payload: message.finalScores });
          dispatch({ type: 'SET_GAME_STATE', payload: 'ENDED' });
          break;
        case 'ERROR':
          dispatch({ type: 'SET_ERROR', payload: message.message });
          setTimeout(() => {
            dispatch({ type: 'SET_ERROR', payload: null });
          }, 5000);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    },
    onError: () => {
      dispatch({ type: 'SET_ERROR', payload: 'Connection error occurred' });
    },
  });

  return (
    <WebSocketContext.Provider value={{ sendMessage, isConnected, error, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
