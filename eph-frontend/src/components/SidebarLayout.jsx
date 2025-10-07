import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.jpg";
import ThemeToggle from "./ThemeToggle";

// Lucide icons
import {
  LayoutDashboard,
  Trophy,
  List,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  LockKeyhole,
  LogOut,
  GraduationCap,
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
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const logoDest = isAuthenticated
    ? `${isAdmin ? "/admin" : "/main"}?tab=dashboard`
    : "/";

  // Lock document scroll while app shell is mounted
  useEffect(() => {
    document.body.classList.add("no-doc-scroll");
    return () => document.body.classList.remove("no-doc-scroll");
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  // Close mobile sidebar on route change / ESC
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const handlePageChange = (page) => {
    onPageChange?.(page);
    const q = new URLSearchParams(location.search);
    q.set("tab", page);
    const basePath = isAdmin ? "/admin" : "/main";
    navigate({ pathname: basePath, search: `?${q.toString()}` }, { replace: true });
  };

  const initials =
    (user?.name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  // Use one canonical key: 'dashboard'
  const pageTitleMap = {
    dashboard: "Home",
    competitions: "Competitions",
    feed: "Feed",
    profile: "Profile",
    admin: "Admin Hub",
    courses: "Courses",
  };
  const headerTitle = pageTitleMap[currentPage] || "Home";

  // "Courses" coming soon content
  const isCourses = currentPage === "courses";
  const content = isCourses ? (
    <div className="p-4 md:p-6">
      <div className="bg-surface border border-border rounded-xl p-6 md:p-8 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-secondary-text" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-primary-text mb-2">Courses</h2>
        <p className="text-secondary-text">
          Coming soon… we’re preparing curated lessons, roadmaps, and hands-on tracks.
        </p>
      </div>
    </div>
  ) : (
    children
  );

  return (
    // Anchor the app shell to the viewport; kill outer scrollbar
    <div className="fixed inset-0 overflow-hidden bg-background text-primary-text">
      <div className="flex h-full">
        {/* Sidebar: off-canvas on mobile, sticky on md+ */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            "bg-surface/80 backdrop-blur-xl border-r border-border p-4 flex flex-col",
            "md:static md:translate-x-0 md:w-64 md:sticky md:top-0 md:h-screen md:overflow-y-auto",
          ].join(" ")}
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-3">
            <button
              type="button"
              onClick={() => navigate(logoDest)}
              className="rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Go to home"
              title="Home"
            >
              <img src={logo} alt="PPL Logo" className="w-30 h-20 object-cover" />
            </button>
          </div>

          {/* Nav */}
          <nav className="space-y-2">
            <NavButton
              label="Home"
              active={currentPage === "dashboard"}
              onClick={() => handlePageChange("dashboard")}
              icon={LayoutDashboard}
            />
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
            <NavButton
              label="Courses"
              active={currentPage === "courses"}
              onClick={() => handlePageChange("courses")}
              icon={GraduationCap}
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

          {/* Footer / profile dropdown */}
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
                className={`w-4 h-4 text-secondary-text transition-transform ${
                  openMenu ? "rotate-180" : ""
                }`}
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

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden
          />
        )}

        {/* Right column: sticky header + scrollable main */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full">
          <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border">
            <div className="px-4 py-3 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-base md:text-lg font-bold text-primary-text">{headerTitle}</h1>
                {user?.role && (
                  <span className="px-2 py-0.5 rounded-full bg-background border border-border text-[11px] md:text-xs font-semibold text-secondary-text">
                    {(user.role || "").toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="hidden sm:block text-xs md:text-sm text-secondary-text">
                  Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  className="md:hidden px-3 py-2 rounded-lg border border-border bg-surface hover:bg-border transition focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="Open menu"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-auto bg-background">{content}</main>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
