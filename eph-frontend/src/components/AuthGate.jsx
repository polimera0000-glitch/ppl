// src/components/AuthGate.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import { useAuth } from "../hooks/useAuth";

export default function AuthGate() {
  // make sure your useAuth re-hydrates from localStorage on load (see section 3)
  const { isAuthenticated, user } = useAuth?.() || {};
  const isAdmin = ((user?.role) || "").toLowerCase() === "admin";
  const location = useLocation();

  // If logged in, always push them to the app shell (TopBar + Sidebar)
  if (isAuthenticated) {
    const dest = `${isAdmin ? "/admin" : "/main"}?tab=dashboard`;
    // avoid loops when already inside main/admin
    if (
      location.pathname === "/" ||
      location.pathname === "/login" ||
      location.pathname === "/roles" ||
      location.pathname === "/competitions"
    ) {
      return <Navigate to={dest} replace />;
    }
  }

  // Not logged in -> public landing (TopBar with Login/Sign Up, no sidebar)
  return <LandingPage />;
}
