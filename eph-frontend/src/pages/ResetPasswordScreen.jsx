// src/pages/ResetPasswordScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';

// Icons
import { LockKeyhole, ArrowLeft, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';

const ResetPasswordScreen = () => {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    setToken(tokenFromUrl);
  }, [searchParams]);

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Use 6+ characters';
    return null;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setMessage(passwordError);
      setSuccess(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setSuccess(false);
      return;
    }

    if (!token) {
      setMessage('Missing reset token. Use the link sent to your email.');
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await apiService.resetPassword(token, formData.password);

      if (result.success) {
        setSuccess(true);
        setMessage(result.message || 'Password reset successful. Redirecting to login…');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setSuccess(false);
        setMessage(result.message || 'Reset failed. The token may be invalid or expired.');
      }
    } catch (error) {
      setSuccess(false);
      setMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-surface/80 backdrop-blur-xl p-6 md:p-7 rounded-2xl border border-border shadow-card">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-secondary-text hover:text-primary-text transition-colors"
                type="button"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-primary-text text-2xl font-bold">Set a new password</h1>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Form (theme-tokenized inputs) */}
          <form
            onSubmit={handleSubmit}
            className="
              space-y-4
              [&_input]:bg-surface [&_input]:text-primary-text [&_input]:placeholder-secondary-text
              [&_input]:border [&_input]:border-border [&_input]:rounded-lg
              [&_input]:px-10 [&_input]:py-2
              [&_input:focus]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-primary/40
              [&_.icon]:text-secondary-text
            "
          >
            <FormInput
              type="password"
              placeholder="New password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              icon={LockKeyhole}
              showPasswordToggle
              required
            />

            <FormInput
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              icon={LockKeyhole}
              showPasswordToggle
              required
            />

            {message && (
              <div
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  success
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                {success ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-300 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-300 mt-0.5" />
                )}
                <p className="text-sm leading-5 text-primary-text">{message}</p>
              </div>
            )}

            {/* Submit (no CustomButton) */}
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
              {loading ? 'Saving…' : 'Save new password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-secondary-text hover:text-primary-text transition-colors text-sm inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
