/**
 * CreateRoom Page
 * Allows users to create a new game room by selecting a category
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategorySelection from '../components/CategorySelection';

const SERVER_URL = 'http://localhost:9188';

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles category selection and room creation
   * Requirements: 2.1, 2.2, 2.3
   */
  const handleCategorySelect = async (category: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique player ID for the host
      const hostId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const hostName = `Player ${Math.floor(Math.random() * 1000)}`;

      // Call the room creation API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${SERVER_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          hostId,
          hostName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const roomData = await response.json();

      // Store player info in sessionStorage for later use
      sessionStorage.setItem('playerId', hostId);
      sessionStorage.setItem('playerName', hostName);
      sessionStorage.setItem('isHost', 'true');

      // Navigate to the lobby
      navigate(`/lobby/${roomData.code}`);
    } catch (err) {
      console.error('Error creating room:', err);
      
      // Provide user-friendly error messages
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
        } else if (err.message.includes('Failed to fetch')) {
          setError('Cannot connect to server. Please ensure the server is running.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <CategorySelection
          onCategorySelect={handleCategorySelect}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default CreateRoom;
