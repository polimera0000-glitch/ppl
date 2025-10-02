// // src/screens/CompetitionDetails.jsx
// import React, { useEffect, useMemo, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { apiService } from '../services/apiService';
// import SidebarLayout from '../components/SidebarLayout';

// const CompetitionDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [comp, setComp] = useState(null);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('overview');

//   // Leaderboard state
//   const [lbLoading, setLbLoading] = useState(false);
//   const [lbData, setLbData] = useState([]);
//   const [lbQuery, setLbQuery] = useState('');

//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await apiService.getCompetition(id);
//         const data = res?.data?.competition || res?.competition || res;
//         setComp(data || null);
//       } catch (e) {
//         setError(e?.message || 'Failed to load competition');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [id]);

//   // Fetch leaderboard when tab first opens
//   useEffect(() => {
//     if (activeTab !== 'leaderboard' || lbData.length) return;
//     (async () => {
//       setLbLoading(true);
//       try {
//         const res = await apiService.getCompetitionLeaderboard(id);
//         setLbData(res?.data?.leaderboard || res?.leaderboard || []);
//       } catch (e) {
//         console.error('Leaderboard error:', e);
//       } finally {
//         setLbLoading(false);
//       }
//     })();
//   }, [activeTab, id, lbData.length]);

//   const filteredLb = useMemo(() => {
//     if (!lbQuery) return lbData;
//     const q = lbQuery.toLowerCase();
//     return lbData.filter((r, i) => {
//       const rankMatch = String(r.rank ?? i + 1).includes(lbQuery);
//       const name = r.team_name || r.leader?.name || '';
//       const nameMatch = name.toLowerCase().includes(q);
//       return rankMatch || nameMatch;
//     });
//   }, [lbData, lbQuery]);

//   const fmtShort = (d) => {
//     try {
//       return d ? new Date(d).toLocaleDateString() : '—';
//     } catch {
//       return '—';
//     }
//   };

//   const fmtLong = (d) => {
//     try {
//       return d
//         ? new Date(d).toLocaleDateString(undefined, {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric'
//           })
//         : '—';
//     } catch {
//       return '—';
//     }
//   };

//   const TIMELINE_LABELS = {
//     registration_start_date: {
//       short: 'Registration Opens.',
//       long: 'Registration opens.'
//     },
//     registration_deadline: {
//       short: 'Registration Closes.',
//       long: 'Registration closes.'
//     },
//     start_date: {
//       short: 'Start Date.',
//       long: 'Start Date.'
//     },
//     entry_deadline: {
//       short: 'Entry Deadline.',
//       long: 'Entry Deadline. You must accept the competition rules before this date in order to compete.'
//     },
//     team_merger_deadline: {
//       short: 'Team Merger Deadline.',
//       long: 'Team Merger Deadline. This is the last day participants may join or merge teams.'
//     },
//     final_submission_deadline: {
//       short: 'Final Submission Deadline.',
//       long: 'Final Submission Deadline.'
//     },
//     end_date: {
//       short: 'Competition Ends.',
//       long: 'Competition Ends.'
//     },
//     results_date: {
//       short: 'Results Announced.',
//       long: 'Results announced.'
//     }
//   };

//   const tags = useMemo(() => (Array.isArray(comp?.tags) ? comp.tags : []), [comp]);

//   const timelineItems = useMemo(() => {
//     if (!comp) return [];
//     const candidates = [
//       ['registration_start_date', comp.registration_start_date],
//       ['registration_deadline', comp.registration_deadline],
//       ['start_date', comp.start_date],
//       ['entry_deadline', comp.entry_deadline],
//       ['team_merger_deadline', comp.team_merger_deadline],
//       ['final_submission_deadline', comp.final_submission_deadline],
//       ['end_date', comp.end_date],
//       ['results_date', comp.results_date]
//     ].filter(([, v]) => !!v);

//     const toTS = (d) => (d ? new Date(d).getTime() : Number.MAX_SAFE_INTEGER);

