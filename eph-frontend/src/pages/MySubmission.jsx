// // src/pages/MySubmission.jsx
// import React, { useEffect, useState, useMemo } from 'react';
// import SidebarLayout from '../components/SidebarLayout';
// import { useNavigate, useParams } from 'react-router-dom';
// import { apiService } from '../services/apiService';
// import { useAuth } from '../hooks/useAuth';

// const chip = (status) => {
//   const map = {
//     submitted: 'bg-white/10 text-white',
//     under_review: 'bg-amber-500/20 text-amber-200',
//     needs_changes: 'bg-orange-500/20 text-orange-200',
//     disqualified: 'bg-red-500/20 text-red-300',
//     shortlisted: 'bg-blue-500/20 text-blue-200',
//     winner: 'bg-green-500/20 text-green-200',
//     not_winner: 'bg-gray-500/20 text-gray-300',
//     published: 'bg-white/20 text-white'
//   };
//   return map[status] || 'bg-white/10 text-white';
// };

// const STATUS_OPTIONS = [
//   'submitted',
//   'under_review',
//   'needs_changes',
//   'shortlisted',
//   'winner',
//   'not_winner',
//   'disqualified',
//   'published',
// ];

// // --- Stable signature + dedupe (keep newest) ---
// const pick = (o, ...keys) => keys.map((k) => o?.[k]).find(Boolean);

// const getVideoId = (s) =>
//   pick(s, 'video_id', 'videoId') ||
//   pick(s?.video || {}, 'id', 'video_id');

// const getCompId = (s) =>
//   pick(s, 'competition_id', 'competitionId') ||
//   pick(s?.competition || {}, 'id', '_id');

// const getUserId = (s) =>
//   pick(s, 'user_id', 'userId') ||
//   pick(s?.user || {}, 'id', '_id');

// const getPrimaryId = (s) =>
//   pick(s, 'id', '_id', 'submission_id', 'submissionId');

// const getTimestamp = (s) =>
//   pick(s, 'updated_at', 'updatedAt', 'created_at', 'createdAt') || 0;

// const getSid = (s) => {
//   const pid = getPrimaryId(s);
//   if (pid) return String(pid);
//   const sig = [getVideoId(s), getCompId(s), getUserId(s)].filter(Boolean).join('|');
//   if (sig) return sig; // stable combo
//   // super-fallback (rare): title + first 10 chars of summary + date
//   const t = (s.title || s.project_title || '').slice(0, 50);
//   const d = String(getTimestamp(s));
//   const sm = (s.summary || '').slice(0, 10);
//   return `${t}|${sm}|${d}` || Math.random().toString(36).slice(2);
// };

// const dedupeKeepNewest = (arr = []) => {
//   const map = new Map(); // sid -> item
//   for (const it of arr) {
//     const sid = getSid(it);
//     const prev = map.get(sid);
//     if (!prev) {
//       map.set(sid, it);
//       continue;
//     }
//     // keep the one with newer timestamp
//     const a = new Date(getTimestamp(prev)).getTime() || 0;
//     const b = new Date(getTimestamp(it)).getTime() || 0;
//     map.set(sid, b >= a ? it : prev);
//   }
//   // ensure `id` exists for downstream
//   return Array.from(map.values()).map((x) => ({ ...x, id: getPrimaryId(x) || x.id || x._id }));
// };



// export default function MySubmission() {
//   const navigate = useNavigate();
//   const { id: competitionIdParam } = useParams();
//   const { user } = useAuth();

//   const isAdminMode = useMemo(
//     () => !!competitionIdParam && (user?.role || '').toLowerCase() === 'admin',
//     [competitionIdParam, user]
//   );

//   const [activeTab, setActiveTab] = useState('registrations');
//   const [loading, setLoading] = useState(true);
//   const [registrations, setRegistrations] = useState([]);
//   const [submissions, setSubmissions] = useState([]);
//   const [error, setError] = useState(null);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [drafts, setDrafts] = useState({});

//   useEffect(() => {
//     loadData();
//   }, [competitionIdParam, isAdminMode]);

//   const loadData = async () => {
//   setLoading(true);
//   setError(null);
//   try {
//     if (isAdminMode) {
//       const [regRes, subRes] = await Promise.all([
//         apiService.makeRequest(`/competitions/${competitionIdParam}/registrations`),
//         apiService.listSubmissionsByCompetition(competitionIdParam),
//       ]);

//       const regsRaw = regRes?.data?.registrations || [];
//       const subsRaw = subRes?.data?.submissions || subRes?.submissions || [];

