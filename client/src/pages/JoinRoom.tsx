/**
 * JoinRoom Page
 * Allows users to join an existing game room by entering a room code or scanning a QR code
 * Requirements: 3.1, 3.2, 3.3
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = 'http://localhost:9188';

const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  /**
   * Validates room code format
   * Requirements: 3.2
   */
  const validateRoomCode = (code: string): boolean => {
    const roomCodePattern = /^[A-Z0-9]{6}$/;
    return roomCodePattern.test(code.toUpperCase());
  };

  /**
   * Handles room joining via API call
   * Requirements: 3.2, 3.3
   */
  const handleJoinRoom = async (code: string) => {
    const normalizedCode = code.toUpperCase().trim();

    // Validate room code format
    if (!validateRoomCode(normalizedCode)) {
      setError('Invalid room code format. Please enter a 6-character code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Generate a unique player ID
      const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const playerName = `Player ${Math.floor(Math.random() * 1000)}`;

      // First, check if the room exists with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const checkResponse = await fetch(`${SERVER_URL}/api/rooms/${normalizedCode}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
          throw new Error('Room not found. Please check the room code and try again.');
        }
        throw new Error('Failed to verify room');
      }

      const roomData = await checkResponse.json();

      // Check if game has already started (Requirement 3.3)
      if (roomData.gameState !== 'LOBBY') {
        throw new Error('Cannot join - game has already started');
      }

      // Call the join API with timeout
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

      const joinResponse = await fetch(`${SERVER_URL}/api/rooms/${normalizedCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          playerName,
        }),
        signal: controller2.signal,
      });

      clearTimeout(timeoutId2);

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${joinResponse.status}`);
      }

      // Store player info in sessionStorage
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('playerName', playerName);
      sessionStorage.setItem('isHost', 'false');

      // Show success message briefly
      setSuccessMessage('Successfully joined room!');

      // Stop camera if it's running
      stopCamera();

      // Redirect to lobby after a brief delay
      setTimeout(() => {
        navigate(`/lobby/${normalizedCode}`);
      }, 500);
    } catch (err) {
      console.error('Error joining room:', err);
      
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

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleJoinRoom(roomCode);
  };

  /**
   * Starts the camera for QR code scanning
   * Requirements: 3.1
   */
  const startCamera = async () => {
    try {
      setError(null);
      setShowScanner(true);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start scanning for QR codes
        startQRScanning();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions or enter the room code manually.');
      setShowScanner(false);
    }
  };

  /**
   * Stops the camera stream
   */
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setShowScanner(false);
  };

  /**
   * Scans video frames for QR codes
   * This is a simplified implementation - in production, use a library like html5-qrcode
   */
  const startQRScanning = () => {
    // For this implementation, we'll use a canvas to capture frames
    // In a real app, you'd use a library like html5-qrcode or jsQR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    scanIntervalRef.current = window.setInterval(() => {
      if (videoRef.current && context && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Note: This is a placeholder. In production, you would use a QR code detection library
        // like jsQR or html5-qrcode to actually decode the QR code from the canvas
        // For now, this provides the UI structure for QR scanning
      }
    }, 500);
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 fade-in">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6">
          Join Room
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded slide-in" role="alert">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded slide-in" role="alert">
            {successMessage}
          </div>
        )}

        {/* QR Scanner */}
        {showScanner ? (
          <div className="mb-6">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 border-4 border-white/30 m-8 rounded-lg pointer-events-none" />
            </div>
            <button
              onClick={stopCamera}
              className="w-full mt-4 py-2 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Cancel Scanning
            </button>
            <p className="text-center text-sm text-gray-600 mt-2">
              Position the QR code within the frame
            </p>
          </div>
        ) : (
          <>
            {/* Manual Room Code Entry */}
            <form onSubmit={handleSubmit} className="mb-6">
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                aria-invalid={!!error}
                aria-describedby={error ? "room-error" : undefined}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase transition-all"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading || roomCode.length !== 6}
                aria-label="Join room with entered code"
                className="w-full mt-4 py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-4 focus:ring-purple-300"
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* QR Code Scanner Button */}
            <button
              onClick={startCamera}
              disabled={isLoading}
              aria-label="Scan QR code to join room"
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-4 focus:ring-blue-300"
            >
              Scan QR Code
            </button>
          </>
        )}

        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          disabled={isLoading}
          aria-label="Go back to home page"
          className="w-full mt-4 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all hover:scale-105 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-4 focus:ring-gray-300"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default JoinRoom;