//     return candidates
//       .map(([key, date]) => ({
//         key,
//         date,
//         ts: toTS(date),
//         text: TIMELINE_LABELS[key]?.long || TIMELINE_LABELS[key]?.short || key
//       }))
//       .sort((a, b) => a.ts - b.ts);
//   }, [comp]);

//   // ----- Loading -----
//   if (loading) {
//     return (
//       <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
//         <div className="p-6">
//           <button
//             onClick={() => navigate(-1)}
//             className="mb-4 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white transition-colors"
//           >
//             ← Back
//           </button>
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
//           </div>
//         </div>
//       </SidebarLayout>
//     );
//   }

//   // ----- Error / not found -----
//   if (error || !comp) {
//     return (
//       <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
//         <div className="p-6">
//           <button
//             onClick={() => navigate(-1)}
//             className="mb-4 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white transition-colors"
//           >
//             ← Back
//           </button>
//           <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
//             <p className="text-red-300 font-medium">Error</p>
//             <p className="text-red-300/90 text-sm">{error || 'Competition not found'}</p>
//           </div>
//         </div>
//       </SidebarLayout>
//     );
//   }

//   return (
//     <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
//       <div className="p-6">
//         {/* Header */}
//         <div className="flex items-start justify-between mb-4">
//           <div className="flex items-start gap-3 flex-1">
//             {comp.banner_image_url && (
//               <img
//                 src={comp.banner_image_url}
//                 alt={comp.title}
//                 className="w-16 h-16 rounded-lg object-cover border border-white/10"
//               />
//             )}
//             <div>
//               <h1 className="text-2xl font-bold text-white mb-1">{comp.title}</h1>
//               {comp.sponsor && <p className="text-white/60 text-sm">Sponsor: {comp.sponsor}</p>}
//               {tags.length > 0 && (
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {tags.map((t, i) => (
//                     <span
//                       key={i}
//                       className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md"
//                     >
//                       #{t}
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//           <button
//             onClick={() => navigate(-1)}
//             className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white transition-colors"
//           >
//             ← Back
//           </button>
//         </div>

//         {/* Banner */}
//         {comp.banner_image_url && (
//           <div className="rounded-xl overflow-hidden border border-white/10 mb-4">
//             <img
//               src={comp.banner_image_url}
//               alt={comp.title}
//               className="w-full max-h-[280px] object-cover"
//             />
//           </div>
//         )}

//         {/* Tabs */}
//         <div className="flex gap-2 mb-0">
//           {['overview', 'leaderboard', 'timeline', 'rules'].map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
//                 activeTab === tab
//                   ? 'bg-white/20 text-white'
//                   : 'text-white/70 hover:text-white hover:bg-white/10'
//               }`}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </div>

//         {/* Panel */}
//         <div className="p-5 border border-white/10 rounded-b-xl rounded-tr-xl bg-white/5 backdrop-blur-sm space-y-6">
//           {/* -------- Overview -------- */}
//           {activeTab === 'overview' && (
//             <>
//               {(comp.description_long || comp.overview || comp.description) && (
//                 <div>
//                   <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
//                     Overview
//                   </h4>
//                   <p className="text-white/80 whitespace-pre-wrap">
//                     {comp.description_long || comp.overview || comp.description}
//                   </p>
//                 </div>
//               )}

//               {/* Quick stats */}
//               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
//                 <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                   <span className="text-white/80 text-sm">
//                     <strong>Start:</strong> {fmtShort(comp.start_date)}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                   <span className="text-white/80 text-sm">
//                     <strong>End:</strong> {fmtShort(comp.end_date)}
//                   </span>
//                 </div>
//                 {!!comp.max_team_size && (
//                   <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                     <span className="text-white/80 text-sm">
//                       <strong>Max Team:</strong> {comp.max_team_size}
//                     </span>
//                   </div>
//                 )}
//                 {'seats_remaining' in comp && (
//                   <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                     <span className="text-white/80 text-sm">
//                       <strong>Seats Left:</strong> {comp.seats_remaining}
//                     </span>
//                   </div>
//                 )}
//                 {!!comp.prize_pool && (
//                   <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
//                     <span className="text-white/80 text-sm">
//                       <strong>Prize Pool:</strong> ${comp.prize_pool}
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* Resources */}
//               {Array.isArray(comp.resources_json) && comp.resources_json.length > 0 && (
//                 <div>
//                   <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
//                     Resources
//                   </h4>
//                   <ul className="list-disc list-inside text-white/80 space-y-1">
//                     {comp.resources_json.map((r, i) => (
//                       <li key={i}>
//                         {r.url ? (
//                           <a
//                             href={r.url}
//                             target="_blank"
//                             rel="noreferrer"
//                             className="text-blue-300 hover:underline"
//                           >
//                             {r.label || r.url}
//                           </a>
//                         ) : (
//                           <span>{r.label}</span>
//                         )}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               {/* Prizes */}
//               {Array.isArray(comp.prizes_json) && comp.prizes_json.length > 0 && (
//                 <div>
//                   <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
//                     Prizes
//                   </h4>
//                   <div className="overflow-hidden rounded-xl border border-white/10">
//                     <table className="min-w-full text-sm">
//                       <thead className="bg-white/10 text-white/80">
//                         <tr>
//                           <th className="text-left px-4 py-2">Place</th>
//                           <th className="text-left px-4 py-2">Amount</th>
//                         </tr>
//                       </thead>
//                       <tbody className="text-white/90">
//                         {comp.prizes_json.map((p, i) => (
//                           <tr key={i} className={i % 2 ? 'bg-white/5' : 'bg-transparent'}>
//                             <td className="px-4 py-2">{p.place || '—'}</td>
//                             <td className="px-4 py-2">{p.amount != null ? `$${p.amount}` : '—'}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}

//               {/* Contact & Eligibility */}
//               {(comp.contact_info || comp.eligibility_criteria) && (
//                 <div className="grid md:grid-cols-2 gap-4">
//                   {comp.contact_info && (
//                     <div>
//                       <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
//                         Contact
//                       </h4>
//                       <div className="text-white/80 space-y-1">
//                         {comp.contact_info.email && <p>Email: {comp.contact_info.email}</p>}
//                         {comp.contact_info.phone && <p>Phone: {comp.contact_info.phone}</p>}
//                         {comp.contact_info.website && (
//                           <p>
//                             Website:{' '}
//                             <a
//                               href={comp.contact_info.website}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-blue-300 hover:underline"
//                             >
//                               {comp.contact_info.website}
//                             </a>
//                           </p>
//                         )}
//                         {comp.contact_info.discord && <p>Discord: {comp.contact_info.discord}</p>}
//                       </div>
//                     </div>
//                   )}
//                   {comp.eligibility_criteria && (
//                     <div>
//                       <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
//                         Eligibility
//                       </h4>
//                       <div className="text-white/80 space-y-1">
//                         {'minAge' in comp.eligibility_criteria && (
//                           <p>Min Age: {comp.eligibility_criteria.minAge}</p>
//                         )}
//                         {'maxAge' in comp.eligibility_criteria && (
//                           <p>Max Age: {comp.eligibility_criteria.maxAge}</p>
//                         )}
//                         {comp.eligibility_criteria.education && (
//                           <p>Education: {comp.eligibility_criteria.education}</p>
//                         )}
//                         {Array.isArray(comp.eligibility_criteria.countriesAllowed) &&
//                           comp.eligibility_criteria.countriesAllowed.length > 0 && (
//                             <p>
//                               Countries Allowed:{' '}
//                               {comp.eligibility_criteria.countriesAllowed.join(', ')}
//                             </p>
//                           )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </>
//           )}

//           {/* -------- Leaderboard -------- */}
//           {activeTab === 'leaderboard' && (
//             <>
//               <div className="flex items-center justify-between gap-3 flex-wrap">
//                 <h4 className="text-white font-semibold text-sm uppercase tracking-wider">
//                   Leaderboard
//                 </h4>
//                 <input
//                   value={lbQuery}
//                   onChange={(e) => setLbQuery(e.target.value)}
//                   placeholder="Search..."
//                   className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20"
//                 />
//               </div>

//               {lbLoading ? (
//                 <div className="flex justify-center py-10">
//                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
//                 </div>
//               ) : filteredLb.length === 0 ? (
//                 <p className="text-center text-white/60 py-10">No leaderboard data available</p>
//               ) : (
//                 <div className="overflow-auto border border-white/10 rounded-xl">
//                   <table className="min-w-full text-sm">
//                     <thead className="bg-white/10 text-white/80">
//                       <tr>
//                         <th className="text-left px-4 py-2">Rank</th>
//                         <th className="text-left px-4 py-2">Team/User</th>
//                         <th className="text-left px-4 py-2">Score</th>
//                         <th className="text-left px-4 py-2">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody className="text-white/90">
//                       {filteredLb.map((row, i) => (
//                         <tr key={i} className={i % 2 ? 'bg-white/5' : 'bg-transparent'}>
//                           <td className="px-4 py-2">{row.rank ?? i + 1}</td>
//                           <td className="px-4 py-2">{row.team_name || row.leader?.name || '—'}</td>
//                           <td className="px-4 py-2">
//                             {typeof row.final_score === 'number'
//                               ? row.final_score.toFixed(3)
//                               : row.score?.toFixed?.(3) || '—'}
//                           </td>
//                           <td className="px-4 py-2">
//                             <span
//                               className={`px-2 py-1 rounded text-xs ${
//                                 row.status === 'winner'
//                                   ? 'bg-green-500/20 text-green-300'
//                                   : row.status === 'shortlisted'
//                                   ? 'bg-blue-500/20 text-blue-300'
//                                   : 'bg-gray-500/20 text-gray-300'
//                               }`}
//                             >
//                               {row.status || 'submitted'}
//                             </span>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </>
//           )}

//           {/* -------- Timeline (rail with sentence) -------- */}
// {activeTab === 'timeline' && (
//   <>
//     <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
//       Timeline
//     </h4>

//     {timelineItems.length === 0 ? (
//       <p className="text-white/60">No timeline data available.</p>
//     ) : (
//       <div className="relative pl-8">
//         {/* vertical rail */}
//         <div className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />
//         <ul className="space-y-6">
//           {timelineItems.map((it, idx) => (
//             <li key={`${it.key}-${idx}`} className="relative flex items-start">
//               {/* dot fixed on the rail */}
//               <span className="absolute top-2.5 -translate-x-1/2 w-2 h-2 rounded-full bg-white border border-white/40 shadow" />
//               {/* sentence text */}
//               <div className="ml-6 text-white/85">
//                 <span className="font-medium">{fmtLong(it.date)}</span> —{' '}
//                 <span className="opacity-90">{it.text}</span>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     )}
//   </>
// )}


//           {/* -------- Rules -------- */}
//           {activeTab === 'rules' && (
//             <>
//               <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
//                 Rules
//               </h4>
//               {comp.rules_markdown || comp.rules ? (
//                 <div className="prose prose-invert max-w-none text-white/80 whitespace-pre-wrap">
//                   {comp.rules_markdown || comp.rules}
//                 </div>
//               ) : (
//                 <p className="text-white/60">No rules have been provided for this competition.</p>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </SidebarLayout>
//   );
// };

// export default CompetitionDetails;

// src/screens/CompetitionDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import SidebarLayout from "../components/SidebarLayout";

// Lucide icons to match the other pages
import {
  Rocket,
  X,
  CalendarDays,
  Gift,
  Users,
  MapPin,
  Image as ImageIcon,
  Tag as TagIcon,
} from "lucide-react";

const CompetitionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [comp, setComp] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Leaderboard state
  const [lbLoading, setLbLoading] = useState(false);
  const [lbData, setLbData] = useState([]);
  const [lbQuery, setLbQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getCompetition(id);
        const data = res?.data?.competition || res?.competition || res;
        setComp(data || null);
      } catch (e) {
        setError(e?.message || "Failed to load competition");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Fetch leaderboard when tab first opens
  useEffect(() => {
    if (activeTab !== "leaderboard" || lbData.length) return;
    (async () => {
      setLbLoading(true);
      try {
        const res = await apiService.getCompetitionLeaderboard(id);
        setLbData(res?.data?.leaderboard || res?.leaderboard || []);
      } catch (e) {
        console.error("Leaderboard error:", e);
      } finally {
        setLbLoading(false);
      }
    })();
  }, [activeTab, id, lbData.length]);

  const filteredLb = useMemo(() => {
    if (!lbQuery) return lbData;
    const q = lbQuery.toLowerCase();
    return lbData.filter((r, i) => {
      const rankMatch = String(r.rank ?? i + 1).includes(lbQuery);
      const name = r.team_name || r.leader?.name || "";
      const nameMatch = name.toLowerCase().includes(q);
      return rankMatch || nameMatch;
    });
  }, [lbData, lbQuery]);

  const fmtShort = (d) => {
    try {
      return d ? new Date(d).toLocaleDateString() : "—";
    } catch {
      return "—";
    }
  };

  const fmtLong = (d) => {
    try {
      return d
        ? new Date(d).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—";
    } catch {
      return "—";
    }
  };

  const TIMELINE_LABELS = {
    registration_start_date: {
      short: "Registration Opens.",
      long: "Registration opens.",
    },
    registration_deadline: {
      short: "Registration Closes.",
      long: "Registration closes.",
    },
    start_date: {
      short: "Start Date.",
      long: "Start Date.",
    },
    entry_deadline: {
      short: "Entry Deadline.",
      long: "Entry Deadline. You must accept the competition rules before this date in order to compete.",
    },
    team_merger_deadline: {
      short: "Team Merger Deadline.",
      long: "Team Merger Deadline. This is the last day participants may join or merge teams.",
    },
    final_submission_deadline: {
      short: "Final Submission Deadline.",
      long: "Final Submission Deadline.",
    },
    end_date: {
      short: "Competition Ends.",
      long: "Competition Ends.",
    },
    results_date: {
      short: "Results Announced.",
      long: "Results announced.",
    },
  };

  const tags = useMemo(() => (Array.isArray(comp?.tags) ? comp.tags : []), [comp]);

  const timelineItems = useMemo(() => {
    if (!comp) return [];
    const candidates = [
      ["registration_start_date", comp.registration_start_date],
      ["registration_deadline", comp.registration_deadline],
      ["start_date", comp.start_date],
      ["entry_deadline", comp.entry_deadline],
      ["team_merger_deadline", comp.team_merger_deadline],
      ["final_submission_deadline", comp.final_submission_deadline],
      ["end_date", comp.end_date],
      ["results_date", comp.results_date],
    ].filter(([, v]) => !!v);

    const toTS = (d) => (d ? new Date(d).getTime() : Number.MAX_SAFE_INTEGER);

    return candidates
      .map(([key, date]) => ({
        key,
        date,
        ts: toTS(date),
        text: TIMELINE_LABELS[key]?.long || TIMELINE_LABELS[key]?.short || key,
      }))
      .sort((a, b) => a.ts - b.ts);
  }, [comp]);

  // ----- Loading -----
  if (loading) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="bg-surface rounded-xl p-4 border border-border mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary-text" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-primary-text">Competition</h1>
                    <p className="text-secondary-text text-sm">Loading details…</p>
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

            <div className="bg-surface rounded-xl p-6 border border-border text-secondary-text">
              Loading…
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ----- Error / not found -----
  if (error || !comp) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="bg-surface rounded-xl p-4 border border-border mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary-text" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-primary-text">Competition</h1>
                    <p className="text-secondary-text text-sm">Couldn’t load</p>
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

            <div className="p-4 bg-background border border-border rounded-xl">
              <p className="text-primary-text font-medium">Error</p>
              <p className="text-secondary-text text-sm">
                {error || "Competition not found"}
              </p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header — styled like Create/Edit/MySubmissions */}
          <div className="bg-surface rounded-xl p-4 border border-border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-primary-text" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-primary-text">
                    {comp.title}
                  </h1>
                  <p className="text-secondary-text text-sm">
                    {comp.sponsor ? `Sponsor: ${comp.sponsor}` : "Competition details"}
                  </p>
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

          {/* Top summary card */}
          <div className="bg-surface rounded-xl p-4 border border-border mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden">
                {comp.banner_image_url ? (
                  <img
                    src={comp.banner_image_url}
                    alt={comp.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-secondary-text" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  {comp.location && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border text-secondary-text text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      {comp.location}
                    </div>
                  )}
                  {typeof comp.max_team_size === "number" && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border text-secondary-text text-xs">
                      <Users className="w-3.5 h-3.5" />
                      Max team: {comp.max_team_size}
                    </div>
                  )}
                  {typeof comp.prize_pool === "number" && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border text-secondary-text text-xs">
                      <Gift className="w-3.5 h-3.5" />
                      Prize pool: ${comp.prize_pool}
                    </div>
                  )}
                  {Array.isArray(tags) && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t, i) => (
                        <span
                          key={`${t}-${i}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border border-border text-secondary-text text-xs"
                        >
                          <TagIcon className="w-3 h-3" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <CalendarDays className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      <strong className="text-primary-text">Start:</strong>{" "}
                      {fmtShort(comp.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <CalendarDays className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      <strong className="text-primary-text">End:</strong>{" "}
                      {fmtShort(comp.end_date)}
                    </span>
                  </div>
                  {"seats_remaining" in comp && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                      <Users className="w-4 h-4 text-secondary-text" />
                      <span className="text-secondary-text text-sm">
                        <strong className="text-primary-text">Seats Left:</strong>{" "}
                        {comp.seats_remaining}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs (like MySubmissions style) */}
          <div className="flex gap-2 mb-0">
            {["overview", "leaderboard", "timeline", "rules"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium border border-border border-b-0 transition-colors ${
                  activeTab === tab
                    ? "bg-surface text-primary-text"
                    : "bg-background text-secondary-text hover:text-primary-text"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="p-5 border border-border rounded-b-xl rounded-tr-xl bg-surface space-y-6">
            {/* -------- Overview -------- */}
            {activeTab === "overview" && (
              <>
                {(comp.description_long || comp.overview || comp.description) && (
                  <div>
                    <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider mb-2">
                      Overview
                    </h4>
                    <p className="text-secondary-text whitespace-pre-wrap">
                      {comp.description_long || comp.overview || comp.description}
                    </p>
                  </div>
                )}

                {/* Resources */}
                {Array.isArray(comp.resources_json) &&
                  comp.resources_json.length > 0 && (
                    <div>
                      <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider mb-2">
                        Resources
                      </h4>
                      <ul className="list-disc list-inside text-secondary-text space-y-1">
                        {comp.resources_json.map((r, i) => (
                          <li key={i}>
                            {r.url ? (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-text hover:underline"
                              >
                                {r.label || r.url}
                              </a>
                            ) : (
                              <span>{r.label}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Prizes */}
                {Array.isArray(comp.prizes_json) &&
                  comp.prizes_json.length > 0 && (
                    <div>
                      <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider mb-2">
                        Prizes
                      </h4>
                      <div className="overflow-hidden rounded-xl border border-border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-background text-secondary-text">
                            <tr>
                              <th className="text-left px-4 py-2">Place</th>
                              <th className="text-left px-4 py-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="text-primary-text">
                            {comp.prizes_json.map((p, i) => (
                              <tr
                                key={i}
                                className={i % 2 ? "bg-background" : "bg-surface"}
                              >
                                <td className="px-4 py-2">{p.place || "—"}</td>
                                <td className="px-4 py-2">
                                  {p.amount != null ? `$${p.amount}` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Contact & Eligibility */}
                {(comp.contact_info || comp.eligibility_criteria) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {comp.contact_info && (
                      <div>
                        <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider mb-2">
                          Contact
                        </h4>
                        <div className="text-secondary-text space-y-1">
                          {comp.contact_info.email && <p>Email: {comp.contact_info.email}</p>}
                          {comp.contact_info.phone && <p>Phone: {comp.contact_info.phone}</p>}
                          {comp.contact_info.website && (
                            <p>
                              Website:{" "}
                              <a
                                href={comp.contact_info.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-text hover:underline"
                              >
                                {comp.contact_info.website}
                              </a>
                            </p>
                          )}
                          {comp.contact_info.discord && (
                            <p>Discord: {comp.contact_info.discord}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {comp.eligibility_criteria && (
                      <div>
                        <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider mb-2">
                          Eligibility
                        </h4>
                        <div className="text-secondary-text space-y-1">
                          {"minAge" in comp.eligibility_criteria && (
                            <p>Min Age: {comp.eligibility_criteria.minAge}</p>
                          )}
                          {"maxAge" in comp.eligibility_criteria && (
                            <p>Max Age: {comp.eligibility_criteria.maxAge}</p>
                          )}
                          {comp.eligibility_criteria.education && (
                            <p>Education: {comp.eligibility_criteria.education}</p>
                          )}
                          {Array.isArray(
                            comp.eligibility_criteria.countriesAllowed
                          ) &&
                            comp.eligibility_criteria.countriesAllowed.length >
                              0 && (
                              <p>
                                Countries Allowed:{" "}
                                {comp.eligibility_criteria.countriesAllowed.join(", ")}
                              </p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* -------- Leaderboard -------- */}
            {activeTab === "leaderboard" && (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider">
                    Leaderboard
                  </h4>
                  <input
                    value={lbQuery}
                    onChange={(e) => setLbQuery(e.target.value)}
                    placeholder="Search..."
                    className="px-3 py-2 bg-background border border-border rounded-lg text-primary-text placeholder-secondary-text outline-none"
                  />
                </div>

                {lbLoading ? (
                  <div className="flex justify-center py-10 text-secondary-text">
                    Loading…
                  </div>
                ) : filteredLb.length === 0 ? (
                  <p className="text-center text-secondary-text py-10">
                    No leaderboard data available
                  </p>
                ) : (
                  <div className="overflow-auto border border-border rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-background text-secondary-text">
                        <tr>
                          <th className="text-left px-4 py-2">Rank</th>
                          <th className="text-left px-4 py-2">Team/User</th>
                          <th className="text-left px-4 py-2">Score</th>
                          <th className="text-left px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-primary-text">
                        {filteredLb.map((row, i) => (
                          <tr
                            key={i}
                            className={i % 2 ? "bg-background" : "bg-surface"}
                          >
                            <td className="px-4 py-2">{row.rank ?? i + 1}</td>
                            <td className="px-4 py-2">
                              {row.team_name || row.leader?.name || "—"}
                            </td>
                            <td className="px-4 py-2">
                              {typeof row.final_score === "number"
                                ? row.final_score.toFixed(3)
                                : row.score?.toFixed?.(3) || "—"}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded text-xs border border-border text-secondary-text`}
                              >
                                {row.status || "submitted"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* -------- Timeline (rail with sentence) -------- */}
            {activeTab === "timeline" && (
              <>
                <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider mb-2">
                  Timeline
                </h4>

                {timelineItems.length === 0 ? (
                  <p className="text-secondary-text">No timeline data available.</p>
                ) : (
                  <div className="relative pl-8">
                    {/* vertical rail */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                    <ul className="space-y-6">
                      {timelineItems.map((it, idx) => (
                        <li key={`${it.key}-${idx}`} className="relative flex items-start">
                          {/* dot fixed on the rail */}
                          <span className="absolute top-2.5 -translate-x-1/2 w-2 h-2 rounded-full bg-primary-text/80 border border-border shadow" />
                          {/* sentence text */}
                          <div className="ml-6 text-primary-text/85">
                            <span className="font-medium">{fmtLong(it.date)}</span> —{" "}
                            <span className="text-secondary-text">{it.text}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* -------- Rules -------- */}
            {activeTab === "rules" && (
              <>
                <h4 className="text-primary-text font-semibold text-sm uppercase tracking-wider mb-2">
                  Rules
                </h4>
                {comp.rules_markdown || comp.rules ? (
                  <div className="text-secondary-text whitespace-pre-wrap">
                    {comp.rules_markdown || comp.rules}
                  </div>
                ) : (
                  <p className="text-secondary-text">
                    No rules have been provided for this competition.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CompetitionDetails;