//       const regs = dedupeKeepNewest(regsRaw);
//       const subs = dedupeKeepNewest(subsRaw);

//       setRegistrations(regs);
//       setSubmissions(subs);

//       const init = {};
//       subs.forEach((s) => {
//         const sid = getSid(s);
//         init[sid] = {
//           status: s.status || 'submitted',
//           final_score: s.final_score ?? '',
//           feedback: s.feedback || '',
//           saving: false,
//           err: null,
//         };
//       });
//       setDrafts(init);
//     } else {
//       const res = await apiService.listMySubmissions();
//       const listRaw = res?.data?.submissions || res?.submissions || [];
//       const list = dedupeKeepNewest(listRaw);
//       setSubmissions(list);
//     }
//   } catch (err) {
//     setError(err?.message || 'Failed to load data');
//   } finally {
//     setLoading(false);
//   }
// };



//   const updateDraft = (id, patch) => {
//     setDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), ...patch } }));
//   };

//   const saveEvaluation = async (s) => {
//   const sid = getSid(s);
//   const d = drafts[sid] || {};
//   updateDraft(sid, { saving: true, err: null });
//   try {
//     const payload = {
//       status: d.status,
//       ...(d.final_score !== '' && !Number.isNaN(Number(d.final_score))
//         ? { final_score: Number(d.final_score) }
//         : {}),
//     feedback: d.feedback || undefined,
//     };
//     await apiService.updateSubmission(sid, payload);
//     setSubmissions((prev) =>
//       prev.map((x) => (getSid(x) === sid ? { ...x, ...payload } : x))
//     );
//     updateDraft(sid, { saving: false });
//   } catch (err) {
//     updateDraft(sid, { err: err?.message || 'Failed to save evaluation', saving: false });
//   }
// };


//   const goToVideo = (s) => {
//   const vid =
//     s.video_id || s.videoId || s.video?.id || s.video?.video_id;

//   if (vid) {
//     // ✅ Preferred: go by ID
//     navigate(`/main?tab=feed&video=${encodeURIComponent(vid)}`);
//     return;
//   }

//   const url = s.video_url || s.video?.url;
//   if (url) {
//     // ✅ Fallback: go by URL (and optionally pass a title)
//     const params = new URLSearchParams({
//       tab: 'feed',
//       videoUrl: url,
//     });

//     if (s.title || s.project_title) {
//       params.set('title', s.title || s.project_title);
//     }
//     if (s.summary) params.set('desc', s.summary);

//     navigate(`/main?${params.toString()}`);
//   }
// };


//   return (
//     <SidebarLayout
//       currentPage="competitions"
//       onPageChange={(page) => navigate(`/main?tab=${encodeURIComponent(page)}`)}
//     >
//       <div className="p-6">
//         {/* Header */}
//         <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
//               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m-9 8h12" />
//               </svg>
//             </div>
//             <div>
//               <h1 className="text-lg font-bold">
//                 {isAdminMode ? 'Competition Management' : 'My Submissions'}
//               </h1>
//               <p className="text-white/70 text-sm">
//                 {isAdminMode ? 'Review registrations and evaluate submissions' : 'Track your submissions'}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Tabs - Admin Only */}
//         {isAdminMode && (
//           <div className="flex gap-2 mb-6">
//             <button
//               onClick={() => setActiveTab('registrations')}
//               className={`px-6 py-3 rounded-lg font-medium transition-all ${
//                 activeTab === 'registrations'
//                   ? 'bg-white/20 text-white border-2 border-white/30'
//                   : 'bg-white/5 text-white/60 hover:bg-white/10'
//               }`}
//             >
//               Registrations ({registrations.length})
//             </button>
//             <button
//               onClick={() => setActiveTab('submitted')}
//               className={`px-6 py-3 rounded-lg font-medium transition-all ${
//                 activeTab === 'submitted'
//                   ? 'bg-white/20 text-white border-2 border-white/30'
//                   : 'bg-white/5 text-white/60 hover:bg-white/10'
//               }`}
//             >
//               Submitted ({submissions.length})
//             </button>
//           </div>
//         )}

//         {/* Loading State */}
//         {loading && (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
//           </div>
//         )}

//         {/* Error State */}
//         {!loading && error && (
//           <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
//             {error}
//           </div>
//         )}

//         {/* Empty State */}
//         {!loading && !error && !isAdminMode && submissions.length === 0 && (
//           <div className="text-center py-16 text-white/70">No submissions yet</div>
//         )}

