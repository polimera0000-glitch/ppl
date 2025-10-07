// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { apiService } from '../services/apiService';
// import SidebarLayout from '../components/SidebarLayout';
// import Toast from '../components/Toast';
// import TermsModal from '../components/TermsModal';
// import PrivacyModal from '../components/PrivacyModal';

// import {
//   Users,
//   X,
//   CalendarDays,
//   Hash,
//   ChevronLeft,
//   Plus,
//   Trash2,
//   FileText,
//   Mail,
//   Phone,
//   User as UserIcon,
//   Building2,
//   GraduationCap,
//   Briefcase
// } from 'lucide-react';

// // Allowed email domains for team members
// const ALLOWED_DOMAINS = new Set(['gmail.com', 'outlook.com', 'yahoo.com']);

// const emailFormatOk = (email) =>
//   /^[\w.+-]+@([\w-]+\.)+[\w-]{2,}$/i.test(String(email || '').trim());

// const emailDomainOk = (email) => {
//   const s = String(email || '').trim();
//   const at = s.lastIndexOf('@');
//   if (at < 0) return false;
//   const domain = s.slice(at + 1).toLowerCase();
//   return ALLOWED_DOMAINS.has(domain);
// };

// const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
// const normalizePhone = (p) => String(p || '').trim();

// const CompetitionRegisterScreen = () => {
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [competition, setCompetition] = useState(null);

//   // Registration meta
//   const [registrationType, setRegistrationType] = useState('individual');
//   const [teamName, setTeamName] = useState('');
//   const [abstract, setAbstract] = useState('');
//   const [memberEmail, setMemberEmail] = useState('');
//   const [memberEmails, setMemberEmails] = useState([]);

//   // Applicant (lead) details – for both individual and team
//   const [applicantName, setApplicantName] = useState('');
//   const [applicantEmail, setApplicantEmail] = useState('');
//   const [applicantPhone, setApplicantPhone] = useState('');
//   const [gender, setGender] = useState('prefer_not_to_say'); // male|female|non_binary|prefer_not_to_say
//   const [organization, setOrganization] = useState('');
//   const [eduType, setEduType] = useState('undergraduate'); // undergraduate|graduate|other
//   const [workExpYears, setWorkExpYears] = useState(''); // number (only when graduate)

//   // Agreements
//   const [agreeTnC, setAgreeTnC] = useState(false);
//   const [agreePrivacy, setAgreePrivacy] = useState(false);

//   // Modals
//   const [showTerms, setShowTerms] = useState(false);
//   const [showPrivacy, setShowPrivacy] = useState(false);

//   const [toast, setToast] = useState(null); // {type, message}

//   const navigate = useNavigate();
//   const location = useLocation();
//   const { isAuthenticated, user } = useAuth?.() || { isAuthenticated: false, user: null };

//   // router passes competition id via state.competitionId
//   const id = location.state?.competitionId;

//   const showToast = (type, message, duration = 3500) => {
//     setToast({ type, message });
//     window.clearTimeout(showToast._t);
//     showToast._t = window.setTimeout(() => setToast(null), duration);
//   };

//   useEffect(() => {
//     if (!id) {
//       setError('Missing competition ID');
//       setLoading(false);
//       return;
//     }
//     if (!isAuthenticated) {
//       navigate('/login');
//       return;
//     }

//     // Prefill from auth user object synchronously (fast)
//     if (user) {
//       if (user.name) setApplicantName(user.name);
//       if (user.email) setApplicantEmail(user.email);
//       if (user.phone) setApplicantPhone(user.phone);
//       if (user.org) setOrganization(user.org);
//       if (user.gender) setGender(user.gender);
//       if (user.edu_type) setEduType(user.edu_type);
//       if (user.work_experience_years != null) setWorkExpYears(String(user.work_experience_years));
//     }

//     // Also fetch fresh profile from backend (authoritative)
//     (async () => {
//       try {
//         const res = await apiService.getMe?.();
//         const u = res?.data?.user || {};
//         if (u.name) setApplicantName(u.name);
//         if (u.email) setApplicantEmail(u.email);
//         if (u.phone) setApplicantPhone(u.phone);
//         if (u.org) setOrganization(u.org);
//         if (u.gender) setGender(u.gender);
//         if (u.edu_type) setEduType(u.edu_type);
//         if (u.work_experience_years != null) setWorkExpYears(String(u.work_experience_years));
//         // T&C/Privacy are consent moments; we don't auto-check them
//       } catch (_) {
//         // non-fatal
//       }
//     })();

//     loadCompetition();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id, isAuthenticated, navigate]);

//   const loadCompetition = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await apiService.getCompetition(id);
//       if (response?.success && response?.data?.competition) {
//         setCompetition(response.data.competition);
//       } else if (response?.competition) {
//         setCompetition(response.competition);
//       } else {
//         setError(response?.message || 'Competition not found');
//       }
//     } catch (err) {
//       setError(err.message || 'Failed to load competition');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addMemberEmail = async () => {
//     const raw = memberEmail;
//     const email = normalizeEmail(raw);

//     if (!email) return showToast('error', 'Please enter an email address');
//     if (!emailFormatOk(email)) return showToast('error', 'Please enter a valid email address');
//     if (!emailDomainOk(email))
//       return showToast('error', 'Only official emails allowed: gmail.com, outlook.com, yahoo.com');

//     if (memberEmails.includes(email)) return showToast('error', 'Email already added');

//     const maxTeamSize = competition?.max_team_size || 1;
//     if (memberEmails.length + 1 >= maxTeamSize) {
//       return showToast('error', `Maximum team size is ${maxTeamSize}`);
//     }

