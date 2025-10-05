// // src/hooks/useAuth.js
// import { useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// src/hooks/useAuth.js
import { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";

// Small no-op to keep stable function identities when context is missing
const noop = async () => {};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  // In dev, surface incorrect usage loudly; in prod, fall back to safe shape.
  if (!ctx) {
    if (process.env.NODE_ENV !== "production") {
      // Helpful for catching hook usage outside the provider during local dev.
      // You can change this to console.error if you prefer not to throw.
      throw new Error("useAuth must be used within an AuthProvider");
    }
  }

  // Pull values from context or default them
  const {
    user = null,
    token = null,
    isAuthenticated: ctxAuthed,
    hydrated: ctxHydrated,
    login = noop,
    register = noop,
    logout = noop,
    refresh = noop, // if your provider exposes this
  } = ctx || {};

  // Normalize
  const role = ((user?.role ?? "") + "").toLowerCase();
  const isAdmin = role === "admin";
  const isAuthenticated = typeof ctxAuthed === "boolean" ? ctxAuthed : !!token;
  // If provider doesn't expose 'hydrated', treat as true (prevents suspense/blank)
  const hydrated = typeof ctxHydrated === "boolean" ? ctxHydrated : true;

  // Helper to compute where an authed user should land
  const redirectPath = (tab = "dashboard") =>
    `${isAdmin ? "/admin" : "/main"}?tab=${encodeURIComponent(tab)}`;

  // Memoize to keep stable references between renders
  return useMemo(
    () => ({
      // raw
      user,
      token,
      login,
      register,
      logout,
      refresh,
      hydrated,
      // normalized/derived
      role,
      isAdmin,
      isAuthenticated,
      redirectPath,
    }),
    [user, token, login, register, logout, refresh, hydrated, role, isAdmin, isAuthenticated]
  );
};
