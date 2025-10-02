// src/context/ThemeContext.jsx
import { createContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const theme = {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      white: '#ffffff',
      text: '#333333',
      error: '#ef4444',
      success: '#10b981',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};