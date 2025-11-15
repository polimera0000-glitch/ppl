// src/screens/CompetitionRegisterScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import SidebarLayout from '../components/SidebarLayout';
import Toast from '../components/Toast';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

import {
  Users,
  X,
  ChevronLeft,
  Plus,
  Trash2,
  FileText,
  Mail,
  Phone,
  User,
  Building2,
  GraduationCap,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

const emailFormatOk = (email) =>
  /^[\w.+-]+@([\w-]+\.)+[\w-]{2,}$/i.test(String(email || '').trim());

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizePhone = (p) => String(p || '').trim();

// Pricing (displayed for reference, but not enforced during registration)
const FEE_UNDERGRAD = 999;
const FEE_GRADUATE = 1999;
const feeFor = (eduType) => (eduType === 'graduate' ? FEE_GRADUATE : FEE_UNDERGRAD);

const emptyMember = () => ({
  name: '',
  email: '',
  phone: '',
  gender: 'prefer_not_to_say',
  org: '',
  edu_type: 'undergraduate',
  work_experience_years: '',
});

const CompetitionRegisterScreen = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [competition, setCompetition] = useState(null);
  const [registrationType, setRegistrationType] = useState('individual');

  const [applicant, setApplicant] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'prefer_not_to_say',
    org: '',
    edu_type: 'undergraduate',
    work_experience_years: '',
  });

  const [teamName, setTeamName] = useState('');
  const [abstract, setAbstract] = useState('');
  const [members, setMembers] = useState([]);

  const [agreeTnC, setAgreeTnC] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth?.() || { isAuthenticated: false, user: null };

  const id = location.state?.competitionId;

  const showToast = (type, message, duration = 3500) => {
    setToast({ type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    if (!id) {
      setError('Missing competition ID');
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setApplicant((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        org: user.org || prev.org,
        gender: user.gender || prev.gender,
        edu_type: user.edu_type || prev.edu_type,
        work_experience_years:
          user.work_experience_years != null ? String(user.work_experience_years) : prev.work_experience_years,
      }));
    }

    (async () => {
      try {
        const res = await apiService.getMe?.();
        const u = res?.data?.user || {};
        setApplicant((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
          org: u.org || prev.org,
          gender: u.gender || prev.gender,
          edu_type: u.edu_type || prev.edu_type,
          work_experience_years:
            u.work_experience_years != null ? String(u.work_experience_years) : prev.work_experience_years,
        }));
      } catch (_) {}
    })();

    loadCompetition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated, navigate]);

  const loadCompetition = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCompetition(id);
      if (response?.success && response?.data?.competition) {
        setCompetition(response.data.competition);
      } else if (response?.competition) {
        setCompetition(response.competition);
      } else {
        setError(response?.message || 'Competition not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load competition');
    } finally {
      setLoading(false);
    }
  };

  // Fees (for display only)
  const leaderFee = useMemo(() => feeFor(applicant.edu_type), [applicant.edu_type]);
  const membersFee = useMemo(
    () => members.reduce((sum, m) => sum + feeFor(m.edu_type), 0),
    [members]
  );
  const totalFee = useMemo(
    () => (registrationType === 'individual' ? leaderFee : leaderFee + membersFee),
    [registrationType, leaderFee, membersFee]
  );

  const validatePerson = (p, isLeader = false) => {
    const e = normalizeEmail(p.email);
    const n = String(p.name || '').trim();
    const ph = normalizePhone(p.phone);

    if (!n || n.length < 2) return 'Please enter full name';
    if (!emailFormatOk(e)) return 'Please enter a valid email';
    if (!ph || !/^\+?\d[\d\s\-()]{6,}$/.test(ph)) return 'Please enter a valid mobile number';
    if (!p.org || p.org.trim().length < 2) return 'Please enter organization/institution';
    if (!['undergraduate', 'graduate', 'other'].includes(p.edu_type)) return 'Please select a valid Type';
    if (p.edu_type === 'graduate') {
      const years = Number(p.work_experience_years);
      if (!Number.isFinite(years) || years < 0 || years > 60) {
        return 'Please enter valid work experience (0–60 years)';
      }
    }
    if (isLeader && (!agreeTnC || !agreePrivacy)) {
      return 'You must agree to the Terms & Conditions and Privacy Policy';
    }
    return null;
  };

  const checkUserExistsOrToast = async (email) => {
    try {
      const res = await apiService.checkUserExists(normalizeEmail(email));
      const exists = !!(res?.data?.exists ?? res?.exists);
      if (!exists) {
        showToast('error', 'This email is not registered on the platform. Ask them to sign up first.');
        return false;
      }
      return true;
    } catch {
      showToast('error', 'Could not verify user. Please try again.');
      return false;
    }
  };

  const [memberDraft, setMemberDraft] = useState(emptyMember());

  const resetMemberDraft = () => setMemberDraft(emptyMember());

  const addMember = async () => {
    const err = validatePerson(memberDraft, false);
    if (err) return showToast('error', err);

    const maxTeamSize = competition?.max_team_size || 1;
    if (1 + members.length + 1 > maxTeamSize) {
      return showToast('error', `Maximum team size is ${maxTeamSize} (including you).`);
    }

    if (!(await checkUserExistsOrToast(memberDraft.email))) return;

    const existsAlready =
      normalizeEmail(applicant.email) === normalizeEmail(memberDraft.email) ||
      members.some((m) => normalizeEmail(m.email) === normalizeEmail(memberDraft.email));
    if (existsAlready) {
      return showToast('error', 'This email is already part of the team.');
    }

    setMembers((prev) => [...prev, { ...memberDraft }]);
    resetMemberDraft();
    showToast('success', 'Member added');
  };

  const removeMember = (index) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
    showToast('info', 'Member removed');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (competition?.seats_remaining <= 0) {
      return showToast('error', 'No seats remaining for this competition');
    }

    if (registrationType === 'team') {
      if (!teamName.trim()) return showToast('error', 'Team name is required for team registration');
    }

    const leaderErr = validatePerson(applicant, true);
    if (leaderErr) return showToast('error', leaderErr);

    const applicantExists = await checkUserExistsOrToast(applicant.email);
    if (!applicantExists) return;

    if (registrationType === 'team' && members.length > 0) {
      for (const m of members) {
        const err = validatePerson(m, false);
        if (err) return showToast('error', err);
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      // Update profile
      try {
        const profileUpdatePayload = {
          name: applicant.name.trim(),
          phone: normalizePhone(applicant.phone),
          org: applicant.org.trim(),
          gender: applicant.gender,
          edu_type: applicant.edu_type,
          work_experience_years: applicant.edu_type === 'graduate' ? Number(applicant.work_experience_years || 0) : 0,
          agree_tnc: !!agreeTnC,
          agree_privacy: !!agreePrivacy,
        };
        
        const profileResponse = await apiService.updateProfile(profileUpdatePayload);
        if (profileResponse?.success) {
          console.log('Profile updated successfully during registration');
        } else {
          console.warn('Profile update failed during registration:', profileResponse?.message);
        }
      } catch (profileError) {
        console.error('Profile update error during registration:', profileError);
      }

      const payload = {
        type: registrationType,
        ...(registrationType === 'team' && { team_name: teamName.trim() }),
        ...(abstract.trim() && { abstract: abstract.trim() }),
        applicant: {
          name: applicant.name.trim(),
          email: normalizeEmail(applicant.email),
          phone: normalizePhone(applicant.phone),
          gender: applicant.gender,
          org: applicant.org.trim(),
          edu_type: applicant.edu_type,
          work_experience_years: applicant.edu_type === 'graduate' ? Number(applicant.work_experience_years || 0) : 0,
          agree_tnc: !!agreeTnC,
          agree_privacy: !!agreePrivacy,
        },
        members:
          registrationType === 'team'
            ? members.map((m) => ({
                name: m.name.trim(),
                email: normalizeEmail(m.email),
                phone: normalizePhone(m.phone),
                gender: m.gender,
                org: m.org.trim(),
                edu_type: m.edu_type,
                work_experience_years: m.edu_type === 'graduate' ? Number(m.work_experience_years || 0) : 0,
              }))
            : [],
      };

      if (user?.role === 'admin') {
        const response = await apiService.registerForCompetition(id, payload);

        if (response?.success) {
          showToast('success', 'Admin registration successful!');
          
          try {
            const profileResponse = await apiService.getProfile();
            if (profileResponse?.success && profileResponse?.data?.user) {
              authService.setUser?.(profileResponse.data.user);
            }
          } catch (profileError) {
            console.warn('Failed to refresh profile after registration:', profileError);
          }
          
          navigate('/main?tab=competitions', {
            replace: true,
            state: { justRegisteredCompetitionId: id },
          });
        } else {
          const msg = response?.message || 'Registration failed';
          setError(msg);
          showToast('error', msg);
        }
      } else {
        const registrationData = {
          competitionId: id,
          userType: applicant.edu_type,
          teamSize: registrationType === 'team' ? members.length + 1 : 1,
          teamName: registrationType === 'team' ? teamName : undefined,
          registrationType: registrationType,
          formData: payload
        };

        navigate('/payment', {
          state: registrationData
        });
      }
    } catch (err) {
      const msg = err.message || 'Network error occurred';
      setError(msg);
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const FeePill = ({ eduType }) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
        eduType === 'graduate'
          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
          : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
      }`}
    >
      <GraduationCap className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">
        {eduType === 'graduate' ? '₹1999 • Graduate' : '₹999 • Undergraduate'}
      </span>
      <span className="sm:hidden">
        ₹{feeFor(eduType)}
      </span>
    </span>
  );

  const InputField = ({ icon: Icon, label, type = "text", value, onChange, placeholder, required, readOnly, helper }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          className="w-full h-11 pl-10 pr-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        />
      </div>
      {helper && <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
    </div>
  );

  const SelectField = ({ icon: Icon, label, value, onChange, options, required }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10">
          <Icon className="w-4 h-4" />
        </div>
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="w-full h-11 pl-10 pr-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none text-sm"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <div className="p-3 sm:p-6 max-w-5xl mx-auto">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400" />
            </div>
          )}

          {!loading && error && !competition && (
            <div className="max-w-lg mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={loadCompetition}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && competition && (
            <>
              {/* Sticky Header - Mobile Optimized */}
              <div className="sticky top-0 z-10 -mx-3 sm:mx-0 bg-white dark:bg-slate-800 rounded-none sm:rounded-xl p-3 sm:p-4 border-b sm:border border-slate-200 dark:border-slate-700 mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                        Registration
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{competition.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-6 border border-slate-200 dark:border-slate-700">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Registration Type */}
                  <section className="space-y-2.5">
                    <label className="block font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Registration Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegistrationType('individual')}
                        className={`h-11 sm:h-12 px-3 sm:px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 font-medium text-sm ${
                          registrationType === 'individual'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500'
                        }`}
                      >
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegistrationType('team')}
                        className={`h-11 sm:h-12 px-3 sm:px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 font-medium text-sm ${
                          registrationType === 'team'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500'
                        }`}
                      >
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        Team
                      </button>
                    </div>
                  </section>

                  {/* Team Name */}
                  {registrationType === 'team' && (
                    <section className="space-y-2.5">
                      <InputField
                        icon={FileText}
                        label="Team Name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Enter your team name"
                        required
                        helper={`Max ${competition?.max_team_size || 1} members including you`}
                      />
                    </section>
                  )}

                  {/* Leader Details */}
                  <section className="space-y-3 p-3 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Your Details</h3>
                      <FeePill eduType={applicant.edu_type} />
                    </div>

                    <InputField
                      icon={User}
                      label="Full Name"
                      value={applicant.name}
                      onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                      placeholder="Your name"
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        icon={Mail}
                        label="Email"
                        type="email"
                        value={applicant.email}
                        onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                        readOnly
                      />

                      <InputField
                        icon={Phone}
                        label="Mobile Number"
                        type="tel"
                        value={applicant.phone}
                        onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                        placeholder="+91 90000 00000"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SelectField
                        icon={User}
                        label="Gender"
                        value={applicant.gender}
                        onChange={(e) => setApplicant({ ...applicant, gender: e.target.value })}
                        options={[
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'non_binary', label: 'Non-binary' },
                          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                        ]}
                      />

                      <InputField
                        icon={Building2}
                        label="Organization / Institution"
                        value={applicant.org}
                        onChange={(e) => setApplicant({ ...applicant, org: e.target.value })}
                        placeholder="Your college or company"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SelectField
                        icon={GraduationCap}
                        label="Type"
                        value={applicant.edu_type}
                        onChange={(e) => setApplicant({ ...applicant, edu_type: e.target.value })}
                        options={[
                          { value: 'undergraduate', label: 'Undergraduate' },
                          { value: 'graduate', label: 'Graduate' },
                          { value: 'other', label: 'Other' },
                        ]}
                      />

                      {applicant.edu_type === 'graduate' && (
                        <InputField
                          icon={Briefcase}
                          label="Work Experience (years)"
                          type="number"
                          value={applicant.work_experience_years}
                          onChange={(e) => setApplicant({ ...applicant, work_experience_years: e.target.value })}
                          placeholder="e.g., 2"
                          required
                        />
                      )}
                    </div>
                  </section>

                  {/* Team Members */}
                  {registrationType === 'team' && (
                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          Team Members {members.length > 0 && `(${members.length})`}
                        </h3>
                      </div>

                      {/* Add Member Form */}
                      <div className="space-y-3 p-3 sm:p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Add Team Member</p>
                          <FeePill eduType={memberDraft.edu_type} />
                        </div>

                        <InputField
                          icon={User}
                          label="Full Name"
                          value={memberDraft.name}
                          onChange={(e) => setMemberDraft({ ...memberDraft, name: e.target.value })}
                          placeholder="Member name"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InputField
                            icon={Mail}
                            label="Email"
                            type="email"
                            value={memberDraft.email}
                            onChange={(e) => setMemberDraft({ ...memberDraft, email: e.target.value })}
                            placeholder="member@example.com"
                          />

                          <InputField
                            icon={Phone}
                            label="Mobile Number"
                            type="tel"
                            value={memberDraft.phone}
                            onChange={(e) => setMemberDraft({ ...memberDraft, phone: e.target.value })}
                            placeholder="+91 9xxxx xxxxx"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <SelectField
                            icon={User}
                            label="Gender"
                            value={memberDraft.gender}
                            onChange={(e) => setMemberDraft({ ...memberDraft, gender: e.target.value })}
                            options={[
                              { value: 'male', label: 'Male' },
                              { value: 'female', label: 'Female' },
                              { value: 'non_binary', label: 'Non-binary' },
                              { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                            ]}
                          />

                          <InputField
                            icon={Building2}
                            label="Organization / Institution"
                            value={memberDraft.org}
                            onChange={(e) => setMemberDraft({ ...memberDraft, org: e.target.value })}
                            placeholder="College or company"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <SelectField
                            icon={GraduationCap}
                            label="Type"
                            value={memberDraft.edu_type}
                            onChange={(e) => setMemberDraft({ ...memberDraft, edu_type: e.target.value })}
                            options={[
                              { value: 'undergraduate', label: 'Undergraduate' },
                              { value: 'graduate', label: 'Graduate' },
                              { value: 'other', label: 'Other' },
                            ]}
                          />

                          {memberDraft.edu_type === 'graduate' && (
                            <InputField
                              icon={Briefcase}
                              label="Work Experience (years)"
                              type="number"
                              value={memberDraft.work_experience_years}
                              onChange={(e) => setMemberDraft({ ...memberDraft, work_experience_years: e.target.value })}
                              placeholder="e.g., 1"
                              required
                            />
                          )}
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={addMember}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Add Member
                          </button>
                        </div>
                      </div>

                      {/* Members List */}
                      {members.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
                            Team Members ({members.length})
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                            {members.map((m, index) => (
                              <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{m.name || 'Member'}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 break-all">{m.email}</div>
                                  </div>
                                  <FeePill eduType={m.edu_type} />
                                </div>
                                <div className="space-y-1 text-xs mb-3">
                                  <div className="text-slate-600 dark:text-slate-400">
                                    <span className="font-medium text-slate-900 dark:text-white">Phone: </span>
                                    {m.phone}
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-400">
                                    <span className="font-medium text-slate-900 dark:text-white">Org: </span>
                                    {m.org}
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-400">
                                    <span className="font-medium text-slate-900 dark:text-white">Type: </span>
                                    {m.edu_type}
                                    {m.edu_type === 'graduate' && (
                                      <span> • {Number(m.work_experience_years || 0)} yrs exp</span>
                                    )}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => removeMember(index)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 inline-flex items-center gap-1.5 font-medium transition-colors text-xs"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Project Abstract */}
                  <section className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <label className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Project Abstract</label>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">(Optional)</span>
                    </div>
                    <textarea
                      placeholder="Describe your project idea, approach, or solution..."
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                    />
                  </section>

                  {/* Fees - For Reference Only */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Registration Fees</h3>
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2.5 py-1 rounded-lg border border-yellow-300 dark:border-yellow-700 font-semibold">
                        For Reference Only
                      </span>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* Leader */}
                      <div className="px-3 sm:px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold text-sm">You (Leader)</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 break-all">{applicant.email}</div>
                          </div>
                          <FeePill eduType={applicant.edu_type} />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Fee</span>
                          <span className="text-slate-900 dark:text-white font-bold">₹{leaderFee}</span>
                        </div>
                      </div>

                      {/* Members */}
                      {registrationType === 'team' &&
                        members.map((m, i) => (
                          <div key={i} className="px-3 sm:px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="text-slate-900 dark:text-white font-semibold text-sm">Member {i + 1}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 break-all">{m.email}</div>
                              </div>
                              <FeePill eduType={m.edu_type} />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Fee</span>
                              <span className="text-slate-900 dark:text-white font-bold">₹{feeFor(m.edu_type)}</span>
                            </div>
                          </div>
                        ))}

                      {/* Total */}
                      <div className="px-3 sm:px-4 py-3 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
                        <span className="text-blue-900 dark:text-blue-100 font-bold text-sm">Total</span>
                        <span className="text-blue-900 dark:text-blue-100 font-bold text-lg">₹{totalFee}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 sm:p-3">
                      <strong className="text-blue-700 dark:text-blue-300">Note:</strong> Payment will be processed after form submission.
                    </p>
                  </section>

                  {/* Agreements */}
                  <section className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <input
                        id="agree-tnc"
                        type="checkbox"
                        checked={agreeTnC}
                        onChange={(e) => setAgreeTnC(e.target.checked)}
                        className="mt-0.5 w-4 h-4 shrink-0"
                        required
                      />
                      <label htmlFor="agree-tnc" className="text-slate-600 dark:text-slate-300 text-sm">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Terms &amp; Conditions
                        </button>
                        .
                      </label>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <input
                        id="agree-privacy"
                        type="checkbox"
                        checked={agreePrivacy}
                        onChange={(e) => setAgreePrivacy(e.target.checked)}
                        className="mt-0.5 w-4 h-4 shrink-0"
                        required
                      />
                      <label htmlFor="agree-privacy" className="text-slate-600 dark:text-slate-300 text-sm">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowPrivacy(true)}
                          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Privacy Policy
                        </button>
                        .
                      </label>
                    </div>
                  </section>

                  {/* Error Display */}
                  {error && (
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 shrink-0" />
                        <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 sm:h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-base sm:text-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting Registration…' : 'Submit Registration'}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5 mx-auto"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Cancel and Go Back
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </SidebarLayout>
  );
};

export default CompetitionRegisterScreen;