import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Users, Trophy, Zap } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const floatingIcons = [
    { Icon: Sparkles, delay: 0, x: '10%', y: '20%' },
    { Icon: Trophy, delay: 0.5, x: '85%', y: '15%' },
    { Icon: Zap, delay: 1, x: '15%', y: '75%' },
    { Icon: Users, delay: 1.5, x: '80%', y: '70%' },
  ];

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Background Icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute text-white/10"
          style={{ left: x, top: y }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: 0,
            y: [0, -20, 0],
          }}
          transition={{
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              duration: 1,
              delay,
            },
            y: {
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay,
            },
          }}
        >
          <Icon size={80} />
        </motion.div>
      ))}

      <motion.div
        className="max-w-md w-full glass rounded-3xl shadow-2xl p-8 relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
      >
        {/* Logo/Title with Animation */}
        <motion.div
          className="text-center mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="inline-block"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-2"
              role="heading"
              aria-level={1}
            >
              Jix
            </h1>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 text-gray-700"
          >
            <Sparkles size={20} className="text-yellow-500" />
            <p className="text-lg font-semibold">
              Multiplayer Quiz Game
            </p>
            <Sparkles size={20} className="text-yellow-500" />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-sm text-gray-600 mt-2"
          >
            Challenge your friends in real-time!
          </motion.p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="space-y-4"
          role="navigation"
          aria-label="Main navigation"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button
            onClick={() => navigate('/create')}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg relative overflow-hidden group"
            aria-label="Create a new game room"
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles size={20} />
              Create Room
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>

          <motion.button
            onClick={() => navigate('/join')}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-lg relative overflow-hidden group"
            aria-label="Join an existing game room"
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Users size={20} />
              Join Room
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>

        {/* Fun Stats/Features */}
        <motion.div
          className="mt-8 grid grid-cols-3 gap-4 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { icon: Users, label: 'Multiplayer', color: 'text-blue-600' },
            { icon: Zap, label: 'Real-time', color: 'text-yellow-600' },
            { icon: Trophy, label: 'Compete', color: 'text-purple-600' },
          ].map(({ icon: Icon, label, color }, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="p-3 glass-dark rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Icon className={`${color} mx-auto mb-1`} size={24} />
              <p className="text-xs font-semibold text-white">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
