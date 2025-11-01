// src/components/CustomButton.jsx
import React from 'react';

const CustomButton = ({ 
  text, 
  onPressed, 
  enabled = true, 
  loading = false,
  className = '',
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = true
}) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation";
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-md",
    md: "px-4 py-3 text-base rounded-lg",
    lg: "px-6 py-4 text-lg rounded-lg"
  };
  
  const variantClasses = {
    primary: enabled && !loading 
      ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 border border-blue-600 text-white focus:ring-blue-500/50 shadow-md' 
      : 'bg-gray-400 border border-gray-400 cursor-not-allowed text-white opacity-60',
    secondary: enabled && !loading
      ? 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 focus:ring-gray-500/50'
      : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed',
    outline: enabled && !loading
      ? 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500/50'
      : 'bg-transparent text-gray-400 border border-gray-200 cursor-not-allowed'
  };
  
  const widthClass = fullWidth ? 'w-full' : 'w-auto';
  
  return (
    <button
      type={type}
      onClick={onPressed}
      disabled={!enabled || loading}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${widthClass}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {text}
        </div>
      ) : (
        text
      )}
    </button>
  );
};

export default CustomButton;