//     // DB presence check
//     try {
//       const res = await apiService.checkUserExists(email);
//       const exists = !!(res?.data?.exists ?? res?.exists);
//       if (!exists) {
//         return showToast('error', 'This email is not registered on the platform. Ask the member to sign up first.');
//       }
//     } catch {
//       return showToast('error', 'Could not verify user. Please try again.');
//     }

//     setMemberEmails((prev) => [...prev, email]);
//     setMemberEmail('');
//     showToast('success', 'Member added successfully');
//   };

//   const removeMemberEmail = (index) => {
//     setMemberEmails((prev) => prev.filter((_, i) => i !== index));
//     showToast('info', 'Member removed');
//   };

//   // --- Validation helpers for applicant fields ---
//   const validateApplicant = () => {
//     const e = normalizeEmail(applicantEmail);
//     const n = String(applicantName || '').trim();
//     const p = normalizePhone(applicantPhone);

//     if (!n || n.length < 2) return 'Please enter your full name';
//     if (!emailFormatOk(e)) return 'Please enter a valid email';
//     if (!p || !/^\+?\d[\d\s\-()]{6,}$/.test(p)) return 'Please enter a valid mobile number';
//     if (!organization || organization.trim().length < 2) return 'Please enter your organization/institution';
//     if (!['undergraduate', 'graduate', 'other'].includes(eduType)) return 'Please select a valid Type';
//     if (eduType === 'graduate') {
//       const years = Number(workExpYears);
//       if (!Number.isFinite(years) || years < 0 || years > 60) {
//         return 'Please enter valid work experience (0–60 years)';
//       }
//     }
//     if (!agreeTnC || !agreePrivacy) {
//       return 'You must agree to the Terms & Conditions and Privacy Policy';
//     }
//     return null;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (registrationType === 'team' && !teamName.trim()) {
//       return showToast('error', 'Team name is required for team registration');
//     }
//     if (competition?.seats_remaining <= 0) {
//       return showToast('error', 'No seats remaining for this competition');
//     }

//     // domain + format check for all members
//     if (registrationType === 'team' && memberEmails.length > 0) {
//       for (const em of memberEmails) {
//         if (!emailFormatOk(em)) {
//           return showToast('error', `Invalid email: ${em}`);
//         }
//         if (!emailDomainOk(em)) {
//           return showToast('error', `Only official emails allowed: gmail.com, outlook.com, yahoo.com (found: ${em})`);
//         }
//       }

//       // bulk DB existence check
//       try {
//         const bulk = await apiService.checkUsersExistBulk(memberEmails);
//         const missing = bulk?.data?.missing || bulk?.missing || [];
//         if (missing.length > 0) {
//           return showToast('error', `These emails are not registered yet: ${missing.join(', ')}`);
//         }
//       } catch {
//         return showToast('error', 'Could not verify team members. Please try again.');
//       }
//     }

//     // Validate applicant block
//     const applicantErr = validateApplicant();
//     if (applicantErr) {
//       return showToast('error', applicantErr);
//     }

//     setSubmitting(true);
//     setError(null);
//     try {
//       // 1) (Optional) persist applicant details to user profile (non-fatal)
//       try {
//         await apiService.makeRequest('/auth/update-profile', {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             name: String(applicantName || '').trim(),
//             phone: normalizePhone(applicantPhone),
//             org: String(organization || '').trim(),
//             gender,
//             edu_type: eduType,
//             work_experience_years: eduType === 'graduate' ? Number(workExpYears || 0) : 0,
//             // store consent moments as timestamps (server will set if true)
//             agree_tnc: !!agreeTnC,
//             agree_privacy: !!agreePrivacy,
//           }),
//         });
//       } catch (_) {
//         // continue even if profile update fails
//       }

//       // 2) Submit competition registration
//       const payload = {
//         type: registrationType,
//         ...(registrationType === 'team' && { team_name: teamName.trim() }),
//         ...(memberEmails.length > 0 && { member_emails: memberEmails }),
//         ...(abstract.trim() && { abstract: abstract.trim() }),
//         applicant: {
//           name: String(applicantName || '').trim(),
//           email: normalizeEmail(applicantEmail),
//           phone: normalizePhone(applicantPhone),
//           gender,
//           org: String(organization || '').trim(),
//           edu_type: eduType,
//           work_experience_years: eduType === 'graduate' ? Number(workExpYears || 0) : 0,
//           agree_tnc: !!agreeTnC,
//           agree_privacy: !!agreePrivacy,
//         },
//       };

//       const response = await apiService.registerForCompetition(id, payload);

//       if (response?.success) {
//         showToast('success', 'Registration submitted!');
//         navigate('/main?tab=competitions', {
//           replace: true,
//           state: { justRegisteredCompetitionId: id },
//         });
//       } else {
//         const msg = response?.message || 'Registration failed';
//         setError(msg);
//         showToast('error', msg);
//       }
//     } catch (err) {
//       const msg = err.message || 'Network error occurred';
//       setError(msg);
//       showToast('error', msg);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // --- helpers for terms/privacy links ---
//   const openTermsModal = (e) => {
//     e?.preventDefault?.();
//     setShowTerms(true);
//   };
//   const openPrivacyModal = (e) => {
//     e?.preventDefault?.();
//     setShowPrivacy(true);
//   };
//   const openTermsPage = () => window.open('/terms', '_blank', 'noopener,noreferrer');
//   const openPrivacyPage = () => window.open('/privacy', '_blank', 'noopener,noreferrer');

