// // src/pages/CompetitionRegisterScreen.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { apiService } from '../services/apiService';
// import SidebarLayout from '../components/SidebarLayout';
// import CustomButton from '../components/CustomButton';

// const CompetitionRegisterScreen = () => {
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [competition, setCompetition] = useState(null);
//   const [registrationType, setRegistrationType] = useState('individual');
//   const [teamName, setTeamName] = useState('');
//   const [abstract, setAbstract] = useState('');
//   const [memberEmail, setMemberEmail] = useState('');
//   const [memberEmails, setMemberEmails] = useState([]);

//   const navigate = useNavigate();
//   const location = useLocation();
//   const { isAuthenticated } = useAuth();

//   const competitionId = location.state?.competitionId;

//   useEffect(() => {
//     if (!competitionId) {
//       setError('Missing competition ID');
//       setLoading(false);
//       return;
//     }
//     if (!isAuthenticated) {
//       navigate('/login');
//       return;
//     }
//     loadCompetition();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [competitionId, isAuthenticated, navigate]);

//   const loadCompetition = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await apiService.makeRequest(`/competitions/${competitionId}`);
//       if (response.success && response.data?.competition) {
//         setCompetition(response.data.competition);
//       } else {
//         setError('Competition not found');
//       }
//     } catch (err) {
//       setError(err.message || 'Failed to load competition');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const validateEmail = (email) => /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim());

//   const addMemberEmail = () => {
//     const email = memberEmail.trim();
//     if (!email) return alert('Please enter an email address');
//     if (!validateEmail(email)) return alert('Please enter a valid email address');
//     if (memberEmails.includes(email)) return alert('Email already added');

//     const maxTeamSize = competition?.max_team_size || 1;
//     if (memberEmails.length + 1 >= maxTeamSize) {
//       return alert(`Maximum team size is ${maxTeamSize}`);
//     }
//     setMemberEmails((prev) => [...prev, email]);
//     setMemberEmail('');
//   };

//   const removeMemberEmail = (index) => {
//     setMemberEmails((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (registrationType === 'team' && !teamName.trim()) {
//       alert('Team name is required for team registration');
//       return;
//     }
//     if (competition?.seats_remaining <= 0) {
//       alert('No seats remaining for this competition');
//       return;
//     }

//     setSubmitting(true);
//     setError(null);
//     try {
//       const payload = {
//         type: registrationType,
//         ...(registrationType === 'team' && { team_name: teamName.trim() }),
//         ...(memberEmails.length > 0 && { member_emails: memberEmails }),
//         ...(abstract.trim() && { abstract: abstract.trim() }),
//       };
//       const response = await apiService.makeRequest(
//         `/competitions/${competitionId}/register`,
//         { method: 'POST', body: JSON.stringify(payload) }
//       );

//       if (response.success) {
//         alert('Registration submitted successfully!');
//         navigate('/main?tab=competitions', {
//    replace: true,
//    state: { justRegisteredCompetitionId: competitionId }
//  });
//       } else {
//         setError(response.message || 'Registration failed');
//       }
//     } catch (err) {
//       setError(err.message || 'Network error occurred');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <SidebarLayout
//      currentPage="competitions"
//      onPageChange={(page) => navigate(`/main?tab=${encodeURIComponent(page)}`)}
//    >
//       <div className="p-6">
//         {/* Loading */}
//         {loading && (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
//           </div>
//         )}

//         {/* Error (no competition) */}
//         {!loading && error && !competition && (
//           <div className="p-6 max-w-lg">
//             <div className="bg-white/10 rounded-xl p-6 border border-white/20 text-center">
//               <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               <h3 className="text-lg font-medium mb-2">Error</h3>
//               <p className="text-white/70 mb-4">{error}</p>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => navigate(-1)}
//                   className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors"
//                 >
//                   Go Back
//                 </button>
//                 <button
//                   onClick={loadCompetition}
//                   className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-medium transition-colors"
//                 >
//                   Retry
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Main content */}
//         {!loading && competition && (
//           <>
//             {/* Header */}
//             <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
//                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
//                     </svg>
//                   </div>
//                   <div>
//                     <h1 className="text-lg font-bold">Register for Competition</h1>
//                     <p className="text-white/70 text-sm">{competition?.title}</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => navigate(-1)}
//                   className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
//                   aria-label="Close"
//                 >
//                   <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
//             </div>

