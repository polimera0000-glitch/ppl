import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Providers
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ThemeProvider } from "./context/ThemeProvider.jsx";

// Guards
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./hooks/useAuth";

// Google Analytics Hook
import useGoogleAnalytics from "./hooks/useGoogleAnalytics";

// Google Analytics must be wrapped safely inside Router
function AnalyticsWrapper() {
  useGoogleAnalytics();
  return null;
}

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
import PaymentScreen from "./pages/PaymentScreen.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentCallback from "./pages/PaymentCallback.jsx";

import ContactPage from "./pages/ContactPage.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import EmailVerificationNotice from "./pages/EmailVerificationNotice.jsx";
import AdminCouponsPage from "./pages/AdminCouponsPage.jsx";

import "./index.css";

// --- Small gates ---
function RootGate() {
  const { isAuthenticated, user, hydrated = true } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  if (!hydrated) return null;
  if (isAuthenticated) {
    return <Navigate to={`${isAdmin ? "/admin" : "/main"}?tab=dashboard`} replace />;
  }
  return <LandingPage />;
}

function RedirectIfAuthed({ children }) {
  const { isAuthenticated, user, hydrated = true } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  if (!hydrated) return null;
  if (isAuthenticated) {
    return <Navigate to={`${isAdmin ? "/admin" : "/main"}?tab=dashboard`} replace />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>

          {/* Google Analytics Hook — SAFE */}
          <AnalyticsWrapper />

          <div className="App">
            <Routes>
              {/* Public */}
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/" element={<AppInitializer />} />
              <Route path="/competitions" element={<PublicCompetitionScreen />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/about" element={<div>About Page - Coming Soon</div>} />
              <Route path="/contact" element={<ContactPage />} />

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

              <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
              <Route path="/reset-password" element={<ResetPasswordScreen />} />

              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-email-sent" element={<EmailVerificationNotice />} />
              <Route path="/auth/callback" element={<OAuthCallbackScreen />} />

              <Route path="/invitations/respond/:token" element={<InvitationResponse />} />

              {/* Payments */}
              <Route path="/payment" element={<PaymentScreen />} />
              <Route path="/payment/:orderId" element={<PaymentScreen />} />
              <Route path="/payment/success/:orderId" element={<PaymentSuccess />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="/payments/history" element={<PaymentSuccess />} />

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

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <MainNav />
                  </ProtectedRoute>
                }
              />

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

              <Route
                path="/admin/roles/:role"
                element={
                  <ProtectedRoute>
                    <RoleListPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/coupons"
                element={
                  <ProtectedRoute>
                    <AdminCouponsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin-hub"
                element={
                  <ProtectedRoute>
                    <AdminHubScreen />
                  </ProtectedRoute>
                }
              />

              <Route path="/home" element={<Navigate to="/main" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
