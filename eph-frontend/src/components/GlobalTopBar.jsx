import React, { useState } from "react";
import { Link } from "react-scroll";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import logo from "../assets/ppl_logo.png";

const GlobalTopBar = ({
  brand = "PPL",
  navLinks = [
    { href: "#about", label: "About", type: "scroll" },
    { href: "#how-it-works", label: "How It Works", type: "scroll" },
    { href: "#course", label: "Course", type: "scroll" },
    { href: "#why-ppl", label: "Why PPL", type: "scroll" },
    { href: "/competitions", label: "Competitions", type: "route" },
  ],
  showRegister = true,
}) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const onLanding = location.pathname === "/";

  return (
    <nav className="backdrop-blur-xl shadow-header sticky top-0 z-50 bg-surface/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand */}
          <RouterLink to="/" className="flex items-center">
            <img src={logo} alt="PPL Logo" className="h-20 w-30 object-cover" />
            
          </RouterLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              if (link.type === "scroll" && onLanding) {
                return (
                  <Link
                    key={link.label}
                    to={link.href.replace("#", "")}
                    smooth
                    duration={800}
                    offset={-80}
                    className="font-medium cursor-pointer text-secondary-text hover:text-primary-text transition-colors"
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <RouterLink
                  key={link.label}
                  to={link.href}
                  className="font-medium text-secondary-text hover:text-primary-text transition-colors"
                >
                  {link.label}
                </RouterLink>
              );
            })}

            <ThemeToggle />

            {showRegister && (
              <RouterLink
                to="/roles"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                Register
              </RouterLink>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-primary-text"
            >
              {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t bg-surface border-border transition-colors">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => {
              if (link.type === "scroll" && onLanding) {
                return (
                  <Link
                    key={link.label}
                    to={link.href.replace("#", "")}
                    smooth
                    duration={800}
                    offset={-80}
                    onClick={() => setOpen(false)}
                    className="block py-2 rounded-md text-base font-medium cursor-pointer text-secondary-text hover:text-primary-text transition-colors"
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <RouterLink
                  key={link.label}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 rounded-md text-base font-medium text-secondary-text hover:text-primary-text transition-colors"
                >
                  {link.label}
                </RouterLink>
              );
            })}
            {showRegister && (
              <RouterLink
                to="/roles"
                onClick={() => setOpen(false)}
                className="block w-full text-center py-2 rounded-md font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                Register
              </RouterLink>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default GlobalTopBar;
