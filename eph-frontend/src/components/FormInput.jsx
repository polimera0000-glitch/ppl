// src/components/FormInput.jsx
import React, { useState } from "react";

const FormInput = ({
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  showPasswordToggle,
  required,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div
        className={[
          "relative flex items-center rounded-lg border transition-colors",
          "bg-surface border-border focus-within:border-primary",
          error && "border-red-500",
        ].join(" ")}
      >
        {Icon && (
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 sm:left-4 text-secondary-text" />
        )}
        <input
          type={showPasswordToggle && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-transparent outline-none text-primary-text placeholder-secondary-text text-base focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-surface rounded-lg"
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 sm:right-4 text-secondary-text hover:text-primary-text transition-colors touch-manipulation p-1"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;
