import React, { useEffect } from "react";

/**
 * Minimal toast component.
 * Usage:
 * <Toast type="success|error|info" message="text" onClose={()=>{}} duration={3000} />
 */
const Toast = ({ type = "info", message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const styles = {
    success: "bg-green-500/15 border-green-500/40 text-green-300",
    error: "bg-red-500/15 border-red-500/40 text-red-300",
    info: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 px-4 py-3 border rounded-lg backdrop-blur-md shadow-lg text-sm font-medium ${styles[type]} animate-fade-in`}
    >
      {message}
    </div>
  );
};

export default Toast;
