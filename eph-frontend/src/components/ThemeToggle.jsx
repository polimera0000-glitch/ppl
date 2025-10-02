import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

const ThemeToggle = ({ className = "" }) => {
  const [theme, setTheme] = useTheme();
  const toggle = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={[
        "relative inline-flex items-center justify-center p-2 rounded-lg transition-colors",
        "bg-surface hover:bg-border border border-border",
        className,
      ].join(" ")}
    >
      {/* Crossfade icons */}
      <Moon className={`h-5 w-5 absolute transition-opacity ${theme === "light" ? "opacity-100" : "opacity-0"} text-primary-text`} />
      <Sun  className={`h-5 w-5 absolute transition-opacity ${theme === "dark"  ? "opacity-100" : "opacity-0"} text-primary`} />
    </button>
  );
};

export default ThemeToggle;
