import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 fade-in">
        <h1 
          className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-2"
          role="heading"
          aria-level={1}
        >
          Jix
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm md:text-base">
          Multiplayer Quiz Game
        </p>
        
        <div className="space-y-4" role="navigation" aria-label="Main navigation">
          <button
            onClick={() => navigate('/create')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all hover:scale-105 focus:ring-4 focus:ring-blue-300"
            aria-label="Create a new game room"
          >
            Create Room
          </button>
          
          <button
            onClick={() => navigate('/join')}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all hover:scale-105 focus:ring-4 focus:ring-purple-300"
            aria-label="Join an existing game room"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
