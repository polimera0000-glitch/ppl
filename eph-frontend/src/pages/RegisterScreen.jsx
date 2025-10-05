// src/pages/RegisterScreen.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";
import { apiService } from "../services/apiService";

// Icons (lucide-react)
import {
  User as UserIcon,
  Mail,
  Lock,
  GraduationCap,
  Building2,
  Link as LinkIcon,
  Users as UsersIcon,
  Rocket,
} from "lucide-react";

// Provider logos
const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GitHubIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    branch: "",
    year: "",
    companyName: "",
    companyWebsite: "",
    teamSize: "",
    firmName: "",
    investmentStage: "",
    firmWebsite: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const selectedRole = location.state?.role || "student";

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email.trim()))
      newErrors.email = "Enter valid email";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "6+ chars";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (selectedRole === "admin") {
      setErrorMsg("Admin accounts are invite-only. Use the admin magic link.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
      };

      // Role-specific fields
      if (selectedRole === "student") {
        if (formData.college) payload.college = formData.college.trim();
        if (formData.branch) payload.branch = formData.branch.trim();
        if (formData.year) payload.year = parseInt(formData.year, 10);
      }

      if (selectedRole === "hiring") {
        if (formData.companyName) payload.company_name = formData.companyName.trim();
        if (formData.companyWebsite) payload.company_website = formData.companyWebsite.trim();
        if (formData.teamSize) payload.team_size = parseInt(formData.teamSize, 10);
      }

      if (selectedRole === "investor") {
        if (formData.firmName) payload.firm_name = formData.firmName.trim();
        if (formData.investmentStage) payload.investment_stage = formData.investmentStage.trim();
        if (formData.firmWebsite) payload.website = formData.firmWebsite.trim();
      }

      const result = await register(payload);

      if (result.success) {
        const user = result.user;
        const isAdminRole = (user?.role || "").toLowerCase() === "admin";
        const destination = isAdminRole ? "/admin" : "/main";
        navigate(destination, { replace: true, state: { tab: "competitions" } });
      } else {
        if (result.errors && typeof result.errors === "object") {
          const fieldErrors = {};
          const generalMessages = [];

          Object.entries(result.errors).forEach(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            const fieldMap = {
              email: "email",
              password: "password",
              name: "name",
              password_hash: "password",
              college: "college",
              branch: "branch",
              year: "year",
              company_name: "companyName",
              company_website: "companyWebsite",
              team_size: "teamSize",
              firm_name: "firmName",
              investment_stage: "investmentStage",
              website: "firmWebsite",
            };
            const mappedField = fieldMap[field] || field;
            if (mappedField in formData) {
              fieldErrors[mappedField] = messageArray[0];
            } else {
              generalMessages.push(`${messageArray.join(", ")}`);
            }
          });

          setErrors(fieldErrors);
          if (generalMessages.length > 0) {
            setErrorMsg(generalMessages.join("\n"));
          } else if (Object.keys(fieldErrors).length > 0) {
            setErrorMsg("Please fix the errors in the form");
          } else {
            setErrorMsg(result.message || "Validation failed - please check your input");
          }
        } else {
          setErrorMsg(result.message || "Registration failed - please try again");
        }
      }
    } catch (err) {
      setErrorMsg(`Error: ${err.message || "Network error occurred"}`);
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
      } else if (provider === "github") {
        const response = await apiService.getGitHubAuthUrl();
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

  const renderRoleSpecificFields = () => {
    // Responsive grid like CompetitionScreen: 1 col on mobile, 2 cols on ≥sm
    const Wrap = ({ children }) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    );

    if (selectedRole === "student") {
      return (
        <Wrap>
          <FormInput
            placeholder="College"
            value={formData.college}
            onChange={(e) => handleInputChange("college", e.target.value)}
            icon={GraduationCap}
          />
          <FormInput
            placeholder="Branch"
            value={formData.branch}
            onChange={(e) => handleInputChange("branch", e.target.value)}
            icon={GraduationCap}
          />
          <FormInput
            type="number"
            inputMode="numeric"
            placeholder="Year (e.g. 3)"
            value={formData.year}
            onChange={(e) => handleInputChange("year", e.target.value)}
            icon={GraduationCap}
          />
        </Wrap>
      );
    }

    if (selectedRole === "hiring") {
      return (
        <Wrap>
          <FormInput
            placeholder="Company name"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            icon={Building2}
          />
          <FormInput
            placeholder="Company website"
            value={formData.companyWebsite}
            onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
            icon={LinkIcon}
          />
          <FormInput
            type="number"
            inputMode="numeric"
            placeholder="Team size"
            value={formData.teamSize}
            onChange={(e) => handleInputChange("teamSize", e.target.value)}
            icon={UsersIcon}
          />
        </Wrap>
      );
    }

    if (selectedRole === "investor") {
      return (
        <Wrap>
          <FormInput
            placeholder="Firm / Angel name"
            value={formData.firmName}
            onChange={(e) => handleInputChange("firmName", e.target.value)}
            icon={Building2}
          />
          <FormInput
            placeholder="Investment stage (seed/series A)"
            value={formData.investmentStage}
            onChange={(e) => handleInputChange("investmentStage", e.target.value)}
            icon={Rocket}
          />
          <FormInput
            placeholder="Website / portfolio"
            value={formData.firmWebsite}
            onChange={(e) => handleInputChange("firmWebsite", e.target.value)}
            icon={LinkIcon}
          />
        </Wrap>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto w-full max-w-md sm:max-w-lg bg-surface/80 backdrop-blur-xl p-4 sm:p-6 md:p-7 rounded-2xl border border-border shadow-card">
        {/* Top bar inside the card */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-primary-text/80 hover:text-primary-text transition-colors text-2xl -ml-1"
              type="button"
              aria-label="Go back"
            >
              ←
            </button>
            <h1 className="text-primary-text text-xl sm:text-2xl font-bold">Register</h1>
          </div>
          {selectedRole && (
            <div className="bg-surface border border-border px-2.5 py-1 rounded-full">
              <span className="text-secondary-text font-semibold text-xs sm:text-sm tracking-wide">
                {selectedRole.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary/10 rounded-xl border border-primary/30 flex items-center justify-center">
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <h2 className="text-primary-text text-lg sm:text-xl font-semibold">
            Create your account
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={handleRegister}
          className="
            space-y-3
            [&_input]:bg-surface [&_input]:text-primary-text [&_input]:placeholder-secondary-text
            [&_input]:border [&_input]:border-border [&_input]:rounded-lg [&_input]:px-10 [&_input]:py-2.5
            [&_input:focus]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-primary/40
            [&_.icon]:text-secondary-text
          "
        >
          <FormInput
            placeholder="Full name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            error={errors.name}
            icon={UserIcon}
            autoComplete="name"
            required
          />
          <FormInput
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={errors.email}
            icon={Mail}
            autoComplete="email"
            inputMode="email"
            required
          />
          <FormInput
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            error={errors.password}
            icon={Lock}
            showPasswordToggle
            autoComplete="new-password"
            required
          />

          {/* Role-specific fields */}
          <div className="space-y-3">{renderRoleSpecificFields()}</div>

          {/* Error message */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-200 text-sm p-3 rounded-lg whitespace-pre-line break-words">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={[
              "w-full h-12 rounded-xl font-semibold border transition-colors",
              loading
                ? "bg-border text-secondary-text cursor-not-allowed border-border"
                : "bg-primary hover:bg-primary-hover text-white border-transparent",
            ].join(" ")}
          >
            {loading ? "Creating..." : "Register"}
          </button>

          {/* Login link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login", { state: { role: selectedRole } })}
              className="text-secondary-text hover:text-primary-text transition-colors text-sm"
            >
              Already have an account?{" "}
              <span className="text-primary font-semibold">Login</span>
            </button>
          </div>
        </form>

        {/* OAuth divider */}
        <div className="flex items-center my-5 sm:my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="px-3 text-secondary-text text-xs sm:text-sm">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* OAuth */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={oauthLoading}
            className="h-11 sm:h-12 px-4 sm:px-5 bg-surface hover:bg-border border border-border rounded-lg transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <GoogleIcon className="w-5 h-5 text-primary-text" />
            <span className="text-primary-text font-semibold text-sm">Google</span>
          </button>
          {/* <button ...>GitHub</button> */}
        </div>

        {/* Hint moved INSIDE the card to avoid outer spacing */}
        <p className="text-secondary-text text-xs text-center mt-3">
          {oauthLoading ? "Opening Google..." : "Register quickly using Google"}
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
