import React, { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import logo from "../assets/logo.jpg";
import { useAuth } from "../hooks/useAuth";
import ContactModal from "./ContactModal"; // ✅ import the modal

const GlobalTopBar = ({
  brand = "PPL",
  navLinks = [
    { href: "#about", label: "About", type: "scroll" },
    { href: "#how-it-works", label: "How It Works", type: "scroll" },
    { href: "/courses", label: "Course", type: "route" },
    { href: "#why-ppl", label: "Why PPL", type: "scroll" },
    { href: "/competitions", label: "Competitions", type: "route" },
  ],
  showRegister = true,
  onMobileMenuToggle,
}) => {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false); // ✅ modal state
  const location = useLocation();
  const onLanding = location.pathname === "/" || location.pathname === "/landing";

  const { user, isAuthenticated } = useAuth?.() || {};
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const homeHref = isAuthenticated
    ? `${isAdmin ? "/admin" : "/main"}?tab=dashboard`
    : "/";

  const competitionsHref = isAuthenticated
    ? `${isAdmin ? "/admin" : "/main"}?tab=competitions`
    : "/competitions";

  const showAuthButtons = showRegister && !isAuthenticated;

  const resolveHref = (link) => {
    if (link.label === "Competitions" && link.type === "route") {
      return competitionsHref;
    }
    return link.href;
  };

  const openContact = () => setContactOpen(true);
  const closeContact = () => setContactOpen(false);

  return (
    <>
      <nav className="backdrop-blur-xl shadow-header sticky top-0 z-50 bg-surface/80 border-b border-border safe-top mb-4 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 md:h-20">
            {/* Brand (logo acts as Home / Dashboard) */}
            <RouterLink
              to={homeHref}
              className="flex items-center"
              aria-label="Home"
            >
              <img
                src={logo}
                alt="PPL Logo"
                className="h-8 w-auto sm:h-10 md:h-12 object-contain rounded-lg"
              />
            </RouterLink>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center space-x-6">
              {navLinks.map((link) => {
                if (link.type === "scroll" && onLanding) {
                  return (
                    <button
                      key={link.label}
                      onClick={() => {
                        const targetId = link.href.replace("#", "");
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                          const screenWidth = window.innerWidth;
                          const offset = screenWidth < 768 ? 40 : screenWidth < 1024 ? 30 : 20;
                          const targetPosition = targetElement.offsetTop - offset;
                          window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className="font-medium cursor-pointer text-secondary-text hover:text-primary-text transition-colors text-sm lg:text-base"
                    >
                      {link.label}
                    </button>
                  );
                }
                return (
                  <RouterLink
                    key={link.label}
                    to={resolveHref(link)}
                    className="font-medium text-secondary-text hover:text-primary-text transition-colors text-sm lg:text-base"
                  >
                    {link.label}
                  </RouterLink>
                );
              })}

              {/* ✅ Contact (desktop) */}
              <button
                type="button"
                onClick={openContact}
                className="font-medium text-secondary-text hover:text-primary-text transition-colors"
              >
                Contact
              </button>

              <ThemeToggle />

              {showAuthButtons && (
                <div className="flex items-center gap-3">
                  <RouterLink
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-surface text-primary-text hover:bg-border transition-colors"
                  >
                    Login
                  </RouterLink>
                  <RouterLink
                    to="/roles"
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                  >
                    Sign Up
                  </RouterLink>
                </div>
              )}
            </div>

            {/* Mobile buttons */}
            <div className="lg:hidden flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => {
                  const newOpen = !open;
                  setOpen(newOpen);
                  if (onMobileMenuToggle) {
                    onMobileMenuToggle(newOpen);
                  }
                }}
                className="p-2 rounded-lg border border-border bg-surface hover:bg-border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation"
                aria-label="Toggle menu"
              >
                {open ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sheet */}
        {open && (
          <div className="lg:hidden border-t bg-surface border-border transition-colors animate-fade-in">
            <div className="px-4 sm:px-6 pt-4 pb-6 space-y-3">
              {navLinks.map((link) => {
                if (link.type === "scroll" && onLanding) {
                  return (
                    <button
                      key={link.label}
                      onClick={() => {
                        // Close mobile menu first
                        setOpen(false);
                        if (onMobileMenuToggle) {
                          onMobileMenuToggle(false);
                        }
                        // Then scroll manually after menu closes
                        setTimeout(() => {
                          const targetId = link.href.replace("#", "");
                          const targetElement = document.getElementById(targetId);
                          if (targetElement) {
                            const screenWidth = window.innerWidth;
                            const offset = screenWidth < 768 ? 40 : screenWidth < 1024 ? 30 : 20;
                            const targetPosition = targetElement.offsetTop - offset;
                            window.scrollTo({
                              top: targetPosition,
                              behavior: 'smooth'
                            });
                          }
                        }, 200);
                      }}
                      className="block py-3 px-3 rounded-lg text-base font-medium cursor-pointer text-secondary-text hover:text-primary-text hover:bg-border transition-all duration-200 touch-manipulation w-full text-left"
                    >
                      {link.label}
                    </button>
                  );
                }
                return (
                  <RouterLink
                    key={link.label}
                    to={resolveHref(link)}
                    onClick={() => {
                      setOpen(false);
                      if (onMobileMenuToggle) {
                        onMobileMenuToggle(false);
                      }
                    }}
                    className="block py-3 px-3 rounded-lg text-base font-medium text-secondary-text hover:text-primary-text hover:bg-border transition-all duration-200 touch-manipulation"
                  >
                    {link.label}
                  </RouterLink>
                );
              })}

              {/* ✅ Contact (mobile) */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (onMobileMenuToggle) {
                    onMobileMenuToggle(false);
                  }
                  setTimeout(openContact, 150); // close sheet first, then open modal
                }}
                className="block w-full text-left py-3 px-3 rounded-lg text-base font-medium text-secondary-text hover:text-primary-text hover:bg-border transition-all duration-200 touch-manipulation"
              >
                Contact
              </button>

              {/* {showAuthButtons && (
                <RouterLink
                  to="/roles"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-2 rounded-md font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  Register
                </RouterLink>
              )} */}

              {showAuthButtons && (
                <>
                  <RouterLink
                    to="/login"
                    onClick={() => {
                      setOpen(false);
                      if (onMobileMenuToggle) {
                        onMobileMenuToggle(false);
                      }
                    }}
                    className="block w-full text-center py-3 px-4 rounded-lg font-semibold border border-border bg-surface text-primary-text hover:bg-border transition-all duration-200 touch-manipulation"
                  >
                    Login
                  </RouterLink>
                  <RouterLink
                    to="/roles"
                    onClick={() => {
                      setOpen(false);
                      if (onMobileMenuToggle) {
                        onMobileMenuToggle(false);
                      }
                    }}
                    className="block w-full text-center py-3 px-4 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover transition-all duration-200 touch-manipulation"
                  >
                    Sign Up
                  </RouterLink>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ✅ Contact Modal mounted here */}
      <ContactModal open={contactOpen} onClose={closeContact} />
    </>
  );
};

export default GlobalTopBar;
