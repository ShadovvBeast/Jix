/**
 * CreateRoom Page
 * Allows users to create a new game room by selecting a category
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full glass rounded-3xl shadow-2xl p-8"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
      >
        <CategorySelection
          onCategorySelect={handleCategorySelect}
          isLoading={isLoading}
          error={error}
        />
      </motion.div>
    </div>
  );
};

export default CreateRoom;