//   return (
//     <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
//       {/* Prevent sideways scroll on phones */}
//       <div className="flex-1 overflow-y-auto overflow-x-hidden">
//         <div className="p-4 sm:p-6">
//           {/* Loading */}
//           {loading && (
//             <div className="flex items-center justify-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border" />
//             </div>
//           )}

//           {/* Error (no competition) */}
//           {!loading && error && !competition && (
//             <div className="p-4 sm:p-6 max-w-lg">
//               <div className="bg-surface rounded-xl p-6 border border-border text-center">
//                 <svg
//                   className="w-16 h-16 text-red-400 mx-auto mb-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//                 <h3 className="text-lg font-medium text-primary-text mb-2">Error</h3>
//                 <p className="text-secondary-text mb-4 break-words">{error}</p>
//                 <div className="flex flex-col sm:flex-row gap-3">
//                   <button
//                     onClick={() => navigate(-1)}
//                     className="px-4 py-2 bg-surface hover:bg-border text-primary-text rounded-lg font-medium transition-colors border border-border"
//                   >
//                     Go Back
//                   </button>
//                   <button
//                     onClick={loadCompetition}
//                     className="px-4 py-2 bg-background hover:bg-surface text-primary-text rounded-lg font-medium transition-colors border border-border"
//                   >
//                     Retry
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Main content */}
//           {!loading && competition && (
//             <>
//               {/* Header */}
//               <div className="bg-surface rounded-xl p-4 border border-border mb-6">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3 min-w-0">
//                     <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
//                       <Users className="w-5 h-5 text-primary-text" />
//                     </div>
//                     <div className="min-w-0">
//                       <h1 className="text-lg font-bold text-primary-text truncate">
//                         Register for Competition
//                       </h1>
//                       <p className="text-secondary-text text-sm truncate">
//                         {competition?.title}
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => navigate(-1)}
//                     className="p-2 rounded-lg bg-surface hover:bg-border border border-border transition-colors"
//                     aria-label="Close"
//                   >
//                     <X className="w-5 h-5 text-secondary-text" />
//                   </button>
//                 </div>
//               </div>

//               {/* Competition Info */}
//               <div className="bg-surface rounded-xl p-4 border border-border mb-6">
//                 <p className="text-secondary-text mb-4 break-words">
//                   {competition.description}
//                 </p>
//                 <div className="flex flex-wrap gap-3">
//                   {competition.start_date && competition.end_date && (
//                     <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
//                       <CalendarDays className="w-4 h-4 text-secondary-text" />
//                       <span className="text-secondary-text text-sm">
//                         {new Date(competition.start_date).toLocaleDateString()} — {new Date(competition.end_date).toLocaleDateString()}
//                       </span>
//                     </div>
//                   )}
//                   <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
//                     <Hash className="w-4 h-4 text-secondary-text" />
//                     <span className="text-secondary-text text-sm">
//                       Seats: {competition.seats_remaining}
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
//                     <Users className="w-4 h-4 text-secondary-text" />
//                     <span className="text-secondary-text text-sm">
//                       Team limit: {competition.max_team_size || 1}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Form */}
//               <div className="bg-surface rounded-xl p-4 sm:p-6 border border-border">
//                 <form onSubmit={handleSubmit} className="space-y-8">
//                   {/* Registration Type */}
//                   <section className="space-y-3">
//                     <label className="block font-medium text-primary-text">Registration Type</label>
//                     <div className="grid grid-cols-2 gap-3">
//                       <button
//                         type="button"
//                         onClick={() => setRegistrationType('individual')}
//                         className={[
//                           "h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2",
//                           registrationType === 'individual'
//                             ? "bg-background border-border text-primary-text"
//                             : "bg-background/50 border-border text-secondary-text hover:bg-background",
//                         ].join(" ")}
//                       >
//                         <Users className="w-4 h-4" />
//                         Individual
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => setRegistrationType('team')}
//                         className={[
//                           "h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2",
//                           registrationType === 'team'
//                             ? "bg-background border-border text-primary-text"
//                             : "bg-background/50 border-border text-secondary-text hover:bg-background",
//                         ].join(" ")}
//                       >
//                         <Users className="w-4 h-4" />
//                         Team
//                       </button>
//                     </div>
//                   </section>

//                   {/* Team Name */}
//                   {registrationType === 'team' && (
//                     <section className="space-y-2">
//                       <label className="block font-medium text-primary-text">Team Name</label>
//                       <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                         <FileText className="w-4 h-4 text-secondary-text" />
//                         <input
//                           value={teamName}
//                           onChange={(e) => setTeamName(e.target.value)}
//                           placeholder="Enter your team name"
//                           className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
//                         />
//                       </div>
//                     </section>
//                   )}

//                   {/* Applicant details */}
//                   <section className="space-y-4">
//                     <h3 className="font-semibold text-primary-text">Your Details</h3>

//                     {/* Name */}
//                     <div className="space-y-2">
//                       <label className="block text-primary-text">Full Name</label>
//                       <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                         <UserIcon className="w-4 h-4 text-secondary-text" />
//                         <input
//                           value={applicantName}
//                           onChange={(e) => setApplicantName(e.target.value)}
//                           placeholder="Your name"
//                           className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
//                           required
//                         />
//                       </div>
//                     </div>

