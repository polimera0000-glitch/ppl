// // src/pages/ChangePasswordScreen.jsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import CustomButton from '../components/CustomButton';
// import FormInput from '../components/FormInput';
// import { apiService } from '../services/apiService';

// // Better icons (lucide-react)
// import {
//   ArrowLeft,
//   LockKeyhole,
//   ShieldCheck,
//   AlertTriangle,
//   KeyRound,
//   Info
// } from 'lucide-react';

// const ChangePasswordScreen = ({ isForced = false }) => {
//   const [formData, setFormData] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [banner, setBanner] = useState({ type: null, message: '' });

//   const navigate = useNavigate();
//   const { mustChangePassword, clearMustChangePassword } = useAuth();

//   const actuallyForced = isForced || mustChangePassword;

//   const validatePassword = (password) => {
//     if (!password || password.length < 8) return 'Password must be at least 8 characters.';
//     const hasUpper = /[A-Z]/.test(password);
//     const hasLower = /[a-z]/.test(password);
//     const hasNumber = /\d/.test(password);
//     const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=;'/\\[\]`~|]/.test(password);
//     if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
//       return 'Must include upper, lower, number, and special character.';
//     }
//     return null;
//   };

//   const setError = (msg) => setBanner({ type: 'error', message: msg });
//   const setSuccess = (msg) => setBanner({ type: 'success', message: msg });
//   const clearBanner = () => setBanner({ type: null, message: '' });

//   const handleInputChange = (field, value) => {
//     if (banner.type) clearBanner();
//     setFormData((p) => ({ ...p, [field]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const passwordError = validatePassword(formData.newPassword);
//     if (passwordError) return setError(passwordError);
//     if (formData.newPassword !== formData.confirmPassword) {
//       return setError('New passwords do not match.');
//     }
//     if (!actuallyForced && !formData.currentPassword) {
//       return setError('Current password is required.');
//     }

//     setLoading(true);
//     clearBanner();

//     try {
//       const result = await apiService.changePassword({
//         currentPassword: actuallyForced ? null : formData.currentPassword,
//         newPassword: formData.newPassword,
//       });

//       if (result?.success) {
//         setSuccess('Password changed successfully. Redirecting…');
//         if (actuallyForced) clearMustChangePassword();
//         setTimeout(() => navigate('/main', { replace: true }), 1000);
//       } else {
//         setError(result?.message || 'Failed to change password.');
//       }
//     } catch (err) {
//       setError(err?.message ? `Error: ${err.message}` : 'Failed to change password.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4
//                     bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
//       <div className="w-full max-w-lg bg-slate-900/70 backdrop-blur-md p-6 md:p-7 rounded-2xl border border-slate-700/60 shadow-2xl">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-3">
//             <button
//               type="button"
//               onClick={() => navigate(-1)}
//               className="text-slate-200/90 hover:text-white transition-colors"
//               aria-label="Go back"
//               title="Go back"
//             >
//               <ArrowLeft className="w-6 h-6" />
//             </button>
//             <h1 className="text-slate-50 text-2xl font-bold">
//               {actuallyForced ? 'Set New Password' : 'Change Password'}
//             </h1>
//           </div>
//           <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
//             <KeyRound className="w-6 h-6 text-cyan-300" />
//           </div>
//         </div>

//         {/* Tip / Policy */}
//         <div className="flex items-start gap-2 mb-5 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
//           <Info className="w-4 h-4 text-slate-300 mt-0.5" />
//           <p className="text-slate-300 text-xs">
//             Use at least <span className="font-semibold">8 characters</span> and include
//             uppercase, lowercase, number, and a special character.
//           </p>
//         </div>

//         {/* Form — force inputs dark even on paste/autofill */}
//         <form
//           onSubmit={handleSubmit}
//           className="
//             space-y-4
//             [&_input]:bg-slate-800/70 [&_input]:text-slate-100 [&_input]:placeholder-slate-400
//             [&_input]:border [&_input]:border-slate-700/70 [&_input]:rounded-lg
//             [&_input]:px-10 [&_input]:py-2
//             [&_input:focus]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-cyan-500/50
//             [&_.icon]:text-slate-300
//           "
//         >
//           {!actuallyForced && (
//             <FormInput
//               type="password"
//               placeholder="Current password"
//               value={formData.currentPassword}
//               onChange={(e) => handleInputChange('currentPassword', e.target.value)}
//               icon={LockKeyhole}
//               showPasswordToggle
//               required
//             />
//           )}

//           <FormInput
//             type="password"
//             placeholder="New password"
//             value={formData.newPassword}
//             onChange={(e) => handleInputChange('newPassword', e.target.value)}
//             icon={LockKeyhole}
//             showPasswordToggle
//             required
//           />

