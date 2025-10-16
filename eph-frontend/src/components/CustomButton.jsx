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
      ? 'bg-white bg-opacity-10 hover:bg-opacity-20 active:scale-95 border border-white border-opacity-20 text-white focus:ring-white/50' 
      : 'bg-white bg-opacity-5 border border-white border-opacity-10 cursor-not-allowed text-white/70',
    secondary: enabled && !loading
      ? 'bg-surface text-primary-text border border-border hover:bg-border focus:ring-primary/50'
      : 'bg-surface/50 text-secondary-text border border-border cursor-not-allowed',
    outline: enabled && !loading
      ? 'bg-transparent text-primary-text border border-border hover:bg-border focus:ring-primary/50'
      : 'bg-transparent text-secondary-text border border-border cursor-not-allowed'
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