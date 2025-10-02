import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import RoleCard from "../components/RoleCard";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { useColorTheme } from "../context/ColorThemeProvider";
import { GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);
  const { isDark } = useColorTheme();

  const roles = [
    {
      key: "student",
      title: "Student",
      subtitle: "Showcase projects, join competitions & learn by doing.",
      icon: ({ className }) => <GraduationCap className={className} />,
    },
    {
      key: "admin",
      title: "Admin",
      subtitle: "Create & manage competitions, teams, and results.",
      icon: ({ className }) => <ShieldCheck className={className} />,
    },
  ];

  const handleContinue = () => {
    if (selectedRole) navigate("/login", { state: { role: selectedRole } });
  };

  const handleSkip = () => navigate("/login");

  const buttonBase =
    "w-full py-3 rounded-xl font-bold transition-colors border text-primary-text/95 bg-primary hover:bg-primary-hover border-transparent";

  return (
    <div
      className={[
        "min-h-screen relative overflow-hidden flex items-center",
        "bg-background text-primary-text"
      ].join(" ")}
      style={theme?.gradient ? { backgroundImage: theme.gradient } : undefined}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="safe-area w-full px-5 py-10">
        {/* Header (no navbar) */}
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-border bg-surface">
              <Sparkles className="w-6 h-6 text-primary-text" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary-text">
                Choose your role
              </h1>
              <p className="text-secondary-text text-sm">We’ll tailor the experience for you.</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="transition-colors text-sm md:text-base text-secondary-text hover:text-primary-text"
          >
            Skip
          </button>
        </div>

        {/* Intro card */}
        <div className="max-w-5xl mx-auto p-4 md:p-5 rounded-2xl border border-border bg-surface/80 backdrop-blur-xl mb-8">
          <p className="text-secondary-text">
            Pick a role to get relevant actions, dashboards, and quick-start tips. You can
            switch later in your profile settings.
          </p>
        </div>

        {/* Roles */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-10">
          {roles.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setSelectedRole(role.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedRole(role.key);
                }
              }}
              className={[
                "group text-left rounded-2xl p-4 md:p-5 transition-all focus:outline-none focus:ring-2",
                "border border-border bg-surface/80 backdrop-blur-xl hover:bg-surface",
                selectedRole === role.key ? "ring-2 ring-primary/50" : "focus:ring-primary/40",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-border shadow-inner bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <role.icon className="w-6 h-6 text-primary-text" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-primary-text font-bold text-lg">{role.title}</h3>
                    {selectedRole === role.key && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-primary/10 text-primary-text">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-secondary-text mt-1">{role.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Continue button (no import of CustomButton as requested earlier) */}
        <div className="max-w-md mx-auto">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={[
              buttonBase,
              !selectedRole && "opacity-60 cursor-not-allowed"
            ].join(" ")}
          >
            {selectedRole ? `Continue as ${selectedRole.toUpperCase()}` : "Select a role to continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
