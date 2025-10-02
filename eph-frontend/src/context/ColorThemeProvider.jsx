import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";

const ColorThemeContext = createContext({
  theme: "system",        // "light" | "dark" | "system"
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ColorThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
    return "system";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Compute dark mode from theme + system preference
  const computeIsDark = useCallback((t) => {
    if (t === "dark") return true;
    if (t === "light") return false;
    // system
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, []);

  const [isDark, setIsDark] = useState(() => computeIsDark(getInitialTheme()));

  // Apply to <html> and persist
  const applyTheme = useCallback((t) => {
    const html = document.documentElement;
    const dark = computeIsDark(t);
    html.classList.toggle("dark", dark);             // Tailwind dark mode (if you use it)
    html.setAttribute("data-theme", dark ? "dark" : "light"); // For your own CSS if needed
    setIsDark(dark);
    localStorage.setItem("theme", t);
  }, [computeIsDark]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Watch system theme changes when theme === "system"
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    // toggle only between light <-> dark; keep system if user explicitly chooses it elsewhere
    setTheme((prev) => {
      const next = computeIsDark(prev) ? "light" : "dark";
      return next;
    });
  }, [computeIsDark]);

  const value = useMemo(() => ({ theme, isDark, setTheme, toggleTheme }), [theme, isDark, toggleTheme]);

  return <ColorThemeContext.Provider value={value}>{children}</ColorThemeContext.Provider>;
};

export const useColorTheme = () => useContext(ColorThemeContext);