//             {/* Competition Info */}
//             <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
//               <p className="text-white/70 mb-4">{competition.description}</p>
//               <div className="flex flex-wrap gap-3">
//                 {competition.start_date && competition.end_date && (
//                   <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                     <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                     </svg>
//                     <span className="text-white/70 text-sm">
//                       {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
//                     </span>
//                   </div>
//                 )}
//                 <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                   <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 0 0 118 0z" />
//                   </svg>
//                   <span className="text-white/70 text-sm">
//                     Seats: {competition.seats_remaining}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                   <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                   </svg>
//                   <span className="text-white/70 text-sm">
//                     Team limit: {competition.max_team_size || 1}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Registration Form */}
//             <div className="bg-white/10 rounded-xl p-6 border border-white/20">
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 {/* Registration Type */}
//                 <div>
//                   <div className="flex items-center gap-2 mb-3">
//                     <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                     </svg>
//                     <label className="font-medium">Registration Type</label>
//                   </div>
//                   <div className="flex gap-4">
//                     <button
//                       type="button"
//                       onClick={() => setRegistrationType('individual')}
//                       className={`flex-1 h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2
//                         ${registrationType === 'individual'
//                           ? 'bg-white/15 border-white/20 text-white'
//                           : 'bg-white/10 border-white/10 text-white/70 hover:bg-white/15'}`}
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                       </svg>
//                       Individual
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setRegistrationType('team')}
//                       className={`flex-1 h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2
//                         ${registrationType === 'team'
//                           ? 'bg-white/15 border-white/20 text-white'
//                           : 'bg-white/10 border-white/10 text-white/70 hover:bg-white/15'}`}
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
//                       </svg>
//                       Team
//                     </button>
//                   </div>
//                 </div>

//                 {/* Team Name */}
//                 {registrationType === 'team' && (
//                   <div>
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-white/80 text-sm font-medium">Team Name</span>
//                     </div>
//                     <div className="flex w-full items-center gap-2">
//                       <div className="flex-1 inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10">
//                         <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
//                         </svg>
//                         <input
//                           value={teamName}
//                           onChange={(e) => setTeamName(e.target.value)}
//                           placeholder="Enter your team name"
//                           className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Team Members */}
//                 {registrationType === 'team' && (
//                   <div>
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-white/80 text-sm font-medium">Team Members</span>
//                     </div>

//                     <div className="flex gap-2 mb-3">
//                       <div className="flex-1 inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10">
//                         <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
//                         </svg>
//                         <input
//                           type="email"
//                           value={memberEmail}
//                           onChange={(e) => setMemberEmail(e.target.value)}
//                           placeholder="Add member email address"
//                           className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                         />
//                       </div>

//                       <button
//                         type="button"
//                         onClick={addMemberEmail}
//                         className="px-4 h-11 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors flex items-center gap-2 border border-white/10"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                         </svg>
//                         Add
//                       </button>
//                     </div>

//                     {memberEmails.length > 0 && (
//                       <div className="space-y-2">
//                         <p className="text-white/70 text-sm">Team Members ({memberEmails.length})</p>
//                         <div className="flex flex-wrap gap-2">
//                           {memberEmails.map((email, index) => (
//                             <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/10 rounded-lg">
//                               <span className="text-white/70 text-sm">{email}</span>
//                               <button
//                                 type="button"
//                                 onClick={() => removeMemberEmail(index)}
//                                 className="text-white/60 hover:text-white"
//                                 aria-label="Remove"
//                               >
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                 </svg>
//                               </button>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* Project Abstract */}
//                 <div>
//                   <div className="flex items-center gap-2 mb-3">
//                     <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.94-6.071-2.466C3.73 10.7 3.73 7.3 5.929 5.466A7.962 7.962 0 0112 3c2.34 0 4.5.94 6.071 2.466C20.27 7.3 20.27 10.7 18.071 12.534A7.962 7.962 0 0112 15z" />
//                     </svg>
//                     <label className="font-medium">Project Abstract</label>
//                     <span className="text-white/60 text-sm">(Optional)</span>
//                   </div>
//                   <textarea
//                     placeholder="Describe your project idea, approach, or solution..."
//                     value={abstract}
//                     onChange={(e) => setAbstract(e.target.value)}
//                     rows={4}
//                     className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none"
//                   />
//                 </div>

//                 {/* Error Display */}
//                 {error && (
//                   <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
//                     <div className="flex items-center gap-3">
//                       <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                       </svg>
//                       <p className="text-red-400">{error}</p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Submit Button */}
//                 <CustomButton
//                   type="submit"
//                   text={submitting ? 'Submitting Registration...' : 'Submit Registration'}
//                   enabled={!submitting}
//                   loading={submitting}
//                 />
//               </form>
//             </div>
//           </>
//         )}
//       </div>
//     </SidebarLayout>
//   );
// };

// export default CompetitionRegisterScreen;


// src/pages/CompetitionRegisterScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import SidebarLayout from '../components/SidebarLayout';

