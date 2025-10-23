import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Providers
import { AuthProvider } from "./context/AuthProvider.jsx"; // keep your existing auth
// (Removed ColorThemeProvider; theming now happens via useTheme + CSS vars)
// (Optional) keep your palette ThemeProvider if you still use it elsewhere
import { ThemeProvider } from "./context/ThemeProvider.jsx";

// Guards
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./hooks/useAuth";

// Pages
import SplashScreen from "./pages/SplashScreen.jsx";
import AppInitializer from "./components/AppInitializer.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PublicCompetitionScreen from "./pages/PublicCompetitionScreen.jsx";
import RoleSelectionScreen from "./pages/RoleSelectionScreen.jsx";
import LoginScreen from "./pages/LoginScreen.jsx";
import RegisterScreen from "./pages/RegisterScreen.jsx";
import ForgotPasswordScreen from "./pages/ForgotPasswordScreen.jsx";
import ResetPasswordScreen from "./pages/ResetPasswordScreen.jsx";
import ChangePasswordScreen from "./pages/ChangePasswordScreen.jsx";
import OAuthCallbackScreen from "./pages/OAuthCallbackScreen.jsx";
import MainNav from "./pages/MainNav.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminHubScreen from "./pages/AdminHubScreen.jsx";
import RoleListPage from "./pages/RoleListPage.jsx";
import Courses from "./pages/courses.jsx";

import CompetitionRegisterScreen from "./pages/CompetitionRegisterScreen.jsx";
import CompetitionSubmitScreen from "./pages/CompetitionSubmitScreen.jsx";
import CreateCompetitionScreen from "./pages/CreateCompetitionScreen.jsx";
import EditCompetitionScreen from "./pages/EditCompetitionScreen.jsx";
import MySubmission from "./pages/MySubmission.jsx";
import CompetitionLeaderboard from "./pages/CompetitionLeaderboard.jsx";
import ViewCompetitionScreen from "./pages/ViewCompetitionScreen.jsx";
import CompetitionDetails from "./pages/CompetitionDetails.jsx";
import InvitationResponse from "./pages/InvitationResponse.jsx";

import ContactPage from "./pages/ContactPage.jsx";

import VerifyEmail from "./pages/VerifyEmail";

import EmailVerificationNotice from "./pages/EmailVerificationNotice";

import "./index.css";

// --- Small gates ---
// Sends logged-in users to /main or /admin when they hit "/".
function RootGate() {
  const { isAuthenticated, user, hydrated = true } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  if (!hydrated) return null; // or a tiny loader if you prefer
  if (isAuthenticated) {
    const dest = `${isAdmin ? "/admin" : "/main"}?tab=dashboard`;
    return <Navigate to={dest} replace />;
  }
  return <LandingPage />;
}

// Prevents logged-in users from seeing /login or /roles (bounce to app).
function RedirectIfAuthed({ children }) {
  const { isAuthenticated, user, hydrated = true } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  if (!hydrated) return null;
  if (isAuthenticated) {
    const dest = `${isAdmin ? "/admin" : "/main"}?tab=dashboard`;
    return <Navigate to={dest} replace />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public */}
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/landing" element={<LandingPage />} />
              {/* Root now shows AppInitializer which handles splash screen logic */}
              <Route path="/" element={<AppInitializer />} />
              <Route
                path="/competitions"
                element={<PublicCompetitionScreen />}
              />
              <Route
                path="/courses"
                element={<Courses />}
              />
              <Route
                path="/about"
                element={<div>About Page - Coming Soon</div>}
              />
              <Route path="/contact" element={<ContactPage />} />
              {/* <Route path="/roles" element={<RoleSelectionScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} /> */}
              <Route
                path="/roles"
                element={
                  <RedirectIfAuthed>
                    <RoleSelectionScreen />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/login"
                element={
                  <RedirectIfAuthed>
                    <LoginScreen />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/register"
                element={
                  <RedirectIfAuthed>
                    <RegisterScreen />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordScreen />}
              />
              <Route path="/reset-password" element={<ResetPasswordScreen />} />

              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route path="/verify-email-sent" element={<EmailVerificationNotice />} />

              <Route path="/auth/callback" element={<OAuthCallbackScreen />} />
              
              {/* Invitation Response Route */}
              <Route path="/invitations/respond/:token" element={<InvitationResponse />} />
              
              <Route
                path="/competition/:competitionId/leaderboard"
                element={<CompetitionLeaderboard />}
              />
              <Route path="/competition/:id" element={<CompetitionDetails />} />

              {/* Protected */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePasswordScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/main"
                element={
                  <ProtectedRoute>
                    <MainNav />
                  </ProtectedRoute>
                }
              />

              {/* Keep if /admin should render MainNav shell */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <MainNav />
                  </ProtectedRoute>
                }
              />

              {/* Competition flows */}
              <Route
                path="/competition/register"
                element={
                  <ProtectedRoute>
                    <CompetitionRegisterScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/competition/submit"
                element={
                  <ProtectedRoute>
                    <CompetitionSubmitScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/competition/create"
                element={
                  <ProtectedRoute>
                    <CreateCompetitionScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/competition/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditCompetitionScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/competition/:id"
                element={
                  <ProtectedRoute>
                    <ViewCompetitionScreen />
                  </ProtectedRoute>
                }
              />

              {/* Submissions */}
              <Route
                path="/submissions/my"
                element={
                  <ProtectedRoute>
                    <MySubmission />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/competition/:id/submissions"
                element={
                  <ProtectedRoute>
                    <MySubmission />
                  </ProtectedRoute>
                }
              />

              {/* Admin role lists */}
              <Route
                path="/admin/roles/:role"
                element={
                  <ProtectedRoute>
                    <RoleListPage />
                  </ProtectedRoute>
                }
              />

              {/* Optional: Admin hub */}
              <Route
                path="/admin-hub"
                element={
                  <ProtectedRoute>
                    <AdminHubScreen />
                  </ProtectedRoute>
                }
              />

              {/* Convenience */}
              <Route path="/home" element={<Navigate to="/main" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