//         {/* Registrations Tab - Admin Only */}
//         {!loading && !error && isAdminMode && activeTab === 'registrations' && (
//           <div className="grid gap-4">
//             {registrations.length === 0 ? (
//               <div className="text-center py-16 text-white/70">No registrations yet</div>
//             ) : (
//               registrations.map((reg) => (
//                 <div
//                   key={reg.id}
//                   className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
//                   onClick={() => setSelectedUser(reg)}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
//                         {reg.leader?.name?.charAt(0) || 'U'}
//                       </div>
//                       <div>
//                         <div className="font-semibold text-white">{reg.leader?.name || 'Unknown'}</div>
//                         <div className="text-sm text-white/60">{reg.leader?.email}</div>
//                         {reg.type === 'team' && (
//                           <div className="text-xs text-white/50 mt-1">
//                             Team: {reg.team_name} • {reg.teamMembers?.length || 0} member(s)
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-xs text-white/60">Registered</div>
//                       <div className="text-sm text-white/80">
//                         {new Date(reg.created_at).toLocaleDateString()}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}

//         {/* Submitted Tab / User Submissions */}
//         {!loading && !error && (isAdminMode ? activeTab === 'submitted' : true) && submissions.length > 0 && (
//           <div className={isAdminMode ? "grid gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
//             {submissions.map((s) => {
//               const sid = getSid(s);
//               const d = drafts[sid] || {};
//               const statusText = (s.status || '').replace(/_/g, ' ') || '—';
//               const vid = s.video_id || s.videoId || s.video?.id || s.video?.video_id;

//               // Admin view - full width cards with evaluation
//               if (isAdminMode) {
//                 return (
//                   <div key={sid} className="bg-white/10 rounded-xl p-4 border border-white/20">
//                     <div className="flex items-start justify-between mb-4">
//                       <div>
//                         <div className="text-white font-semibold text-lg">
//                           {s.title || s.project_title || 'Untitled Project'}
//                         </div>
//                         <div className="text-white/60 text-sm">
//                           by {s.user?.name || s.user?.email || 'Unknown'}
//                         </div>
//                       </div>
//                       <div className={`px-3 py-1 rounded ${chip(s.status)} text-xs font-medium whitespace-nowrap`}>
//                         {statusText}
//                         {s.final_score != null && ` • ${Number(s.final_score).toFixed(2)}`}
//                       </div>
//                     </div>

//                     {s.summary && <p className="text-white/80 text-sm mb-3">{s.summary}</p>}

//                     <div className="flex flex-wrap gap-2 mb-4">
//                       {s.repo_url && (
//                         <a 
//                           href={s.repo_url} 
//                           target="_blank" 
//                           rel="noreferrer"
//                           className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm transition-colors inline-flex items-center gap-2"
//                         >
//                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
//                           </svg>
//                           Repository
//                         </a>
//                       )}
//                       {(vid || s.video_url) && (
//                         <button
//                           onClick={() => goToVideo(s)}
//                           className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border border-purple-400/30 text-white text-sm font-medium transition-all inline-flex items-center gap-2"
//                         >
//                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M8 5v14l11-7z"/>
//                           </svg>
//                           Watch Video
//                         </button>
//                       )}
//                       {s.drive_url && (
//                         <a 
//                           href={s.drive_url} 
//                           target="_blank" 
//                           rel="noreferrer"
//                           className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm transition-colors inline-flex items-center gap-2"
//                         >
//                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M19 18H5V6h14m0-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2m-7 10H9v1.5h3V13zm3-4.5h-6V10h6V8.5z"/>
//                           </svg>
//                           Drive
//                         </a>
//                       )}
//                       {s.zip_url && (
//                         <a 
//                           href={s.zip_url} 
//                           target="_blank" 
//                           rel="noreferrer"
//                           className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm transition-colors inline-flex items-center gap-2"
//                         >
//                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
//                           </svg>
//                           Download
//                         </a>
//                       )}
//                     </div>

//                     <div className="rounded-lg border border-white/10 bg-white/5 p-4">
//                       <div className="text-white/80 font-semibold mb-3">Evaluate Submission</div>

//                       <div className="grid sm:grid-cols-2 gap-4">
//                         <div>
//   <label className="block text-xs text-white/60 mb-1">Status</label>

//   <div className="relative">
//     <select
//       className="
//         w-full appearance-none
//         bg-zinc-800/60 text-white
//         border border-white/10 rounded-lg
//         px-3 py-2 pr-10
//         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
//         placeholder-white/50
//       "
//       value={d.status}
//       onChange={(e) => updateDraft(s.id, { status: e.target.value })}
//     >
//       {STATUS_OPTIONS.map((opt) => (
//         <option key={opt} value={opt} className="bg-zinc-800 text-white">
//           {opt.replace(/_/g, ' ')}
//         </option>
//       ))}
//     </select>

