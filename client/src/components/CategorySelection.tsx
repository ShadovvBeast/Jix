/**
 * CategorySelection Component
 * Allows users to select a quiz category either by typing a custom category
 * or selecting from predefined options.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Globe, Trophy, Film, Music, Cpu, BookOpen, Send } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface CategorySelectionProps {
  onCategorySelect: (category: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const PREDEFINED_CATEGORIES = [
  { name: 'Science', icon: Brain, gradient: 'from-green-400 to-emerald-600' },
  { name: 'History', icon: BookOpen, gradient: 'from-amber-400 to-orange-600' },
  { name: 'Geography', icon: Globe, gradient: 'from-blue-400 to-cyan-600' },
  { name: 'Sports', icon: Trophy, gradient: 'from-yellow-400 to-orange-500' },
  { name: 'Movies', icon: Film, gradient: 'from-purple-400 to-pink-600' },
  { name: 'Music', icon: Music, gradient: 'from-pink-400 to-rose-600' },
  { name: 'Technology', icon: Cpu, gradient: 'from-indigo-400 to-blue-600' },
  { name: 'Literature', icon: BookOpen, gradient: 'from-teal-400 to-green-600' },
];

const CategorySelection: React.FC<CategorySelectionProps> = ({
  onCategorySelect,
  isLoading = false,
  error = null,
}) => {
  const [customCategory, setCustomCategory] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Validates category input (Requirements 1.4, 1.5)
   * Category must be non-empty and contain at least one non-whitespace character
   */
  const validateCategory = (category: string): boolean => {
    return category.trim().length > 0;
  };

  /**
   * Handles custom category submission (Requirements 1.4, 1.5)
   */
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the input
    if (!validateCategory(customCategory)) {
      setValidationError('Category cannot be empty or contain only whitespace');
      return;
    }

    // Clear any previous errors
    setValidationError(null);
    
    // Proceed with room creation
    onCategorySelect(customCategory.trim());
  };

  /**
   * Handles predefined category button click (Requirement 1.3)
   */
  const handlePredefinedSelect = (category: string) => {
    // Clear any previous errors
    setValidationError(null);
    setCustomCategory('');
    
    // Proceed with room creation
    onCategorySelect(category);
  };

  /**
   * Handles input change and clears validation error
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomCategory(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15,
      },
    },
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="text-yellow-500" size={24} />
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Choose Your Challenge
          </h2>
          <Sparkles className="text-yellow-500" size={24} />
        </div>
        <p className="text-gray-600 text-sm">Pick a category or create your own!</p>
      </motion.div>

      {/* Custom Category Input (Requirements 1.1, 1.4, 1.5) */}
      <motion.form
        onSubmit={handleCustomSubmit}
        className="mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="space-y-2">
          <label htmlFor="custom-category" className="block text-sm font-bold text-gray-700">
            ✨ Custom Category
          </label>
          <div className="flex gap-2">
            <input
              id="custom-category"
              type="text"
              value={customCategory}
              onChange={handleInputChange}
              placeholder="Enter your own category..."
              disabled={isLoading}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "category-error" : undefined}
              className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
            />
            <motion.button
              type="submit"
              disabled={isLoading}
              aria-label="Create room with custom category"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Go</span>
                </>
              )}
            </motion.button>
          </div>
          
          {/* Validation Error Display (Requirement 1.5) */}
          <AnimatePresence>
            {validationError && (
              <motion.p
                id="category-error"
                className="text-sm text-red-600 font-medium"
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                ⚠️ {validationError}
              </motion.p>
            )}
          </AnimatePresence>
          
          {/* API Error Display */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-sm text-red-600 font-medium"
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                ⚠️ {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.form>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500 font-semibold">or pick a favorite</span>
        </div>
      </div>

      {/* Predefined Category Buttons (Requirements 1.2, 1.3) */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        role="group"
        aria-label="Predefined categories"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {PREDEFINED_CATEGORIES.map(({ name, icon: Icon, gradient }) => (
          <motion.button
            key={name}
            onClick={() => handlePredefinedSelect(name)}
            disabled={isLoading}
            aria-label={`Select ${name} category`}
            className={`relative py-4 px-4 bg-gradient-to-br ${gradient} text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group`}
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"
            />
            <div className="relative flex flex-col items-center gap-2">
              <Icon size={28} />
              <span className="text-sm">{name}</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default CategorySelection;