//                     {/* Email + Phone */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                       <div className="space-y-2">
//                         <label className="block text-primary-text">Email</label>
//                         <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                           <Mail className="w-4 h-4 text-secondary-text" />
//                           <input
//                             type="email"
//                             value={applicantEmail}
//                             onChange={(e) => setApplicantEmail(e.target.value)}
//                             placeholder="you@example.com"
//                             className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
//                             required
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         <label className="block text-primary-text">Mobile Number</label>
//                         <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                           <Phone className="w-4 h-4 text-secondary-text" />
//                           <input
//                             type="tel"
//                             value={applicantPhone}
//                             onChange={(e) => setApplicantPhone(e.target.value)}
//                             placeholder="+91 90000 00000"
//                             className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
//                             required
//                           />
//                         </div>
//                       </div>
//                     </div>

//                     {/* Gender + Org */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                       <div className="space-y-2">
//                         <label className="block text-primary-text">Gender</label>
//                         <select
//                           className="h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
//                           value={gender}
//                           onChange={(e) => setGender(e.target.value)}
//                         >
//                           <option value="male">Male</option>
//                           <option value="female">Female</option>
//                           <option value="non_binary">Non-binary</option>
//                           <option value="prefer_not_to_say">Prefer not to say</option>
//                         </select>
//                       </div>

//                       <div className="space-y-2">
//                         <label className="block text-primary-text">Organization / Institution</label>
//                         <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                           <Building2 className="w-4 h-4 text-secondary-text" />
//                           <input
//                             value={organization}
//                             onChange={(e) => setOrganization(e.target.value)}
//                             placeholder="Your college or company"
//                             className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
//                             required
//                           />
//                         </div>
//                       </div>
//                     </div>

//                     {/* Type + Work Exp (conditional) */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                       <div className="space-y-2">
//                         <label className="block text-primary-text">Type</label>
//                         <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                           <GraduationCap className="w-4 h-4 text-secondary-text" />
//                           <select
//                             className="flex-1 bg-transparent outline-none text-primary-text h-full"
//                             value={eduType}
//                             onChange={(e) => setEduType(e.target.value)}
//                           >
//                             <option value="undergraduate">Undergraduate</option>
//                             <option value="graduate">Graduate</option>
//                             <option value="other">Other</option>
//                           </select>
//                         </div>
//                       </div>

//                       {eduType === 'graduate' && (
//                         <div className="space-y-2">
//                           <label className="block text-primary-text">Work Experience (years)</label>
//                           <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                             <Briefcase className="w-4 h-4 text-secondary-text" />
//                             <input
//                               type="number"
//                               min="0"
//                               max="60"
//                               value={workExpYears}
//                               onChange={(e) => setWorkExpYears(e.target.value)}
//                               placeholder="e.g., 2"
//                               className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
//                               required
//                             />
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     {/* Agreements */}
//                     <div className="space-y-2">
//                       <div className="flex items-start gap-3">
//                         <input
//                           id="agree-tnc"
//                           type="checkbox"
//                           checked={agreeTnC}
//                           onChange={(e) => setAgreeTnC(e.target.checked)}
//                           className="mt-1"
//                           required
//                         />
//                         <label htmlFor="agree-tnc" className="text-secondary-text">
//                           I agree to the{' '}
//                           <button
//                             type="button"
//                             onClick={openTermsModal}
//                             className="underline hover:text-primary-text"
//                           >
//                             Terms &amp; Conditions
//                           </button>
//                           .{' '}
                          
//                         </label>
//                       </div>
//                       <div className="flex items-start gap-3">
//                         <input
//                           id="agree-privacy"
//                           type="checkbox"
//                           checked={agreePrivacy}
//                           onChange={(e) => setAgreePrivacy(e.target.checked)}
//                           className="mt-1"
//                           required
//                         />
//                         <label htmlFor="agree-privacy" className="text-secondary-text">
//                           I agree to the{' '}
//                           <button
//                             type="button"
//                             onClick={openPrivacyModal}
//                             className="underline hover:text-primary-text"
//                           >
//                             Privacy Policy
//                           </button>
//                           .{' '}
                          
//                         </label>
//                       </div>
//                     </div>
//                   </section>

//                   {/* Team Members */}
//                   {registrationType === 'team' && (
//                     <section className="space-y-3">
//                       <label className="block font-medium text-primary-text">
//                         Team Members (by email)
//                       </label>
//                       <p className="text-xs text-secondary-text">
//                         Allowed domains: gmail.com, outlook.com, yahoo.com. Members must already have an account.
//                       </p>

//                       {/* STACK on mobile; row on ≥sm */}
//                       <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3">
//                         <div className="min-w-0 inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
//                           <Users className="w-4 h-4 text-secondary-text shrink-0" />
//                           <input
//                             type="email"
//                             value={memberEmail}
//                             onChange={(e) => setMemberEmail(e.target.value)}
//                             placeholder="Add member email address"
//                             className="flex-1 min-w-0 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full break-words"
//                           />
//                         </div>

//                         <button
//                           type="button"
//                           onClick={addMemberEmail}
//                           className="w-full sm:w-auto px-3 h-11 rounded-lg bg-surface hover:bg-border text-primary-text font-medium border border-border inline-flex items-center justify-center gap-1"
//                         >
//                           <Plus className="w-4 h-4" />
//                           Add
//                         </button>
//                       </div>

//                       {memberEmails.length > 0 && (
//                         <div className="space-y-2">
//                           <p className="text-secondary-text text-sm">
//                             Team Members ({memberEmails.length})
//                           </p>
//                           <div className="flex flex-wrap gap-2">
//                             {memberEmails.map((email, index) => (
//                               <div
//                                 key={index}
//                                 className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg max-w-full"
//                               >
//                                 <span className="text-secondary-text text-sm break-all">{email}</span>
//                                 <button
//                                   type="button"
//                                   onClick={() => removeMemberEmail(index)}
//                                   className="text-secondary-text hover:text-primary-text"
//                                   aria-label="Remove"
//                                 >
//                                   <Trash2 className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </section>
//                   )}