// Lucide icons (match CreateCompetition vibe)
import {
  Users,
  X,
  CalendarDays,
  Hash,
  ChevronLeft,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';

const CompetitionRegisterScreen = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [competition, setCompetition] = useState(null);

  const [registrationType, setRegistrationType] = useState('individual');
  const [teamName, setTeamName] = useState('');
  const [abstract, setAbstract] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberEmails, setMemberEmails] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const competitionId = location.state?.competitionId;

  useEffect(() => {
    if (!competitionId) {
      setError('Missing competition ID');
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCompetition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId, isAuthenticated, navigate]);

  const loadCompetition = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.makeRequest(`/competitions/${competitionId}`);
      if (response.success && response.data?.competition) {
        setCompetition(response.data.competition);
      } else {
        setError('Competition not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load competition');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) =>
    /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim());

  const addMemberEmail = () => {
    const email = memberEmail.trim();
    if (!email) return alert('Please enter an email address');
    if (!validateEmail(email)) return alert('Please enter a valid email address');
    if (memberEmails.includes(email)) return alert('Email already added');

    const maxTeamSize = competition?.max_team_size || 1;
    // +1 accounts for the leader (registrant) — add emails only for additional members
    if (memberEmails.length + 1 >= maxTeamSize) {
      return alert(`Maximum team size is ${maxTeamSize}`);
    }
    setMemberEmails((prev) => [...prev, email]);
    setMemberEmail('');
  };

  const removeMemberEmail = (index) => {
    setMemberEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (registrationType === 'team' && !teamName.trim()) {
      alert('Team name is required for team registration');
      return;
    }
    if (competition?.seats_remaining <= 0) {
      alert('No seats remaining for this competition');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        type: registrationType,
        ...(registrationType === 'team' && { team_name: teamName.trim() }),
        ...(memberEmails.length > 0 && { member_emails: memberEmails }),
        ...(abstract.trim() && { abstract: abstract.trim() }),
      };

      const response = await apiService.makeRequest(
        `/competitions/${competitionId}/register`,
        { method: 'POST', body: JSON.stringify(payload) }
      );

      if (response.success) {
        // success UI stays minimal — keep UX consistent with create screen (navigate back)
        navigate('/main?tab=competitions', {
          replace: true,
          state: { justRegisteredCompetitionId: competitionId },
        });
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border" />
            </div>
          )}

          {/* Error (no competition) */}
          {!loading && error && !competition && (
            <div className="p-6 max-w-lg">
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
                <p className="text-secondary-text mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 px-4 py-2 bg-surface hover:bg-border text-primary-text rounded-lg font-medium transition-colors border border-border"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={loadCompetition}
                    className="flex-1 px-4 py-2 bg-background hover:bg-surface text-primary-text rounded-lg font-medium transition-colors border border-border"
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
              {/* Header (same pattern as CreateCompetitionScreen) */}
              <div className="bg-surface rounded-xl p-4 border border-border mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-text" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-primary-text">Register for Competition</h1>
                      <p className="text-secondary-text text-sm">{competition?.title}</p>
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

              {/* Competition Info (tokenized quick stats) */}
              <div className="bg-surface rounded-xl p-4 border border-border mb-6">
                <p className="text-secondary-text mb-4">
                  {competition.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {competition.start_date && competition.end_date && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                      <CalendarDays className="w-4 h-4 text-secondary-text" />
                      <span className="text-secondary-text text-sm">
                        {new Date(competition.start_date).toLocaleDateString()} — {new Date(competition.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <Hash className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      Seats: {competition.seats_remaining}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <Users className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      Team limit: {competition.max_team_size || 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Form (sections + native submit) */}
              <div className="bg-surface rounded-xl p-6 border border-border">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Registration Type */}
                  <section className="space-y-3">
                    <label className="block font-medium text-primary-text">Registration Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegistrationType('individual')}
                        className={[
                          "h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2",
                          registrationType === 'individual'
                            ? "bg-background border-border text-primary-text"
                            : "bg-background/50 border-border text-secondary-text hover:bg-background",
                        ].join(" ")}
                      >
                        <Users className="w-4 h-4" />
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegistrationType('team')}
                        className={[
                          "h-11 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2",
                          registrationType === 'team'
                            ? "bg-background border-border text-primary-text"
                            : "bg-background/50 border-border text-secondary-text hover:bg-background",
                        ].join(" ")}
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
                        />
                      </div>
                    </section>
                  )}

                  {/* Team Members */}
                  {registrationType === 'team' && (
                    <section className="space-y-3">
                      <label className="block font-medium text-primary-text">
                        Team Members (by email)
                      </label>

                      <div className="flex gap-2">
                        <div className="flex-1 inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                          <Users className="w-4 h-4 text-secondary-text" />
                          <input
                            type="email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            placeholder="Add member email address"
                            className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={addMemberEmail}
                          className="px-3 h-11 rounded-lg bg-surface hover:bg-border text-primary-text font-medium border border-border inline-flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>

                      {memberEmails.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-secondary-text text-sm">
                            Team Members ({memberEmails.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {memberEmails.map((email, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg"
                              >
                                <span className="text-secondary-text text-sm">{email}</span>
                                <button
                                  type="button"
                                  onClick={() => removeMemberEmail(index)}
                                  className="text-secondary-text hover:text-primary-text"
                                  aria-label="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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

                  {/* Error */}
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-red-400"
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
                        <p className="text-red-300">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit / Cancel — native button like CreateCompetition */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-lg bg-primary text-white font-semibold border border-primary/50 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting Registration…' : 'Submit Registration'}
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
    </SidebarLayout>
  );
};

export default CompetitionRegisterScreen;