//     {/* custom chevron */}
//     <svg
//       className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
//       fill="none"
//       stroke="currentColor"
//       viewBox="0 0 24 24"
//     >
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//     </svg>
//   </div>
// </div>


//                         <div>
//                           <label className="block text-xs text-white/60 mb-1">Final Score</label>
//                           <input
//                             type="number"
//                             step="0.01"
//                             min="0"
//                             max="100"
//                             placeholder="e.g. 87.5"
//                             value={d.final_score}
//                             onChange={(e) => updateDraft(s.id, { final_score: e.target.value })}
//                             className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           />
//                         </div>
//                       </div>

//                       <div className="mt-4">
//                         <label className="block text-xs text-white/60 mb-1">Feedback</label>
//                         <textarea
//                           rows={3}
//                           value={d.feedback}
//                           onChange={(e) => updateDraft(s.id, { feedback: e.target.value })}
//                           className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           placeholder="Write feedback for the participant…"
//                         />
//                       </div>

//                       <div className="mt-4 flex items-center gap-2">
//                         <button
//                           onClick={() => saveEvaluation(s)}
//                           disabled={d.saving}
//                           className={`px-4 py-2 rounded-lg border transition-colors font-medium ${
//                             d.saving
//                               ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
//                               : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
//                           }`}
//                         >
//                           {d.saving ? 'Saving…' : 'Save Evaluation'}
//                         </button>
//                         {d.err && <span className="text-red-300 text-sm">{d.err}</span>}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               }

//               // User view - card grid layout
//               return (
//                 <div key={s.id} className="bg-white/10 rounded-xl border border-white/20 overflow-hidden hover:border-white/30 transition-all">
//                   <div className="p-4">
//                     <div className="flex items-start justify-between mb-3">
//                       <div className={`px-2 py-1 rounded ${chip(s.status)} text-xs font-medium`}>
//                         {statusText}
//                       </div>
//                       {s.final_score != null && (
//                         <div className="text-2xl font-bold text-white">
//                           {Number(s.final_score).toFixed(1)}
//                         </div>
//                       )}
//                     </div>

//                     <h3 className="text-white font-bold text-base mb-2 line-clamp-2">
//                       {s.title || s.project_title || 'Untitled Project'}
//                     </h3>

//                     {s.summary && (
//                       <p className="text-white/70 text-sm mb-3 line-clamp-3">{s.summary}</p>
//                     )}

//                     <div className="flex flex-wrap gap-2 mb-3">
//                       {s.repo_url && (
//                         <a 
//                           href={s.repo_url} 
//                           target="_blank" 
//                           rel="noreferrer"
//                           className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition-colors"
//                           title="View Repository"
//                         >
//                           <svg className="w-3.5 h-3.5 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
//                           </svg>
//                           Code
//                         </a>
//                       )}
//                       {s.drive_url && (
//                         <a 
//                           href={s.drive_url} 
//                           target="_blank" 
//                           rel="noreferrer"
//                           className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition-colors"
//                           title="View Drive"
//                         >
//                           Drive
//                         </a>
//                       )}
//                       {s.zip_url && (
//                         <a 
//                           href={s.zip_url} 
//                           target="_blank" 
//                           rel="noreferrer"
//                           className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition-colors"
//                           title="Download Files"
//                         >
//                           Download
//                         </a>
//                       )}
//                     </div>

//                     {(vid || s.video_url) && (
//                       <button
//                         onClick={() => goToVideo(s)}
//                         className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
//                       >
//                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//                           <path d="M8 5v14l11-7z"/>
//                         </svg>
//                         Watch Video
//                       </button>
//                     )}