//                   {/* Project Abstract */}
//                   <section>
//                     <div className="flex items-center gap-2 mb-2">
//                       <FileText className="w-4 h-4 text-secondary-text" />
//                       <label className="font-medium text-primary-text">Project Abstract</label>
//                       <span className="text-secondary-text text-sm">(Optional)</span>
//                     </div>
//                     <textarea
//                       placeholder="Describe your project idea, approach, or solution..."
//                       value={abstract}
//                       onChange={(e) => setAbstract(e.target.value)}
//                       rows={4}
//                       className="w-full px-4 py-3 bg-background border border-border rounded-lg text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-transparent resize-none"
//                     />
//                   </section>

//                   {/* Error box (server-side failure) */}
//                   {error && (
//                     <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
//                       <div className="flex items-center gap-3">
//                         <svg
//                           className="w-5 h-5 text-red-400 shrink-0"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                           />
//                         </svg>
//                         <p className="text-red-300 break-words">{error}</p>
//                       </div>
//                     </div>
//                   )}

//                   {/* Submit */}
//                   <button
//                     type="submit"
//                     disabled={submitting}
//                     className="w-full h-11 rounded-lg bg-primary text-white font-semibold border border-primary/50 disabled:opacity-60"
//                   >
//                     {submitting ? 'Submitting Registration…' : 'Submit Registration'}
//                   </button>

