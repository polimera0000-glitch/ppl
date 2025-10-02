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

// Pages
import SplashScreen from "./pages/SplashScreen.jsx";
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

import CompetitionRegisterScreen from "./pages/CompetitionRegisterScreen.jsx";
import CompetitionSubmitScreen from "./pages/CompetitionSubmitScreen.jsx";
import CreateCompetitionScreen from "./pages/CreateCompetitionScreen.jsx";
import EditCompetitionScreen from "./pages/EditCompetitionScreen.jsx";
import MySubmission from "./pages/MySubmission.jsx";
import CompetitionLeaderboard from "./pages/CompetitionLeaderboard.jsx";
import ViewCompetitionScreen from "./pages/ViewCompetitionScreen.jsx";
import CompetitionDetails from "./pages/CompetitionDetails.jsx";

import "./index.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public */}
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/competitions" element={<PublicCompetitionScreen />} />
              <Route path="/about" element={<div>About Page - Coming Soon</div>} />
              <Route path="/roles" element={<RoleSelectionScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
              <Route path="/reset-password" element={<ResetPasswordScreen />} />
              <Route path="/auth/callback" element={<OAuthCallbackScreen />} />
              <Route path="/competition/:competitionId/leaderboard" element={<CompetitionLeaderboard />} />
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