//                     {s.feedback && (
//                       <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/85">
//                         <div className="font-semibold mb-1">Feedback:</div>
//                         <div className="text-white/70">{s.feedback}</div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* User Profile Modal */}
//         {selectedUser && (
//           <div
//             className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
//             onClick={() => setSelectedUser(null)}
//           >
//             <div
//               className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-bold">Participant Profile</h2>
//                 <button
//                   onClick={() => setSelectedUser(null)}
//                   className="text-white/60 hover:text-white transition-colors text-2xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               <div className="space-y-6">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold shrink-0">
//                     {selectedUser.leader?.name?.charAt(0) || 'U'}
//                   </div>
//                   <div>
//                     <div className="font-semibold text-lg">{selectedUser.leader?.name}</div>
//                     <div className="text-white/60 text-sm">{selectedUser.leader?.email}</div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                   <div className="bg-white/5 rounded-lg p-3">
//                     <div className="text-white/60 text-xs mb-1">College</div>
//                     <div className="text-white font-medium">{selectedUser.leader?.college || '—'}</div>
//                   </div>
//                   <div className="bg-white/5 rounded-lg p-3">
//                     <div className="text-white/60 text-xs mb-1">Branch</div>
//                     <div className="text-white font-medium">{selectedUser.leader?.branch || '—'}</div>
//                   </div>
//                   <div className="bg-white/5 rounded-lg p-3">
//                     <div className="text-white/60 text-xs mb-1">Year</div>
//                     <div className="text-white font-medium">{selectedUser.leader?.year || '—'}</div>
//                   </div>
//                   <div className="bg-white/5 rounded-lg p-3">
//                     <div className="text-white/60 text-xs mb-1">Phone</div>
//                     <div className="text-white font-medium">{selectedUser.leader?.phone || '—'}</div>
//                   </div>
//                 </div>

//                 {selectedUser.type === 'team' && selectedUser.teamMembers?.length > 0 && (
//                   <div>
//                     <div className="text-white/80 font-semibold mb-3">Team Members</div>
//                     <div className="space-y-2">
//                       {selectedUser.teamMembers.map((member) => (
//                         <div key={member.id} className="bg-white/5 rounded-lg p-3 flex items-center space-x-3">
//                           <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-sm font-bold shrink-0">
//                             {member.name?.charAt(0) || 'M'}
//                           </div>
//                           <div>
//                             <div className="text-white font-medium">{member.name}</div>
//                             <div className="text-white/60 text-xs">{member.email}</div>
//                             {member.college && (
//                               <div className="text-white/50 text-xs">{member.college}</div>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
//                   <div className="text-blue-200 text-xs mb-1">Registration Date</div>
//                   <div className="text-white font-medium">
//                     {new Date(selectedUser.created_at).toLocaleDateString('en-US', {
//                       year: 'numeric',
//                       month: 'long',
//                       day: 'numeric',
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </SidebarLayout>
//   );
// }

// src/pages/MySubmission.jsx
import React, { useEffect, useState, useMemo } from "react";
import SidebarLayout from "../components/SidebarLayout";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

// Lucide icons to mirror the Create/Edit header vibe
import {
  Rocket,
  X,
  Play,
  FolderGit2,
  Download,
  FileText,
  Users,
  ChevronLeft,
} from "lucide-react";

const STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "needs_changes",
  "shortlisted",
  "winner",
  "not_winner",
  "disqualified",
  "published",
];

// status chip styles (kept subtle but readable)
const chip = (status) => {
  const base =
    "px-2 py-1 rounded text-xs font-medium border inline-flex items-center gap-1";
  const map = {
    submitted: `${base} bg-background border-border text-secondary-text`,
    under_review: `${base} bg-background border-border text-secondary-text`,
    needs_changes: `${base} bg-background border-border text-secondary-text`,
    disqualified: `${base} bg-background border-border text-secondary-text`,
    shortlisted: `${base} bg-background border-border text-secondary-text`,
    winner: `${base} bg-background border-border text-secondary-text`,
    not_winner: `${base} bg-background border-border text-secondary-text`,
    published: `${base} bg-background border-border text-secondary-text`,
  };
  return map[status] || `${base} bg-background border-border text-secondary-text`;
};

// --- Stable signature + dedupe (keep newest) ---
const pick = (o, ...keys) => keys.map((k) => o?.[k]).find(Boolean);

const getVideoId = (s) =>
  pick(s, "video_id", "videoId") || pick(s?.video || {}, "id", "video_id");

const getCompId = (s) =>
  pick(s, "competition_id", "competitionId") ||
  pick(s?.competition || {}, "id", "_id");

const getUserId = (s) =>
  pick(s, "user_id", "userId") || pick(s?.user || {}, "id", "_id");

const getPrimaryId = (s) => pick(s, "id", "_id", "submission_id", "submissionId");

const getTimestamp = (s) =>
  pick(s, "updated_at", "updatedAt", "created_at", "createdAt") || 0;

const getSid = (s) => {
  const pid = getPrimaryId(s);
  if (pid) return String(pid);
  const sig = [getVideoId(s), getCompId(s), getUserId(s)]
    .filter(Boolean)
    .join("|");
  if (sig) return sig;
  const t = (s.title || s.project_title || "").slice(0, 50);
  const d = String(getTimestamp(s));
  const sm = (s.summary || "").slice(0, 10);
  return `${t}|${sm}|${d}` || Math.random().toString(36).slice(2);
};

