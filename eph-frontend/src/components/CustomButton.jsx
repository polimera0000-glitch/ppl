// src/components/CustomButton.jsx
import React from 'react';

const CustomButton = ({ 
  text, 
  onPressed, 
  enabled = true, 
  loading = false,
  className = '',
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onPressed}
      disabled={!enabled || loading}
      className={`
        w-full h-12 px-6 rounded-lg font-semibold text-white text-base
        transition-all duration-200 ease-in-out
        ${enabled && !loading 
          ? 'bg-white bg-opacity-10 hover:bg-opacity-20 active:scale-95 border border-white border-opacity-20' 
          : 'bg-white bg-opacity-5 border border-white border-opacity-10 cursor-not-allowed'
        }
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {text}
        </div>
      ) : (
        text
      )}
    </button>
  );
};

export default CustomButton;