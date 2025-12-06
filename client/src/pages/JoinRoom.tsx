/**
 * JoinRoom Page
 * Allows users to join an existing game room by entering a room code or scanning a QR code
 * Requirements: 3.1, 3.2, 3.3
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowLeft, LogIn } from 'lucide-react';

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
        <motion.h2
          className="text-3xl md:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Join Room
        </motion.h2>

        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded-2xl font-semibold"
              role="alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              className="mb-4 p-3 bg-green-100 border-2 border-green-400 text-green-700 rounded-2xl font-semibold"
              role="alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {showScanner ? (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <motion.div
                className="absolute inset-0 border-4 border-white/30 m-8 rounded-2xl pointer-events-none"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
            <motion.button
              onClick={stopCamera}
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-bold shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel Scanning
            </motion.button>
            <p className="text-center text-sm text-gray-700 mt-2 font-semibold">
              📱 Position the QR code within the frame
            </p>
          </motion.div>
        ) : (
          <>
            <motion.form
              onSubmit={handleSubmit}
              className="mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <label htmlFor="roomCode" className="block text-sm font-bold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase transition-all font-bold text-center text-2xl tracking-wider"
                disabled={isLoading}
                autoComplete="off"
              />
              <motion.button
                type="submit"
                disabled={isLoading || roomCode.length !== 6}
                aria-label="Join room with entered code"
                className="w-full mt-4 py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-lg shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                whileHover={!isLoading && roomCode.length === 6 ? { scale: 1.02, y: -2 } : {}}
                whileTap={!isLoading && roomCode.length === 6 ? { scale: 0.98 } : {}}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Joining...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Join Room
                    </>
                  )}
                </span>
                {!isLoading && roomCode.length === 6 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            </motion.form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-semibold">or</span>
              </div>
            </div>

            <motion.button
              onClick={startCamera}
              disabled={isLoading}
              aria-label="Scan QR code to join room"
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-black text-lg shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <QrCode size={20} />
                Scan QR Code
              </span>
              {!isLoading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          </>
        )}

        <motion.button
          onClick={() => navigate('/')}
          disabled={isLoading}
          aria-label="Go back to home page"
          className="w-full mt-4 py-3 px-4 glass-dark text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center justify-center gap-2">
            <ArrowLeft size={20} />
            Back to Home
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default JoinRoom;
