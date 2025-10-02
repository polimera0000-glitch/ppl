// src/components/SidebarLayout.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.jpg";
import ThemeToggle from "./ThemeToggle"; // ⬅️ add

// Lucide icons
import {
  Trophy,
  List,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  LockKeyhole,
  LogOut,
} from "lucide-react";

const NavButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border",
      active
        ? "bg-surface text-primary-text border-border ring-2 ring-primary/20"
        : "text-secondary-text hover:text-primary-text bg-surface hover:bg-border border-border",
    ].join(" ")}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

const SidebarLayout = ({ currentPage, onPageChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  // Close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  const handleChangePassword = () => {
    setOpenMenu(false);
    navigate("/change-password");
  };

  const handleLogout = async () => {
    setOpenMenu(false);
    try {
      await logout?.();
    } catch {}
    navigate("/", { replace: true });
  };

  // Role-based page change with correct base path
  const handlePageChange = (page) => {
    onPageChange(page);
    const q = new URLSearchParams(location.search);
    q.set("tab", page);
    const basePath = isAdmin ? "/admin" : "/main";
    navigate({ pathname: basePath, search: `?${q.toString()}` }, { replace: true });
  };

  // Fallback initials avatar
  const initials =
    (user?.name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background text-primary-text">
      <div className="safe-area h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 h-full bg-surface/80 backdrop-blur-xl border-r border-border p-4 flex flex-col">
          {/* Brand with logo */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src={logo}
              alt="PPL Logo"
              className="w-10 h-10 rounded-lg object-cover border border-border"
            />
            <div>
              <div className="text-base font-bold leading-5 text-primary-text">PPL</div>
              <div className="text-xs text-secondary-text">Premier Project League</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-2">
            <NavButton
              label="Competitions"
              active={currentPage === "competitions"}
              onClick={() => handlePageChange("competitions")}
              icon={Trophy}
            />
            <NavButton
              label="Feed"
              active={currentPage === "feed"}
              onClick={() => handlePageChange("feed")}
              icon={List}
            />
            <NavButton
              label="Profile"
              active={currentPage === "profile"}
              onClick={() => handlePageChange("profile")}
              icon={UserIcon}
            />
            {isAdmin && (
              <NavButton
                label="Admin Hub"
                active={currentPage === "admin"}
                onClick={() => handlePageChange("admin")}
                icon={ShieldCheck}
              />
            )}
          </nav>

          {/* Footer (user profile dropdown) */}
          <div className="mt-auto pt-4 border-top border-t border-border relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              className={[
                "w-full flex items-center justify-between gap-3 px-2 py-2 rounded-lg transition-colors select-none border",
                openMenu
                  ? "bg-border text-primary-text border-border"
                  : "bg-surface hover:bg-border text-primary-text border-border",
              ].join(" ")}
              aria-haspopup="menu"
              aria-expanded={openMenu}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-sm font-semibold text-primary-text">
                  {initials}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-semibold truncate text-primary-text">
                    {user?.name || "User"}
                  </div>
                  <div className="text-xs text-secondary-text truncate">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-secondary-text transition-transform ${openMenu ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu && (
              <div
                role="menu"
                className="absolute left-2 right-2 bottom-14 z-30 bg-surface border border-border rounded-lg overflow-hidden shadow-lg"
              >
                <button
                  onClick={handleChangePassword}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-border flex items-center gap-2 text-primary-text transition-colors"
                  role="menuitem"
                >
                  <LockKeyhole className="w-4 h-4 text-secondary-text" />
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-border flex items-center gap-2 text-red-400 transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky Navbar */}
          <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border">
            <div className="px-4 py-3 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-base md:text-lg font-bold text-primary-text">Dashboard</h1>
                {user?.role && (
                  <span className="px-2 py-0.5 rounded-full bg-background border border-border text-[11px] md:text-xs font-semibold text-secondary-text">
                    {(user.role || "").toUpperCase()}
                  </span>
                )}
              </div>

              {/* Right side: Welcome + Theme Toggle */}
              <div className="flex items-center gap-3">
                <ThemeToggle /> {/* ⬅️ toggle placed beside Welcome */}
                <div className="text-xs md:text-sm text-secondary-text">
                  Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-auto bg-background">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