//           <FormInput
//             type="password"
//             placeholder="Confirm new password"
//             value={formData.confirmPassword}
//             onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
//             icon={LockKeyhole}
//             showPasswordToggle
//             required
//           />

//           {/* Banner */}
//           {banner.message && (
//             <div
//               className={`p-3 rounded-lg border flex items-start gap-2 ${
//                 banner.type === 'success'
//                   ? 'bg-emerald-900/20 border-emerald-700/40'
//                   : 'bg-rose-900/20 border-rose-700/40'
//               }`}
//             >
//               {banner.type === 'success' ? (
//                 <ShieldCheck className="w-5 h-5 text-emerald-300 mt-0.5" />
//               ) : (
//                 <AlertTriangle className="w-5 h-5 text-rose-300 mt-0.5" />
//               )}
//               <p className={`text-sm ${banner.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
//                 {banner.message}
//               </p>
//             </div>
//           )}

//           <CustomButton
//             type="submit"
//             text={loading ? 'Updating…' : (actuallyForced ? 'Set Password' : 'Change Password')}
//             enabled={!loading}
//             loading={loading}
//           />
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ChangePasswordScreen;

// src/pages/ChangePasswordScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FormInput from '../components/FormInput';
import { apiService } from '../services/apiService';

// Icons
import { ArrowLeft, LockKeyhole, ShieldCheck, AlertTriangle, KeyRound, Info } from 'lucide-react';

const ChangePasswordScreen = ({ isForced = false }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ type: null, message: '' });

  const navigate = useNavigate();
  const { mustChangePassword, clearMustChangePassword } = useAuth();
  const actuallyForced = isForced || mustChangePassword;

  const validatePassword = (password) => {
    if (!password || password.length < 8) return 'Password must be at least 8 characters.';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=;\'/\\[\]`~|]/.test(password);
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return 'Must include upper, lower, number, and special character.';
    }
    return null;
  };

  const setError = (msg) => setBanner({ type: 'error', message: msg });
  const setSuccess = (msg) => setBanner({ type: 'success', message: msg });
  const clearBanner = () => setBanner({ type: null, message: '' });

  const handleInputChange = (field, value) => {
    if (banner.type) clearBanner();
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) return setError(passwordError);
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('New passwords do not match.');
    }
    if (!actuallyForced && !formData.currentPassword) {
      return setError('Current password is required.');
    }

    setLoading(true);
    clearBanner();

    try {
      const result = await apiService.changePassword({
        currentPassword: actuallyForced ? null : formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (result?.success) {
        setSuccess('Password changed successfully. Redirecting…');
        if (actuallyForced) clearMustChangePassword();
        setTimeout(() => navigate('/main', { replace: true }), 1000);
      } else {
        setError(result?.message || 'Failed to change password.');
      }
    } catch (err) {
      setError(err?.message ? `Error: ${err.message}` : 'Failed to change password.');
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
                type="button"
                onClick={() => navigate(-1)}
                className="text-secondary-text hover:text-primary-text transition-colors"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-primary-text text-2xl font-bold">
                {actuallyForced ? 'Set New Password' : 'Change Password'}
              </h1>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Tip / Policy */}
          <div className="flex items-start gap-2 mb-5 px-3 py-2 rounded-lg bg-background border border-border">
            <Info className="w-4 h-4 text-secondary-text mt-0.5" />
            <p className="text-secondary-text text-xs">
              Use at least <span className="font-semibold text-primary-text">8 characters</span> and include
              uppercase, lowercase, number, and a special character.
            </p>
          </div>

          {/* Form — matches ResetPasswordScreen tokenized inputs */}
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
            {!actuallyForced && (
              <FormInput
                type="password"
                placeholder="Current password"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                icon={LockKeyhole}
                showPasswordToggle
                required
              />
            )}

            <FormInput
              type="password"
              placeholder="New password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              icon={LockKeyhole}
              showPasswordToggle
              required
            />

            <FormInput
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              icon={LockKeyhole}
              showPasswordToggle
              required
            />

            {/* Banner */}
            {banner.message && (
              <div
                className={[
                  "p-3 rounded-lg border flex items-start gap-2",
                  banner.type === 'success'
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-rose-500/10 border-rose-500/30",
                ].join(" ")}
              >
                {banner.type === 'success' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-300 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300 mt-0.5" />
                )}
                <p className="text-sm leading-5 text-primary-text">{banner.message}</p>
              </div>
            )}

            {/* Native submit button (like ResetPasswordScreen) */}
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
              {loading ? 'Saving…' : (actuallyForced ? 'Set Password' : 'Change Password')}
            </button>

            {/* Optional link back */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/main')}
                className="text-secondary-text hover:text-primary-text transition-colors text-sm inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordScreen;
