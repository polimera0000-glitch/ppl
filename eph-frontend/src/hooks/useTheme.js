import { useEffect, useState, useCallback } from "react";

/**
 * Simple theme hook that toggles the `dark` class on <html>.
 * Returns [theme, setTheme], where theme is 'light' | 'dark'.
 */
export function useTheme() {
  // initial: from localStorage, else always "light"
  const getInitial = () => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return "light"; // ✅ force light theme by default
  };

  const [theme, _setTheme] = useState(getInitial);

  const apply = useCallback((t) => {
    const html = document.documentElement;
    if (t === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
    html.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  }, []);

  useEffect(() => apply(theme), [theme, apply]);

  // remove auto system sync — we want light as default
  // (you can keep this if you want system sync AFTER first load)
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = (e) => _setTheme(e.matches ? "dark" : "light");
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = useCallback((t) => {
    if (t !== "light" && t !== "dark") return;
    _setTheme(t);
  }, []);

  return [theme, setTheme];
}
