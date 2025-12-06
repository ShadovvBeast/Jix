/**
 * CategorySelection Component
 * Allows users to select a quiz category either by typing a custom category
 * or selecting from predefined options.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface CategorySelectionProps {
  onCategorySelect: (category: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const PREDEFINED_CATEGORIES = [
  'Science',
  'History',
  'Geography',
  'Sports',
  'Movies',
  'Music',
  'Technology',
  'Literature',
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

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Select a Category
      </h2>

      {/* Custom Category Input (Requirements 1.1, 1.4, 1.5) */}
      <form onSubmit={handleCustomSubmit} className="mb-6">
        <div className="space-y-2">
          <label htmlFor="custom-category" className="block text-sm font-medium text-gray-700">
            Custom Category
          </label>
          <div className="flex gap-2">
            <input
              id="custom-category"
              type="text"
              value={customCategory}
              onChange={handleInputChange}
              placeholder="Enter a custom category..."
              disabled={isLoading}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "category-error" : undefined}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Create room with custom category"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
          
          {/* Validation Error Display (Requirement 1.5) */}
          {validationError && (
            <p id="category-error" className="text-sm text-red-600 slide-in" role="alert">
              {validationError}
            </p>
          )}
          
          {/* API Error Display */}
          {error && (
            <p className="text-sm text-red-600 slide-in" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or choose a category</span>
        </div>
      </div>

      {/* Predefined Category Buttons (Requirements 1.2, 1.3) */}
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Predefined categories">
        {PREDEFINED_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handlePredefinedSelect(category)}
            disabled={isLoading}
            aria-label={`Select ${category} category`}
            className="py-3 px-4 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all hover:scale-105 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-4 focus:ring-purple-300"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;
