import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import type { Player } from '../../../shared/types';

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
  const [copied, setCopied] = React.useState(false);

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
      <motion.div
        className="max-w-2xl w-full glass rounded-3xl shadow-2xl p-6 md:p-8"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
      >
        <motion.div
          className="text-center mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="text-purple-600" size={32} />
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Game Lobby
            </h2>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-4 bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-2xl font-semibold"
              role="alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="mb-8 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-gray-600 mb-2 font-semibold" id="room-code-label">
            Room Code
          </p>
          <div className="flex items-center justify-center gap-3">
            <motion.p
              className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 tracking-wider"
              aria-labelledby="room-code-label"
              role="text"
              whileHover={{ scale: 1.05 }}
            >
              {roomCode}
            </motion.p>
            <motion.button
              onClick={handleCopyCode}
              className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Copy room code"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
        >
          <div className="glass p-4 rounded-2xl shadow-xl relative">
            <motion.div
              className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <QrCode size={20} />
            </motion.div>
            <canvas
              ref={canvasRef}
              aria-label={`QR code for room ${roomCode}`}
              role="img"
            />
          </div>
        </motion.div>

        <motion.div
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <Users size={24} className="text-purple-600" />
              Players ({participants.length})
            </h3>
          </div>
          <motion.div
            className="space-y-2"
            role="list"
            aria-label="Players in room"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            <AnimatePresence>
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  role="listitem"
                  className="flex items-center justify-between glass-dark p-4 rounded-2xl transition-all"
                  aria-label={`${participant.name}${participant.isHost ? ', host' : ''}`}
                  variants={{
                    hidden: { x: -50, opacity: 0 },
                    visible: {
                      x: 0,
                      opacity: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 100,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit={{ x: 50, opacity: 0 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg"
                      aria-hidden="true"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        delay: index * 0.05,
                      }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </motion.div>
                    <span className="font-bold text-white text-lg">
                      {participant.name}
                    </span>
                  </div>
                  {participant.isHost && (
                    <motion.span
                      className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-black rounded-full shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      HOST
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {isHost ? (
          <motion.button
            onClick={onStartGame}
            aria-label="Start the game"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-4 px-6 rounded-2xl shadow-2xl text-lg relative overflow-hidden group"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Play size={24} />
              Start Game
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        ) : (
          <motion.div
            className="text-center py-4 px-6 glass-dark rounded-2xl"
            role="status"
            aria-live="polite"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-3 text-white font-bold">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Users size={24} />
              </motion.div>
              <p>Waiting for host to start the game...</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default RoomLobby;