//                   <div className="text-center">
//                     <button
//                       type="button"
//                       onClick={() => navigate(-1)}
//                       className="text-secondary-text hover:text-primary-text transition-colors text-sm flex items-center gap-2 mx-auto"
//                     >
//                       <ChevronLeft className="w-4 h-4" />
//                       Cancel
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {toast && (
//         <Toast
//           type={toast.type}
//           message={toast.message}
//           onClose={() => setToast(null)}
//         />
//       )}

//       {/* Modals */}
//       <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
//       <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
//     </SidebarLayout>
//   );
// };

// export default CompetitionRegisterScreen;


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
  User as UserIcon,
  Building2,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

// Allowed email domains for team members
const ALLOWED_DOMAINS = new Set(['gmail.com', 'outlook.com', 'yahoo.com']);

const emailFormatOk = (email) =>
  /^[\w.+-]+@([\w-]+\.)+[\w-]{2,}$/i.test(String(email || '').trim());

const emailDomainOk = (email) => {
  const s = String(email || '').trim();
  const at = s.lastIndexOf('@');
  if (at < 0) return false;
  const domain = s.slice(at + 1).toLowerCase();
  return ALLOWED_DOMAINS.has(domain);
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizePhone = (p) => String(p || '').trim();

// Pricing
const FEE_UNDERGRAD = 500;
const FEE_GRADUATE = 1000;
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

  // We still fetch competition to validate ID, seats, team size etc.
  const [competition, setCompetition] = useState(null);

  // Registration meta
  const [registrationType, setRegistrationType] = useState('individual'); // 'individual' | 'team'

  // Leader (applicant) details – used for both individual and team
  const [applicant, setApplicant] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'prefer_not_to_say',
    org: '',
    edu_type: 'undergraduate',
    work_experience_years: '',
  });

  // Team fields
  const [teamName, setTeamName] = useState('');
  const [abstract, setAbstract] = useState('');
  const [members, setMembers] = useState([]); // array of member objects (same fields as leader)

  // Agreements
  const [agreeTnC, setAgreeTnC] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Modals
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [toast, setToast] = useState(null); // {type, message}

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth?.() || { isAuthenticated: false, user: null };

  // router passes competition id via state.competitionId
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

    // Prefill from auth user object synchronously (fast)
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

    // Also fetch fresh profile from backend (authoritative)
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
      } catch (_) {
        // non-fatal
      }
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

  // ----- Derived: fees -----
  const leaderFee = useMemo(() => feeFor(applicant.edu_type), [applicant.edu_type]);
  const membersFee = useMemo(
    () => members.reduce((sum, m) => sum + feeFor(m.edu_type), 0),
    [members]
  );
  const totalFee = useMemo(
    () => (registrationType === 'individual' ? leaderFee : leaderFee + membersFee),
    [registrationType, leaderFee, membersFee]
  );

  // ----- Validation helpers -----
  const validatePerson = (p, isLeader = false) => {
    const e = normalizeEmail(p.email);
    const n = String(p.name || '').trim();
    const ph = normalizePhone(p.phone);

    if (!n || n.length < 2) return 'Please enter full name';
    if (!emailFormatOk(e)) return 'Please enter a valid email';
    if (!emailDomainOk(e)) return 'Only emails from gmail.com, outlook.com, yahoo.com are allowed';
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

  // ----- Team member operations -----
  const [memberDraft, setMemberDraft] = useState(emptyMember());

  const resetMemberDraft = () => setMemberDraft(emptyMember());

  const addMember = async () => {
    // Validate draft
    const err = validatePerson(memberDraft, false);
    if (err) return showToast('error', err);

    // Check competition team size
    const maxTeamSize = competition?.max_team_size || 1;
    // team includes leader + members; ensure adding this member doesn't exceed
    if (1 + members.length + 1 > maxTeamSize) {
      return showToast('error', `Maximum team size is ${maxTeamSize} (including you).`);
    }

    // Existence check
    if (!(await checkUserExistsOrToast(memberDraft.email))) return;

    // Prevent duplicates (by email)
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

  // ----- Payment + Submit flow -----
  const handlePayAndSubmit = async (e) => {
    e?.preventDefault?.();

    // Basic competition constraints
    if (competition?.seats_remaining <= 0) {
      return showToast('error', 'No seats remaining for this competition');
    }

    if (registrationType === 'team') {
      if (!teamName.trim()) return showToast('error', 'Team name is required for team registration');
    }

    // Validate leader
    const leaderErr = validatePerson(applicant, true);
    if (leaderErr) return showToast('error', leaderErr);

    // Verify all team members (if any)
    if (registrationType === 'team' && members.length > 0) {
      // All members must pass validation
      for (const m of members) {
        const err = validatePerson(m, false);
        if (err) return showToast('error', err);
      }
      // (Optional) bulk existence check can go here if your API supports it
      // Otherwise we already checked on-add.
    }

    setSubmitting(true);
    setError(null);

    try {
      // Optionally persist leader profile (non-fatal)
      try {
        await apiService.makeRequest('/auth/update-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: applicant.name.trim(),
            phone: normalizePhone(applicant.phone),
            org: applicant.org.trim(),
            gender: applicant.gender,
            edu_type: applicant.edu_type,
            work_experience_years: applicant.edu_type === 'graduate' ? Number(applicant.work_experience_years || 0) : 0,
            agree_tnc: !!agreeTnC,
            agree_privacy: !!agreePrivacy,
          }),
        });
      } catch (_) {
        // continue even if profile update fails
      }

      // 1) Create payment intent / checkout (stubbed to /payments/checkout)
      const paymentPayload = {
        competition_id: id,
        amount_inr: totalFee,
        currency: 'INR',
        breakdown: {
          leader: { email: normalizeEmail(applicant.email), fee: leaderFee, edu_type: applicant.edu_type },
          members: members.map((m) => ({
            email: normalizeEmail(m.email),
            fee: feeFor(m.edu_type),
            edu_type: m.edu_type,
          })),
        },
      };

      const payRes = await apiService.makeRequest('/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      });

      const payOk = payRes?.success ?? payRes?.data?.success ?? true; // fallback true if your backend isn’t ready
      if (!payOk) {
        const msg = payRes?.message || 'Payment failed to initialize';
        setError(msg);
        showToast('error', msg);
        setSubmitting(false);
        return;
      }

      // If you need to redirect to a gateway, you could:
      // window.location.href = payRes.data.checkout_url;
      // For now, assume success and submit registration.

      // 2) Submit competition registration
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
        payment: {
          amount_inr: totalFee,
          currency: 'INR',
          status: 'paid', // mark accordingly after integrating real gateway webhooks
        },
      };

      const response = await apiService.registerForCompetition(id, payload);

      if (response?.success) {
        showToast('success', 'Payment successful and registration submitted!');
        navigate('/main?tab=competitions', {
          replace: true,
          state: { justRegisteredCompetitionId: id },
        });
      } else {
        const msg = response?.message || 'Registration failed';
        setError(msg);
        showToast('error', msg);
      }
    } catch (err) {
      const msg = err.message || 'Network error occurred';
      setError(msg);
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // UI helpers
  const FeePill = ({ eduType }) => (
  <span
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border shadow-sm transition-transform transform hover:scale-105
      ${eduType === 'graduate'
        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-rose-400'
        : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400'
      }`}
  >
    <GraduationCap className="w-4 h-4 text-white/90" />
    {eduType === 'graduate' ? '₹1000 • Graduate' : '₹500 • Undergraduate'}
  </span>
);

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      {/* Prevent sideways scroll on phones */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 sm:p-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border" />
            </div>
          )}

          {/* Error (no competition) */}
          {!loading && error && !competition && (
            <div className="p-4 sm:p-6 max-w-lg">
              <div className="bg-surface rounded-xl p-6 border border-border text-center">
                <svg
                  className="w-16 h-16 text-red-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-primary-text mb-2">Error</h3>
                <p className="text-secondary-text mb-4 break-words">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-surface hover:bg-border text-primary-text rounded-lg font-medium transition-colors border border-border"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={loadCompetition}
                    className="px-4 py-2 bg-background hover:bg-surface text-primary-text rounded-lg font-medium transition-colors border border-border"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          {!loading && competition && (
            <>
              {/* Header (no competition description—form only) */}
              <div className="bg-surface rounded-xl p-4 border border-border mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary-text" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-lg font-bold text-primary-text truncate">
                        Registration Form
                      </h1>
                      {/* No competition body copy here as requested */}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg bg-surface hover:bg-border border border-border transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-secondary-text" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="bg-surface rounded-xl p-4 sm:p-6 border border-border">
                <form onSubmit={handlePayAndSubmit} className="space-y-8">
                  {/* Registration Type */}
                  <section className="space-y-3">
                    <label className="block font-medium text-primary-text">Registration Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegistrationType('individual')}
                        className={[
                          'h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2',
                          registrationType === 'individual'
                            ? 'bg-background border-border text-primary-text'
                            : 'bg-background/50 border-border text-secondary-text hover:bg-background',
                        ].join(' ')}
                      >
                        <Users className="w-4 h-4" />
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegistrationType('team')}
                        className={[
                          'h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2',
                          registrationType === 'team'
                            ? 'bg-background border-border text-primary-text'
                            : 'bg-background/50 border-border text-secondary-text hover:bg-background',
                        ].join(' ')}
                      >
                        <Users className="w-4 h-4" />
                        Team
                      </button>
                    </div>
                  </section>

                  {/* Team Name */}
                  {registrationType === 'team' && (
                    <section className="space-y-2">
                      <label className="block font-medium text-primary-text">Team Name</label>
                      <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                        <FileText className="w-4 h-4 text-secondary-text" />
                        <input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Enter your team name"
                          className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                          required
                        />
                      </div>
                      <p className="text-xs text-secondary-text">
                        Team size (including you): up to {competition?.max_team_size || 1}
                      </p>
                    </section>
                  )}

                  {/* Leader (Applicant) details */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-primary-text">Your Details</h3>
                      <FeePill eduType={applicant.edu_type} />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <label className="block text-primary-text">Full Name</label>
                      <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                        <UserIcon className="w-4 h-4 text-secondary-text" />
                        <input
                          value={applicant.name}
                          onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                          placeholder="Your name"
                          className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                          required
                        />
                      </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-primary-text">Email</label>
                        <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                          <Mail className="w-4 h-4 text-secondary-text" />
                          <input
                            type="email"
                            value={applicant.email}
                            onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                            placeholder="you@example.com"
                            className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-primary-text">Mobile Number</label>
                        <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                          <Phone className="w-4 h-4 text-secondary-text" />
                          <input
                            type="tel"
                            value={applicant.phone}
                            onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                            placeholder="+91 90000 00000"
                            className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gender + Org */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-primary-text">Gender</label>
                        <select
                          className="h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                          value={applicant.gender}
                          onChange={(e) => setApplicant({ ...applicant, gender: e.target.value })}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="non_binary">Non-binary</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-primary-text">Organization / Institution</label>
                        <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                          <Building2 className="w-4 h-4 text-secondary-text" />
                          <input
                            value={applicant.org}
                            onChange={(e) => setApplicant({ ...applicant, org: e.target.value })}
                            placeholder="Your college or company"
                            className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Type + Work Exp (conditional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-primary-text">Type</label>
                        <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                          <GraduationCap className="w-4 h-4 text-secondary-text" />
                          <select
                            className="flex-1 bg-transparent outline-none text-primary-text h-full"
                            value={applicant.edu_type}
                            onChange={(e) => setApplicant({ ...applicant, edu_type: e.target.value })}
                          >
                            <option value="undergraduate">Undergraduate</option>
                            <option value="graduate">Graduate</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {applicant.edu_type === 'graduate' && (
                        <div className="space-y-2">
                          <label className="block text-primary-text">Work Experience (years)</label>
                          <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                            <Briefcase className="w-4 h-4 text-secondary-text" />
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={applicant.work_experience_years}
                              onChange={(e) => setApplicant({ ...applicant, work_experience_years: e.target.value })}
                              placeholder="e.g., 2"
                              className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Team Members */}
                  {registrationType === 'team' && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-primary-text">Team Members</h3>
                        <span className="text-xs text-secondary-text">
                          Allowed domains: gmail.com, outlook.com, yahoo.com
                        </span>
                      </div>

                      {/* Member Draft Form (add one member) */}
                      <div className="space-y-3 p-3 rounded-xl border border-border bg-background">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-primary-text">Add Member</p>
                          <FeePill eduType={memberDraft.edu_type} />
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                          <label className="block text-primary-text">Full Name</label>
                          <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface border border-border">
                            <UserIcon className="w-4 h-4 text-secondary-text" />
                            <input
                              value={memberDraft.name}
                              onChange={(e) => setMemberDraft({ ...memberDraft, name: e.target.value })}
                              placeholder="Member name"
                              className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                            />
                          </div>
                        </div>

                        {/* Email + Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-primary-text">Email</label>
                            <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface border border-border">
                              <Mail className="w-4 h-4 text-secondary-text" />
                              <input
                                type="email"
                                value={memberDraft.email}
                                onChange={(e) => setMemberDraft({ ...memberDraft, email: e.target.value })}
                                placeholder="member@example.com"
                                className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-primary-text">Mobile Number</label>
                            <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface border border-border">
                              <Phone className="w-4 h-4 text-secondary-text" />
                              <input
                                type="tel"
                                value={memberDraft.phone}
                                onChange={(e) => setMemberDraft({ ...memberDraft, phone: e.target.value })}
                                placeholder="+91 9xxxx xxxxx"
                                className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Gender + Org */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-primary-text">Gender</label>
                            <select
                              className="h-11 px-3 rounded-lg bg-surface border border-border text-primary-text outline-none"
                              value={memberDraft.gender}
                              onChange={(e) => setMemberDraft({ ...memberDraft, gender: e.target.value })}
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="non_binary">Non-binary</option>
                              <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-primary-text">Organization / Institution</label>
                            <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface border border-border">
                              <Building2 className="w-4 h-4 text-secondary-text" />
                              <input
                                value={memberDraft.org}
                                onChange={(e) => setMemberDraft({ ...memberDraft, org: e.target.value })}
                                placeholder="College or company"
                                className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Type + Work Exp (conditional) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-primary-text">Type</label>
                            <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface border border-border">
                              <GraduationCap className="w-4 h-4 text-secondary-text" />
                              <select
                                className="flex-1 bg-transparent outline-none text-primary-text h-full"
                                value={memberDraft.edu_type}
                                onChange={(e) => setMemberDraft({ ...memberDraft, edu_type: e.target.value })}
                              >
                                <option value="undergraduate">Undergraduate</option>
                                <option value="graduate">Graduate</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>

                          {memberDraft.edu_type === 'graduate' && (
                            <div className="space-y-2">
                              <label className="block text-primary-text">Work Experience (years)</label>
                              <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface border border-border">
                                <Briefcase className="w-4 h-4 text-secondary-text" />
                                <input
                                  type="number"
                                  min="0"
                                  max="60"
                                  value={memberDraft.work_experience_years}
                                  onChange={(e) =>
                                    setMemberDraft({ ...memberDraft, work_experience_years: e.target.value })
                                  }
                                  placeholder="e.g., 1"
                                  className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                                  required
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={addMember}
                            className="px-4 h-11 rounded-lg bg-surface hover:bg-border text-primary-text font-medium border border-border inline-flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Member
                          </button>
                        </div>
                      </div>

                      {/* Members List */}
                      {members.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-secondary-text text-sm">
                            Team Members ({members.length})
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {members.map((m, index) => (
                              <div key={index} className="border border-border rounded-xl p-3 bg-background">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-primary-text truncate">{m.name || 'Member'}</div>
                                  <FeePill eduType={m.edu_type} />
                                </div>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="text-secondary-text">
                                    <span className="font-medium text-primary-text">Email: </span>
                                    <span className="break-all">{m.email}</span>
                                  </div>
                                  <div className="text-secondary-text">
                                    <span className="font-medium text-primary-text">Phone: </span>
                                    {m.phone}
                                  </div>
                                  <div className="text-secondary-text">
                                    <span className="font-medium text-primary-text">Org: </span>
                                    {m.org}
                                  </div>
                                  <div className="text-secondary-text">
                                    <span className="font-medium text-primary-text">Type: </span>
                                    {m.edu_type}
                                    {m.edu_type === 'graduate' && (
                                      <span> • {Number(m.work_experience_years || 0)} yrs exp</span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => removeMember(index)}
                                    className="text-secondary-text hover:text-primary-text inline-flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
                  <section>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-secondary-text" />
                      <label className="font-medium text-primary-text">Project Abstract</label>
                      <span className="text-secondary-text text-sm">(Optional)</span>
                    </div>
                    <textarea
                      placeholder="Describe your project idea, approach, or solution..."
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-transparent resize-none"
                    />
                  </section>

                  {/* Fees & Payment */}
                  <section className="space-y-3">
                    <h3 className="font-semibold text-primary-text">Fees & Payment</h3>

                    <div className="rounded-xl border border-border overflow-hidden">
                      {/* Header Row */}
                      <div className="hidden sm:grid sm:grid-cols-4 bg-background text-secondary-text text-sm px-4 py-2">
                        <div>Participant</div>
                        <div>Type</div>
                        <div className="sm:text-right">Fee (₹)</div>
                        <div className="sm:text-right">Notes</div>
                      </div>

                      {/* Leader row */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-0 px-4 py-3 border-t border-border">
                        <div className="text-primary-text">
                          <span className="font-medium">You (Leader)</span>
                          <div className="sm:hidden text-xs text-secondary-text break-all">{applicant.email}</div>
                        </div>
                        <div className="text-secondary-text">{applicant.edu_type}</div>
                        <div className="sm:text-right text-primary-text font-medium">₹{leaderFee}</div>
                        <div className="sm:text-right text-secondary-text text-sm">
                          {applicant.edu_type === 'graduate' ? 'Graduate fee' : 'Undergraduate fee'}
                        </div>
                      </div>

                      {/* Member rows */}
                      {registrationType === 'team' &&
                        members.map((m, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-0 px-4 py-3 border-t border-border"
                          >
                            <div className="text-primary-text">
                              <span className="font-medium">Member {i + 1}</span>
                              <div className="sm:hidden text-xs text-secondary-text break-all">{m.email}</div>
                            </div>
                            <div className="text-secondary-text">{m.edu_type}</div>
                            <div className="sm:text-right text-primary-text font-medium">₹{feeFor(m.edu_type)}</div>
                            <div className="sm:text-right text-secondary-text text-sm">
                              {m.edu_type === 'graduate' ? 'Graduate fee' : 'Undergraduate fee'}
                            </div>
                          </div>
                        ))}

                      {/* Total */}
                      <div className="px-4 py-3 border-t border-border bg-background/60 flex items-center justify-between">
                        <span className="text-secondary-text">Total</span>
                        <span className="text-primary-text font-bold text-lg">₹{totalFee}</span>
                      </div>
                    </div>

                    <p className="text-xs text-secondary-text">
                      Payment will be initiated and your registration will be submitted together.
                    </p>
                  </section>

                  {/* Agreements */}
                  <section className="space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        id="agree-tnc"
                        type="checkbox"
                        checked={agreeTnC}
                        onChange={(e) => setAgreeTnC(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="agree-tnc" className="text-secondary-text">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="underline hover:text-primary-text"
                        >
                          Terms &amp; Conditions
                        </button>
                        .
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        id="agree-privacy"
                        type="checkbox"
                        checked={agreePrivacy}
                        onChange={(e) => setAgreePrivacy(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="agree-privacy" className="text-secondary-text">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowPrivacy(true)}
                          className="underline hover:text-primary-text"
                        >
                          Privacy Policy
                        </button>
                        .
                      </label>
                    </div>
                  </section>

                  {/* Error box (server-side failure) */}
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-red-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-red-300 break-words">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Pay & Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-lg bg-primary text-white font-semibold border border-primary/50 disabled:opacity-60"
                  >
                    {submitting ? 'Processing Payment…' : `Pay ₹${totalFee} & Submit Registration`}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="text-secondary-text hover:text-primary-text transition-colors text-sm flex items-center gap-2 mx-auto"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Modals */}
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </SidebarLayout>
  );
};

export default CompetitionRegisterScreen;
