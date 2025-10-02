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
          <Icon className="w-5 h-5 absolute left-3 text-secondary-text" />
        )}
        <input
          type={showPasswordToggle && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full px-10 py-3 bg-transparent outline-none text-primary-text placeholder-secondary-text"
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 text-secondary-text hover:text-primary-text"
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
