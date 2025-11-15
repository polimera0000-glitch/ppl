// src/pages/RegisterScreen.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";
import { apiService } from "../services/apiService";

import TermsModal from "../components/TermsModal";
import PrivacyModal from "../components/PrivacyModal";

import {
  User as UserIcon,
  Mail,
  Lock,
  GraduationCap,
  Building2,
  Link as LinkIcon,
  Users as UsersIcon,
  Rocket,
  Phone, // ✅ Added
} from "lucide-react";

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",             // ✅ Added
    
    companyName: "",
    companyWebsite: "",
    teamSize: "",
    firmName: "",
    investmentStage: "",
    firmWebsite: "",
  });

  const [agreeBoth, setAgreeBoth] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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

    // ✅ Phone validation added
    if (!formData.phone.trim())
      newErrors.phone = "Mobile number is required";
    else if (!/^\+?\d[\d\s\-()]{6,}$/.test(formData.phone.trim()))
      newErrors.phone = "Enter valid mobile number";

    if (!formData.password || formData.password.length < 6)
      newErrors.password = "6+ chars";

    if (!agreeBoth)
      newErrors.agreeBoth = "You must accept the Terms & Privacy to continue";

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
      setErrorMsg("Admin accounts are invite-only.");
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
        phone: formData.phone.trim(),     // ✅ Added
        role: selectedRole,
        agree_tnc: true,
        agree_privacy: true,
      };

      

      if (selectedRole === "hiring") {
        if (formData.companyName)
          payload.company_name = formData.companyName.trim();
        if (formData.companyWebsite)
          payload.company_website = formData.companyWebsite.trim();
        if (formData.teamSize)
          payload.team_size = parseInt(formData.teamSize, 10);
      }

      if (selectedRole === "investor") {
        if (formData.firmName) payload.firm_name = formData.firmName.trim();
        if (formData.investmentStage)
          payload.investment_stage = formData.investmentStage.trim();
        if (formData.firmWebsite) payload.website = formData.firmWebsite.trim();
      }

      const result = await register(payload);

      if (result.success) {
        const email = (result.user?.email || payload.email || "").trim();
        navigate('/verify-email-sent?email=${encodeURIComponent(email)}', {
          replace: true,
        });
      } else {
        setErrorMsg(result.message || "Registration failed");
      }
    } catch (err) {
      setErrorMsg('Error: ${err.message}');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    
    if (selectedRole === "hiring") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput placeholder="Company name"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            icon={Building2} />
          <FormInput placeholder="Company website"
            value={formData.companyWebsite}
            onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
            icon={LinkIcon} />
          <FormInput type="number" placeholder="Team size"
            value={formData.teamSize}
            onChange={(e) => handleInputChange("teamSize", e.target.value)}
            icon={UsersIcon} />
        </div>
      );
    }

    if (selectedRole === "investor") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput placeholder="Firm / Angel name"
            value={formData.firmName}
            onChange={(e) => handleInputChange("firmName", e.target.value)}
            icon={Building2} />
          <FormInput placeholder="Investment stage"
            value={formData.investmentStage}
            onChange={(e) =>
              handleInputChange("investmentStage", e.target.value)}
            icon={Rocket} />
          <FormInput placeholder="Website / portfolio"
            value={formData.firmWebsite}
            onChange={(e) =>
              handleInputChange("firmWebsite", e.target.value)}
            icon={LinkIcon} />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center px-4 bg-background">
      <div className="mx-auto w-full max-w-md bg-surface/80 p-6 rounded-2xl border">

        <h1 className="text-xl font-bold mb-5">Register</h1>

        <form onSubmit={handleRegister} className="space-y-3">

          <FormInput
            placeholder="Full name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            error={errors.name}
            icon={UserIcon}
            required
          />

          <FormInput
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={errors.email}
            icon={Mail}
            required
          />

          {/* ✅ Phone number field added */}
          <FormInput
            type="tel"
            placeholder="Mobile Number"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            error={errors.phone}
            icon={Phone}
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
            required
          />

          {renderRoleSpecificFields()}

          {/* T&C */}
          <label className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              checked={agreeBoth}
              onChange={(e) => setAgreeBoth(e.target.checked)}
              required
            />
            <span className="text-sm">
              I agree to the Terms & Privacy Policy.
            </span>
          </label>

          {errors.agreeBoth && (
            <p className="text-xs text-red-500">{errors.agreeBoth}</p>
          )}

          {errorMsg && (
            <div className="bg-red-100 text-red-700 p-3 rounded">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-white rounded-xl"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>
      </div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

export default RegisterScreen;