const dedupeKeepNewest = (arr = []) => {
  const map = new Map(); // sid -> item
  for (const it of arr) {
    const sid = getSid(it);
    const prev = map.get(sid);
    if (!prev) {
      map.set(sid, it);
      continue;
    }
    const a = new Date(getTimestamp(prev)).getTime() || 0;
    const b = new Date(getTimestamp(it)).getTime() || 0;
    map.set(sid, b >= a ? it : prev);
  }
  return Array.from(map.values()).map((x) => ({
    ...x,
    id: getPrimaryId(x) || x.id || x._id,
  }));
};

export default function MySubmission() {
  const navigate = useNavigate();
  const { id: competitionIdParam } = useParams();
  const { user } = useAuth();

  const isAdminMode = useMemo(
    () => !!competitionIdParam && (user?.role || "").toLowerCase() === "admin",
    [competitionIdParam, user]
  );

  const [activeTab, setActiveTab] = useState("registrations");
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionIdParam, isAdminMode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdminMode) {
        const [regRes, subRes] = await Promise.all([
          apiService.makeRequest(`/competitions/${competitionIdParam}/registrations`),
          apiService.listSubmissionsByCompetition(competitionIdParam),
        ]);

        const regsRaw = regRes?.data?.registrations || [];
        const subsRaw = subRes?.data?.submissions || subRes?.submissions || [];

        const regs = dedupeKeepNewest(regsRaw);
        const subs = dedupeKeepNewest(subsRaw);

        setRegistrations(regs);
        setSubmissions(subs);

        const init = {};
        subs.forEach((s) => {
          const sid = getSid(s);
          init[sid] = {
            status: s.status || "submitted",
            final_score: s.final_score ?? "",
            feedback: s.feedback || "",
            saving: false,
            err: null,
          };
        });
        setDrafts(init);
      } else {
        const res = await apiService.listMySubmissions();
        const listRaw = res?.data?.submissions || res?.submissions || [];
        const list = dedupeKeepNewest(listRaw);
        setSubmissions(list);
      }
    } catch (err) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (sid, patch) => {
    setDrafts((d) => ({ ...d, [sid]: { ...(d[sid] || {}), ...patch } }));
  };

  const saveEvaluation = async (s) => {
    const sid = getSid(s);
    const d = drafts[sid] || {};
    updateDraft(sid, { saving: true, err: null });
    try {
      const payload = {
        status: d.status,
        ...(d.final_score !== "" && !Number.isNaN(Number(d.final_score))
          ? { final_score: Number(d.final_score) }
          : {}),
        feedback: d.feedback || undefined,
      };
      await apiService.updateSubmission(sid, payload);
      setSubmissions((prev) =>
        prev.map((x) => (getSid(x) === sid ? { ...x, ...payload } : x))
      );
      updateDraft(sid, { saving: false });
    } catch (err) {
      updateDraft(sid, {
        err: err?.message || "Failed to save evaluation",
        saving: false,
      });
    }
  };

  const goToVideo = (s) => {
    const vid = s.video_id || s.videoId || s.video?.id || s.video?.video_id;
    if (vid) {
      navigate(`/main?tab=feed&video=${encodeURIComponent(vid)}`);
      return;
    }
    const url = s.video_url || s.video?.url;
    if (url) {
      const params = new URLSearchParams({ tab: "feed", videoUrl: url });
      if (s.title || s.project_title) params.set("title", s.title || s.project_title);
      if (s.summary) params.set("desc", s.summary);
      navigate(`/main?${params.toString()}`);
    }
  };

  return (
    <SidebarLayout
      currentPage="competitions"
      onPageChange={(page) => navigate(`/main?tab=${encodeURIComponent(page)}`)}
    >
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header — identical structure to Create/Edit */}
          <div className="bg-surface rounded-xl p-4 border border-border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-primary-text" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-primary-text">
                    {isAdminMode ? "Competition Management" : "My Submissions"}
                  </h1>
                  <p className="text-secondary-text text-sm">
                    {isAdminMode
                      ? "Review registrations and evaluate submissions"
                      : "Track your submissions"}
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

          {/* Tabs — Admin only */}
          {isAdminMode && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("registrations")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  activeTab === "registrations"
                    ? "bg-surface border-border text-primary-text"
                    : "bg-background border-border text-secondary-text hover:text-primary-text"
                }`}
              >
                Registrations ({registrations.length})
              </button>
              <button
                onClick={() => setActiveTab("submitted")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  activeTab === "submitted"
                    ? "bg-surface border-border text-primary-text"
                    : "bg-background border-border text-secondary-text hover:text-primary-text"
                }`}
              >
                Submitted ({submissions.length})
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-surface rounded-xl p-6 border border-border text-secondary-text">
              Loading…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-4 bg-background border border-border rounded-xl text-red-300">
              {error}
            </div>
          )}

          {/* Empty (user mode) */}
          {!loading && !error && !isAdminMode && submissions.length === 0 && (
            <div className="bg-surface rounded-xl p-8 border border-border text-center text-secondary-text">
              No submissions yet
            </div>
          )}

          {/* Registrations — Admin */}
          {!loading && !error && isAdminMode && activeTab === "registrations" && (
            <div className="grid gap-4">
              {registrations.length === 0 ? (
                <div className="bg-surface rounded-xl p-8 border border-border text-center text-secondary-text">
                  No registrations yet
                </div>
              ) : (
                registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="bg-surface rounded-xl p-4 border border-border hover:bg-background transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(reg)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-text" />
                        </div>
                        <div>
                          <div className="font-semibold text-primary-text">
                            {reg.leader?.name || "Unknown"}
                          </div>
                          <div className="text-secondary-text text-sm">
                            {reg.leader?.email}
                          </div>
                          {reg.type === "team" && (
                            <div className="text-secondary-text text-xs mt-1">
                              Team: {reg.team_name} • {reg.teamMembers?.length || 0} member(s)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-secondary-text text-xs">Registered</div>
                        <div className="text-primary-text text-sm">
                          {reg.created_at
                            ? new Date(reg.created_at).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Submissions grid (Admin: list view; User: card grid) */}
          {!loading &&
            !error &&
            (isAdminMode ? activeTab === "submitted" : true) &&
            submissions.length > 0 && (
              <div
                className={
                  isAdminMode
                    ? "grid gap-4"
                    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                }
              >
                {submissions.map((s) => {
                  const sid = getSid(s);
                  const d = drafts[sid] || {};
                  const statusText = (s.status || "").replace(/_/g, " ") || "—";
                  const vid = s.video_id || s.videoId || s.video?.id || s.video?.video_id;

                  // Admin view — editable evaluation
                  if (isAdminMode) {
                    return (
                      <div
                        key={sid}
                        className="bg-surface rounded-xl p-4 border border-border"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="text-primary-text font-semibold text-lg">
                              {s.title || s.project_title || "Untitled Project"}
                            </div>
                            <div className="text-secondary-text text-sm">
                              by {s.user?.name || s.user?.email || "Unknown"}
                            </div>
                          </div>
                          <div className={chip(s.status)}>
                            {statusText}
                            {s.final_score != null &&
                              ` • ${Number(s.final_score).toFixed(2)}`}
                          </div>
                        </div>

                        {s.summary && (
                          <p className="text-secondary-text text-sm mb-4">{s.summary}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                          {s.repo_url && (
                            <a
                              href={s.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-background border border-border text-primary-text text-sm inline-flex items-center gap-2"
                            >
                              <FolderGit2 className="w-4 h-4" />
                              Repository
                            </a>
                          )}
                          {(vid || s.video_url) && (
                            <button
                              type="button"
                              onClick={() => goToVideo(s)}
                              className="px-3 py-1.5 rounded-lg bg-background border border-border text-primary-text text-sm inline-flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Watch Video
                            </button>
                          )}
                          {s.drive_url && (
                            <a
                              href={s.drive_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-background border border-border text-primary-text text-sm inline-flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Drive
                            </a>
                          )}
                          {s.zip_url && (
                            <a
                              href={s.zip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-background border border-border text-primary-text text-sm inline-flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          )}
                        </div>

                        {/* Evaluation form with native submit button */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveEvaluation(s);
                          }}
                          className="rounded-lg border border-border bg-background p-4"
                        >
                          <div className="text-primary-text font-semibold mb-3">
                            Evaluate Submission
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-secondary-text text-xs mb-1">
                                Status
                              </label>
                              <div className="relative">
                                <select
                                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary-text outline-none"
                                  value={d.status || "submitted"}
                                  onChange={(e) =>
                                    updateDraft(sid, { status: e.target.value })
                                  }
                                >
                                  {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt.replace(/_/g, " ")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-secondary-text text-xs mb-1">
                                Final Score
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="e.g. 87.5"
                                value={d.final_score}
                                onChange={(e) =>
                                  updateDraft(sid, { final_score: e.target.value })
                                }
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary-text outline-none"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-secondary-text text-xs mb-1">
                              Feedback
                            </label>
                            <textarea
                              rows={3}
                              value={d.feedback}
                              onChange={(e) =>
                                updateDraft(sid, { feedback: e.target.value })
                              }
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-primary-text outline-none resize-y"
                              placeholder="Write feedback for the participant…"
                            />
                          </div>

                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={d.saving}
                              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold border border-primary/50 disabled:opacity-60"
                            >
                              {d.saving ? "Saving…" : "Save Evaluation"}
                            </button>
                            {d.err && (
                              <span className="text-red-300 text-sm">{d.err}</span>
                            )}
                          </div>
                        </form>
                      </div>
                    );
                  }

                  // User view — card grid
                  return (
                    <div
                      key={sid}
                      className="bg-surface rounded-xl border border-border overflow-hidden hover:bg-background transition-colors"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={chip(s.status)}>{statusText}</div>
                          {s.final_score != null && (
                            <div className="text-primary-text text-2xl font-bold">
                              {Number(s.final_score).toFixed(1)}
                            </div>
                          )}
                        </div>

                        <h3 className="text-primary-text font-bold text-base mb-2 line-clamp-2">
                          {s.title || s.project_title || "Untitled Project"}
                        </h3>

                        {s.summary && (
                          <p className="text-secondary-text text-sm mb-3 line-clamp-3">
                            {s.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-3">
                          {s.repo_url && (
                            <a
                              href={s.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-background border border-border text-primary-text text-xs inline-flex items-center gap-1"
                              title="View Repository"
                            >
                              <FolderGit2 className="w-3.5 h-3.5" />
                              Code
                            </a>
                          )}
                          {s.drive_url && (
                            <a
                              href={s.drive_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-background border border-border text-primary-text text-xs"
                              title="View Drive"
                            >
                              Drive
                            </a>
                          )}
                          {s.zip_url && (
                            <a
                              href={s.zip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-background border border-border text-primary-text text-xs inline-flex items-center gap-1"
                              title="Download Files"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          )}
                        </div>

                        {(vid || s.video_url) && (
                          <button
                            type="button"
                            onClick={() => goToVideo(s)}
                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-primary-text font-medium inline-flex items-center justify-center gap-2"
                          >
                            <Play className="w-5 h-5" />
                            Watch Video
                          </button>
                        )}

                        {s.feedback && (
                          <div className="mt-3 p-2 rounded-lg bg-background border border-border text-xs">
                            <div className="font-semibold text-primary-text mb-1">
                              Feedback:
                            </div>
                            <div className="text-secondary-text">{s.feedback}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {/* Participant Profile Modal */}
          {selectedUser && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedUser(null)}
            >
              <div
                className="bg-surface rounded-xl p-6 max-w-lg w-full border border-border shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-primary-text">
                    Participant Profile
                  </h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-secondary-text hover:text-primary-text transition-colors text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center">
                      <Users className="w-7 h-7 text-primary-text" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-primary-text">
                        {selectedUser.leader?.name}
                      </div>
                      <div className="text-secondary-text text-sm">
                        {selectedUser.leader?.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-secondary-text text-xs mb-1">College</div>
                      <div className="text-primary-text font-medium">
                        {selectedUser.leader?.college || "—"}
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-secondary-text text-xs mb-1">Branch</div>
                      <div className="text-primary-text font-medium">
                        {selectedUser.leader?.branch || "—"}
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-secondary-text text-xs mb-1">Year</div>
                      <div className="text-primary-text font-medium">
                        {selectedUser.leader?.year || "—"}
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-secondary-text text-xs mb-1">Phone</div>
                      <div className="text-primary-text font-medium">
                        {selectedUser.leader?.phone || "—"}
                      </div>
                    </div>
                  </div>

                  {selectedUser.type === "team" &&
                    selectedUser.teamMembers?.length > 0 && (
                      <div>
                        <div className="text-primary-text font-semibold mb-3">
                          Team Members
                        </div>
                        <div className="space-y-2">
                          {selectedUser.teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="bg-background rounded-lg p-3 border border-border flex items-center gap-3"
                            >
                              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary-text" />
                              </div>
                              <div>
                                <div className="text-primary-text font-medium">
                                  {member.name}
                                </div>
                                <div className="text-secondary-text text-xs">
                                  {member.email}
                                </div>
                                {member.college && (
                                  <div className="text-secondary-text text-xs">
                                    {member.college}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="bg-background border border-border rounded-lg p-3">
                    <div className="text-secondary-text text-xs mb-1">
                      Registration Date
                    </div>
                    <div className="text-primary-text font-medium">
                      {selectedUser.created_at
                        ? new Date(selectedUser.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-secondary-text hover:text-primary-text transition-colors text-sm inline-flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
