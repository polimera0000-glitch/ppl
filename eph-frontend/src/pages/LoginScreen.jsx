// src/pages/LoginScreen.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";
import { apiService } from "../services/apiService";

// Lucide icons
import {
  Mail,
  LockKeyhole,
  LogIn,
  ArrowLeft,
  // Github,  // commented out
  ShieldCheck,
} from "lucide-react";

// Google Icon (reusing from RegisterScreen)
const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const LoginScreen = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const selectedRole = location.state?.role;
  const isAdmin = (selectedRole || "").toLowerCase() === "admin";

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (
      !/^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email.trim())
    )
      newErrors.email = "Enter a valid email";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Minimum 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
      });

      if (result.success) {
        if (result.mustChangePassword) {
          navigate("/change-password", { replace: true });
        } else {
          const user = result.user;
          const isAdminRole = (user?.role || "").toLowerCase() === "admin";
          navigate(isAdminRole ? "/admin" : "/main", {
            replace: true,
            state: { tab: "competitions" },
          });
        }
      } else {
        setErrorMsg(result.message || "Login failed");
      }
    } catch (err) {
      setErrorMsg(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(true);
    setErrorMsg("");
    try {
      let authUrl;
      if (provider === "google") {
        const response = await apiService.getGoogleAuthUrl();
        authUrl = response.data?.authUrl;
      }
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("Failed to get OAuth URL");
      }
    } catch (err) {
      setErrorMsg(`Failed to initiate ${provider} login: ${err.message}`);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-surface/80 backdrop-blur-xl shadow-card px-5 py-6 md:px-6 md:py-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border border-border bg-surface hover:bg-border transition-colors text-primary-text/80"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>
          {selectedRole && (
            <div className="px-3 py-1.5 rounded-full bg-surface border border-border inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-wide text-secondary-text">
                {selectedRole.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-border">
            <LogIn className="w-6 h-6 text-primary-text" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-text">
              Welcome back
            </h1>
            <p className="text-sm text-secondary-text">Sign in to continue</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <FormInput
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={errors.email}
            icon={Mail}
            required
          />
          <FormInput
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            error={errors.password}
            icon={LockKeyhole}
            showPasswordToggle
            required
          />

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-secondary-text hover:text-primary-text transition-colors text-sm"
            >
              Forgot Password?
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-200 text-sm p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Primary submit */}
          <button
            type="submit"
            disabled={loading || oauthLoading}
            className={[
              "w-full h-12 rounded-xl font-semibold border transition-colors",
              loading || oauthLoading
                ? "bg-border text-secondary-text cursor-not-allowed border-border"
                : "bg-primary hover:bg-primary-hover text-white border-transparent",
            ].join(" ")}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          {!isAdmin && (
            <div className="text-center">
              <button
                type="button"
                onClick={() =>
                  navigate("/register", { state: { role: selectedRole } })
                }
                className="text-secondary-text hover:text-primary-text transition-colors text-sm"
              >
                Don&apos;t have an account?{" "}
                <span className="text-primary">Register</span>
              </button>
            </div>
          )}
        </form>

        {/* OAuth */}
        {!isAdmin && (
          <>
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="px-3 text-secondary-text text-sm">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Only Google, centered */}
            <div className="flex justify-center">
              <button
                onClick={() => handleOAuthLogin("google")}
                disabled={oauthLoading}
                className="h-12 px-5 bg-surface hover:bg-border border border-border rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <GoogleIcon className="w-5 h-5 text-primary-text" />
                <span className="text-primary-text font-semibold text-sm">
                  Google
                </span>
              </button>
            </div>

            <p className="text-secondary-text text-xs text-center mt-3">
              {oauthLoading
                ? "Opening Google..."
                : "Sign in quickly using Google"}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
