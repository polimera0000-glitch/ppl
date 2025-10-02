

// // src/pages/CreateCompetitionScreen.jsx
// import React, { useState, useEffect, useMemo } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { apiService } from '../services/apiService';
// import SidebarLayout from '../components/SidebarLayout';
// import CustomButton from '../components/CustomButton';

// const emptyPrize = { place: '', amount: '' };
// const emptyResource = { label: '', url: '' };

// const CreateCompetitionScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user, isAuthenticated } = useAuth();

//   const competitionToEdit = location.state?.competition || null;
//   const isEdit = !!competitionToEdit;

//   // --- Core fields ---
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [sponsor, setSponsor] = useState('');
//   const [locationField, setLocationField] = useState('');
//   const [bannerUrl, setBannerUrl] = useState('');
//   const [maxTeamSize, setMaxTeamSize] = useState('1');
//   const [seatsRemaining, setSeatsRemaining] = useState('100');
//   const [tagsText, setTagsText] = useState('');
//   const [stagesText, setStagesText] = useState('registration,submission,evaluation');
//   const [prizePool, setPrizePool] = useState('');

//   // --- Timeline fields ---
//   const [registrationStartDate, setRegistrationStartDate] = useState('');
//   const [registrationDeadline, setRegistrationDeadline] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [resultsDate, setResultsDate] = useState('');

//   // --- Structured fields (UI > JSON under the hood) ---
//   const [eligibility, setEligibility] = useState({
//     minAge: '',
//     maxAge: '',
//     education: '',
//     countriesAllowed: '', // comma-separated in UI; array in payload
//   });

//   const [contact, setContact] = useState({
//     email: '',
//     phone: '',
//     website: '',
//     discord: '',
//   });

//   const [prizes, setPrizes] = useState([{ ...emptyPrize }]);
//   const [resources, setResources] = useState([{ ...emptyResource }]);

//   // --- Rules (Markdown or plain) ---
//   const [rulesMarkdown, setRulesMarkdown] = useState('');

//   // misc
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   // Prefill if editing
//   useEffect(() => {
//     if (!isEdit || !competitionToEdit) return;
//     const c = competitionToEdit;

//     setTitle(c.title || '');
//     setDescription(c.description || '');
//     setSponsor(c.sponsor || '');
//     setLocationField(c.location || '');
//     setBannerUrl(c.banner_image_url || '');
//     setMaxTeamSize(String(c.max_team_size ?? 1));
//     setSeatsRemaining(String(c.seats_remaining ?? c.total_seats ?? 100));
//     setTagsText(Array.isArray(c.tags) ? c.tags.join(',') : (c.tags || ''));
//     setStagesText(Array.isArray(c.stages) ? c.stages.join(',') : (c.stages || 'registration,submission,evaluation'));
//     setPrizePool(c.prize_pool ? String(c.prize_pool) : '');

//     if (c.start_date) setStartDate(new Date(c.start_date).toISOString().split('T')[0]);
//     if (c.end_date) setEndDate(new Date(c.end_date).toISOString().split('T')[0]);

//     // New timeline fields if present
//     if (c.registration_start_date) setRegistrationStartDate(new Date(c.registration_start_date).toISOString().split('T')[0]);
//     if (c.registration_deadline) setRegistrationDeadline(new Date(c.registration_deadline).toISOString().split('T')[0]);
//     if (c.results_date) setResultsDate(new Date(c.results_date).toISOString().split('T')[0]);

//     // Structured: eligibility/contact/prizes/resources/rulesMarkdown
//     if (c.eligibility_criteria && typeof c.eligibility_criteria === 'object') {
//       const ec = c.eligibility_criteria || {};
//       setEligibility({
//         minAge: ec.minAge ?? '',
//         maxAge: ec.maxAge ?? '',
//         education: ec.education ?? '',
//         countriesAllowed: Array.isArray(ec.countriesAllowed) ? ec.countriesAllowed.join(',') : (ec.countriesAllowed || ''),
//       });
//     }
//     if (c.contact_info && typeof c.contact_info === 'object') {
//       const ci = c.contact_info || {};
//       setContact({
//         email: ci.email ?? '',
//         phone: ci.phone ?? '',
//         website: ci.website ?? '',
//         discord: ci.discord ?? '',
//       });
//     }
//     if (Array.isArray(c.prizes_json) && c.prizes_json.length) setPrizes(c.prizes_json.map(p => ({ place: p.place ?? '', amount: String(p.amount ?? '') })));
//     if (Array.isArray(c.resources_json) && c.resources_json.length) setResources(c.resources_json.map(r => ({ label: r.label ?? '', url: r.url ?? '' })));
//     if (c.rules_markdown) setRulesMarkdown(c.rules_markdown);
//     else if (c.rules) setRulesMarkdown(c.rules);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isEdit]);

//   // Admin guard
//   useEffect(() => {
//     if (!isAuthenticated || user?.role?.toLowerCase() !== 'admin') {
//       navigate('/main');
//     }
//   }, [isAuthenticated, user, navigate]);

//   // helpers
//   const addPrize = () => setPrizes(prev => [...prev, { ...emptyPrize }]);
//   const removePrize = (idx) => setPrizes(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
//   const updatePrize = (idx, key, val) => setPrizes(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));

//   const addResource = () => setResources(prev => [...prev, { ...emptyResource }]);
//   const removeResource = (idx) => setResources(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
//   const updateResource = (idx, key, val) => setResources(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));

//   const tagsArray = useMemo(
//     () => (tagsText.trim() ? tagsText.split(',').map(s => s.trim()).filter(Boolean) : []),
//     [tagsText]
//   );
//   const stagesArray = useMemo(
//     () => (stagesText.trim() ? stagesText.split(',').map(s => s.trim()).filter(Boolean) : []),
//     [stagesText]
//   );

//   const validate = () => {
//     if (!title.trim() || title.trim().length < 3) return setError('Title must be at least 3 characters'), false;
//     if (!description.trim() || description.trim().length < 10) return setError('Description must be at least 10 characters'), false;

//     if (!startDate || !endDate) return setError('Please select start and end dates'), false;
//     if (new Date(endDate) <= new Date(startDate)) return setError('End date must be after start date'), false;

//     if (registrationStartDate && new Date(registrationStartDate) > new Date(startDate)) {
//       return setError('Registration start must be on/before competition start'), false;
//     }
//     if (registrationDeadline && new Date(registrationDeadline) > new Date(startDate)) {
//       return setError('Registration deadline must be before competition start'), false;
//     }
//     if (resultsDate && new Date(resultsDate) < new Date(endDate)) {
//       return setError('Results date must be on/after competition end'), false;
//     }

//     const m = parseInt(maxTeamSize, 10);
//     if (!Number.isFinite(m) || m < 1) return setError('Max team size must be at least 1'), false;

//     const s = parseInt(seatsRemaining, 10);
//     if (!Number.isFinite(s) || s < 0) return setError('Seats available cannot be negative'), false;

//     // Validate URLs in resources
//     for (const r of resources) {
//       if (r.url && !/^https?:\/\//i.test(r.url)) {
//         return setError('Every Resource URL must start with http:// or https://'), false;
//       }
//     }
//     // Validate banner url if provided
//     if (bannerUrl && !/^https?:\/\//i.test(bannerUrl)) {
//       return setError('Banner Image URL must start with http:// or https://'), false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     if (!validate()) return;

//     setSubmitting(true);
//     try {
//       const payload = {
//         title: title.trim(),
//         description: description.trim(),
//         sponsor: sponsor.trim() || null,
//         location: locationField.trim() || null,
//         banner_image_url: bannerUrl.trim() || null,

//         start_date: new Date(startDate).toISOString(),
//         end_date: new Date(endDate).toISOString(),

//         // timeline extras (supported by your updated model/migrations)
//         registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
//         registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
//         results_date: resultsDate ? new Date(resultsDate).toISOString() : null,

//         max_team_size: parseInt(maxTeamSize, 10),
//         seats_remaining: parseInt(seatsRemaining, 10),
//         total_seats: parseInt(seatsRemaining, 10),

//         tags: tagsArray,
//         stages: stagesArray,

//         // structured objects
//         eligibility_criteria: {
//           minAge: eligibility.minAge ? Number(eligibility.minAge) : undefined,
//           maxAge: eligibility.maxAge ? Number(eligibility.maxAge) : undefined,
//           education: eligibility.education || undefined,
//           countriesAllowed: eligibility.countriesAllowed
//             ? eligibility.countriesAllowed.split(',').map(s => s.trim()).filter(Boolean)
//             : undefined,
//         },

//         contact_info: {
//           email: contact.email || undefined,
//           phone: contact.phone || undefined,
//           website: contact.website || undefined,
//           discord: contact.discord || undefined,
//         },

//         // optional extras
//         prize_pool: prizePool ? Number(prizePool) : null,
//         prizes_json: prizes
//           .map(p => ({ place: p.place?.trim(), amount: p.amount ? Number(p.amount) : undefined }))
//           .filter(p => p.place || (Number.isFinite(p.amount) && p.amount >= 0)),

//         resources_json: resources
//           .map(r => ({ label: r.label?.trim(), url: r.url?.trim() }))
//           .filter(r => r.label || r.url),

//         rules_markdown: rulesMarkdown?.trim() || null,
//       };

//       // Clean undefineds inside nested objects (Sequelize JSONB is fine, but keep it tidy)
//       if (payload.eligibility_criteria && Object.values(payload.eligibility_criteria).every(v => v === undefined)) {
//         delete payload.eligibility_criteria;
//       }
//       if (payload.contact_info && Object.values(payload.contact_info).every(v => v === undefined)) {
//         delete payload.contact_info;
//       }

//       // Submit
//       let response;
//       if (isEdit) {
//         const id = competitionToEdit.id || competitionToEdit._id;
//         response = await apiService.makeRequest(`/competitions/${id}`, {
//           method: 'PUT',
//           body: JSON.stringify(payload),
//         });
//       } else {
//         response = await apiService.makeRequest('/competitions', {
//           method: 'POST',
//           body: JSON.stringify(payload),
//         });
//       }

//       if (response?.success) {
//         navigate(-1, { state: { refreshCompetitions: true } });
//       } else {
//         setError(response?.message || `${isEdit ? 'Update' : 'Creation'} failed`);
//       }
//     } catch (err) {
//       setError(err?.message || 'Network error occurred');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
//       <div className="p-6">
//         {/* Header */}
//         <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
//                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-lg font-bold">{isEdit ? 'Edit Competition' : 'Create Competition'}</h1>
//                 <p className="text-white/70 text-sm">
//                   {isEdit ? 'Update competition details' : 'Set up a new competition'}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => navigate(-1)}
//               className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
//               aria-label="Close"
//             >
//               <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Form */}
//         <div className="bg-white/10 rounded-xl p-6 border border-white/20">
//           <form onSubmit={handleSubmit} className="space-y-8">
//             {/* Basic */}
//             <section className="space-y-6">
//               <div>
//                 <label className="block font-medium mb-2">
//                   Title <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   required
//                   value={title}
//                   onChange={e => setTitle(e.target.value)}
//                   placeholder="Enter competition title"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="block font-medium mb-2">
//                   Description <span className="text-red-400">*</span>
//                 </label>
//                 <textarea
//                   required
//                   rows={4}
//                   placeholder="Enter detailed description of the competition"
//                   value={description}
//                   onChange={e => setDescription(e.target.value)}
//                   className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 outline-none resize-none"
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block font-medium mb-2">Sponsor</label>
//                   <input
//                     value={sponsor}
//                     onChange={e => setSponsor(e.target.value)}
//                     placeholder="Competition sponsor"
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
//                   />
//                 </div>
//                 <div>
//                   <label className="block font-medium mb-2">Location</label>
//                   <input
//                     value={locationField}
//                     onChange={e => setLocationField(e.target.value)}
//                     placeholder="City / Online / Hybrid"
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block font-medium mb-2">Banner Image URL</label>
//                 <input
//                   value={bannerUrl}
//                   onChange={e => setBannerUrl(e.target.value)}
//                   placeholder="https://example.com/banner.jpg"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
//                 />
//               </div>
//             </section>

//             {/* Capacity */}
//             <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div>
//                 <label className="block font-medium mb-2">
//                   Max Team Size <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   min={1}
//                   required
//                   value={maxTeamSize}
//                   onChange={e => setMaxTeamSize(e.target.value)}
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                 />
//               </div>
//               <div>
//                 <label className="block font-medium mb-2">
//                   Seats Available <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   min={0}
//                   required
//                   value={seatsRemaining}
//                   onChange={e => setSeatsRemaining(e.target.value)}
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                 />
//               </div>
//               <div>
//                 <label className="block font-medium mb-2">Prize Pool (optional)</label>
//                 <input
//                   type="number"
//                   min={0}
//                   step="0.01"
//                   value={prizePool}
//                   onChange={e => setPrizePool(e.target.value)}
//                   placeholder="100000"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                 />
//               </div>
//             </section>

//             {/* Timeline */}
//             <section>
//               <h3 className="text-white/90 font-semibold mb-3">Timeline</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block font-medium mb-2">Registration Opens</label>
//                   <input
//                     type="date"
//                     value={registrationStartDate}
//                     onChange={e => setRegistrationStartDate(e.target.value)}
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//                 <div>
//                   <label className="block font-medium mb-2">Registration Closes</label>
//                   <input
//                     type="date"
//                     value={registrationDeadline}
//                     onChange={e => setRegistrationDeadline(e.target.value)}
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//                 <div>
//                   <label className="block font-medium mb-2">
//                     Start Date <span className="text-red-400">*</span>
//                   </label>
//                   <input
//                     type="date"
//                     required
//                     value={startDate}
//                     onChange={e => setStartDate(e.target.value)}
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//                 <div>
//                   <label className="block font-medium mb-2">
//                     End Date <span className="text-red-400">*</span>
//                   </label>
//                   <input
//                     type="date"
//                     required
//                     value={endDate}
//                     onChange={e => setEndDate(e.target.value)}
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//                 <div>
//                   <label className="block font-medium mb-2">Results Date</label>
//                   <input
//                     type="date"
//                     value={resultsDate}
//                     onChange={e => setResultsDate(e.target.value)}
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//               </div>
//             </section>

//             {/* Tags & Stages */}
//             <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block font-medium mb-2">Tags (comma-separated)</label>
//                 <input
//                   value={tagsText}
//                   onChange={e => setTagsText(e.target.value)}
//                   placeholder="e.g., ai,nlp,moderation"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
//                 />
//               </div>
//               <div>
//                 <label className="block font-medium mb-2">Stages (comma-separated)</label>
//                 <input
//                   value={stagesText}
//                   onChange={e => setStagesText(e.target.value)}
//                   placeholder="registration,submission,evaluation,results"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
//                 />
//               </div>
//             </section>

//             {/* Eligibility */}
//             <section>
//               <h3 className="text-white/90 font-semibold mb-3">Eligibility</h3>
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <div>
//                   <label className="block font-medium mb-2">Min Age</label>
//                   <input
//                     type="number"
//                     min={0}
//                     value={eligibility.minAge}
//                     onChange={e => setEligibility(prev => ({ ...prev, minAge: e.target.value }))}
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//                 <div>
//                   <label className="block font-medium mb-2">Max Age</label>
//                   <input
//                     type="number"
//                     min={0}
//                     value={eligibility.maxAge}
//                     onChange={e => setEligibility(prev => ({ ...prev, maxAge: e.target.value }))}
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//                 <div className="md:col-span-2">
//                   <label className="block font-medium mb-2">Education</label>
//                   <input
//                     value={eligibility.education}
//                     onChange={e => setEligibility(prev => ({ ...prev, education: e.target.value }))}
//                     placeholder="e.g., Any / College students / Open"
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//                 <div className="md:col-span-4">
//                   <label className="block font-medium mb-2">Countries Allowed (comma-separated)</label>
//                   <input
//                     value={eligibility.countriesAllowed}
//                     onChange={e => setEligibility(prev => ({ ...prev, countriesAllowed: e.target.value }))}
//                     placeholder="e.g., US, IN, UK (leave empty for global)"
//                     className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                   />
//                 </div>
//               </div>
//             </section>

//             {/* Contact */}
//             <section>
//               <h3 className="text-white/90 font-semibold mb-3">Contact</h3>
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <input
//                   value={contact.email}
//                   onChange={e => setContact(prev => ({ ...prev, email: e.target.value }))}
//                   placeholder="Email"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                 />
//                 <input
//                   value={contact.phone}
//                   onChange={e => setContact(prev => ({ ...prev, phone: e.target.value }))}
//                   placeholder="Phone"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                 />
//                 <input
//                   value={contact.website}
//                   onChange={e => setContact(prev => ({ ...prev, website: e.target.value }))}
//                   placeholder="Website URL"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                 />
//                 <input
//                   value={contact.discord}
//                   onChange={e => setContact(prev => ({ ...prev, discord: e.target.value }))}
//                   placeholder="Discord invite"
//                   className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                 />
//               </div>
//             </section>

//             {/* Prizes */}
//             <section>
//               <div className="flex items-center justify-between mb-2">
//                 <h3 className="text-white/90 font-semibold">Prizes</h3>
//                 <button
//                   type="button"
//                   onClick={addPrize}
//                   className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm"
//                 >
//                   + Add Prize
//                 </button>
//               </div>
//               <div className="space-y-3">
//                 {prizes.map((p, idx) => (
//                   <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
//                     <input
//                       value={p.place}
//                       onChange={e => updatePrize(idx, 'place', e.target.value)}
//                       placeholder="Place (e.g., 1st)"
//                       className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                     />
//                     <input
//                       type="number"
//                       min={0}
//                       step="0.01"
//                       value={p.amount}
//                       onChange={e => updatePrize(idx, 'amount', e.target.value)}
//                       placeholder="Amount (e.g., 35000)"
//                       className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                     />
//                     <div className="flex items-center gap-2">
//                       <button
//                         type="button"
//                         onClick={() => removePrize(idx)}
//                         className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200"
//                       >
//                         Remove
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>

//             {/* Resources */}
//             <section>
//               <div className="flex items-center justify-between mb-2">
//                 <h3 className="text-white/90 font-semibold">Resources</h3>
//                 <button
//                   type="button"
//                   onClick={addResource}
//                   className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm"
//                 >
//                   + Add Resource
//                 </button>
//               </div>
//               <div className="space-y-3">
//                 {resources.map((r, idx) => (
//                   <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
//                     <input
//                       value={r.label}
//                       onChange={e => updateResource(idx, 'label', e.target.value)}
//                       placeholder="Label (e.g., Dataset, Starter Notebook)"
//                       className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                     />
//                     <input
//                       value={r.url}
//                       onChange={e => updateResource(idx, 'url', e.target.value)}
//                       placeholder="https://..."
//                       className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
//                     />
//                     <div className="flex items-center gap-2">
//                       <button
//                         type="button"
//                         onClick={() => removeResource(idx)}
//                         className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200"
//                       >
//                         Remove
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>

//             {/* Rules */}
//             <section>
//               <h3 className="text-white/90 font-semibold mb-2">Rules (Markdown allowed)</h3>
//               <textarea
//                 rows={10}
//                 placeholder="Write the competition rules here..."
//                 value={rulesMarkdown}
//                 onChange={e => setRulesMarkdown(e.target.value)}
//                 className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 outline-none resize-y"
//               />
//             </section>

//             {/* Error */}
//             {error && (
//               <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
//                 <div className="flex items-center gap-3">
//                   <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856" />
//                   </svg>
//                   <p className="text-red-300">{error}</p>
//                 </div>
//               </div>
//             )}

//             {/* Submit/Cancel */}
//             <CustomButton
//               type="submit"
//               text={
//                 submitting
//                   ? (isEdit ? 'Saving Changes...' : 'Creating Competition...')
//                   : (isEdit ? 'Save Changes' : 'Create Competition')
//               }
//               enabled={!submitting}
//               loading={submitting}
//             />

//             <div className="text-center">
//               <button
//                 type="button"
//                 onClick={() => navigate(-1)}
//                 className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                 </svg>
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </SidebarLayout>
//   );
// };

// export default CreateCompetitionScreen;


// src/pages/CreateCompetitionScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";
import SidebarLayout from "../components/SidebarLayout";
import CustomButton from "../components/CustomButton";

// Lucide icons
import {
  Rocket,
  X,
  CalendarDays,
  Tag as TagIcon,
  Image as ImageIcon,
  MapPin,
  Users,
  Gift,
  Hash,
  Link as LinkIcon,
  Plus,
  Trash2,
  FileText,
  Globe2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  Boxes
} from "lucide-react";

const emptyPrize = { place: "", amount: "" };
const emptyResource = { label: "", url: "" };

const CreateCompetitionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const competitionToEdit = location.state?.competition || null;
  const isEdit = !!competitionToEdit;

  // Core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [locationField, setLocationField] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState("1");
  const [seatsRemaining, setSeatsRemaining] = useState("100");
  const [tagsText, setTagsText] = useState("");
  const [stagesText, setStagesText] = useState("registration,submission,evaluation");
  const [prizePool, setPrizePool] = useState("");

  // Timeline
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resultsDate, setResultsDate] = useState("");

  // Structured
  const [eligibility, setEligibility] = useState({
    minAge: "",
    maxAge: "",
    education: "",
    countriesAllowed: "",
  });

  const [contact, setContact] = useState({
    email: "",
    phone: "",
    website: "",
    discord: "",
  });

  const [prizes, setPrizes] = useState([{ ...emptyPrize }]);
  const [resources, setResources] = useState([{ ...emptyResource }]);

  // Rules (markdown/plain)
  const [rulesMarkdown, setRulesMarkdown] = useState("");

  // misc
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Prefill if editing
  useEffect(() => {
    if (!isEdit || !competitionToEdit) return;
    const c = competitionToEdit;

    setTitle(c.title || "");
    setDescription(c.description || c.subtitle || "");
    setSponsor(c.sponsor || "");
    setLocationField(c.location || "");
    setBannerUrl(c.banner_image_url || "");
    setMaxTeamSize(String(c.max_team_size ?? 1));
    setSeatsRemaining(String(c.seats_remaining ?? c.total_seats ?? 100));
    setTagsText(Array.isArray(c.tags) ? c.tags.join(",") : c.tags || "");
    setStagesText(
      Array.isArray(c.stages)
        ? c.stages.join(",")
        : c.stages || "registration,submission,evaluation"
    );
    setPrizePool(c.prize_pool ? String(c.prize_pool) : "");

    if (c.start_date) setStartDate(new Date(c.start_date).toISOString().split("T")[0]);
    if (c.end_date) setEndDate(new Date(c.end_date).toISOString().split("T")[0]);

    if (c.registration_start_date)
      setRegistrationStartDate(new Date(c.registration_start_date).toISOString().split("T")[0]);
    if (c.registration_deadline)
      setRegistrationDeadline(new Date(c.registration_deadline).toISOString().split("T")[0]);
    if (c.results_date)
      setResultsDate(new Date(c.results_date).toISOString().split("T")[0]);

    if (c.eligibility_criteria && typeof c.eligibility_criteria === "object") {
      const ec = c.eligibility_criteria;
      setEligibility({
        minAge: ec.minAge ?? "",
        maxAge: ec.maxAge ?? "",
        education: ec.education ?? "",
        countriesAllowed: Array.isArray(ec.countriesAllowed)
          ? ec.countriesAllowed.join(",")
          : ec.countriesAllowed || "",
      });
    }

    if (c.contact_info && typeof c.contact_info === "object") {
      const ci = c.contact_info;
      setContact({
        email: ci.email ?? "",
        phone: ci.phone ?? "",
        website: ci.website ?? "",
        discord: ci.discord ?? "",
      });
    }

    if (Array.isArray(c.prizes_json) && c.prizes_json.length) {
      setPrizes(
        c.prizes_json.map((p) => ({ place: p.place ?? "", amount: String(p.amount ?? "") }))
      );
    }
    if (Array.isArray(c.resources_json) && c.resources_json.length) {
      setResources(
        c.resources_json.map((r) => ({ label: r.label ?? "", url: r.url ?? "" }))
      );
    }
    if (c.rules_markdown) setRulesMarkdown(c.rules_markdown);
    else if (c.rules) setRulesMarkdown(c.rules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // Admin guard
  useEffect(() => {
    if (!isAuthenticated || (user?.role || "").toLowerCase() !== "admin") {
      navigate("/main");
    }
  }, [isAuthenticated, user, navigate]);

  // helpers
  const addPrize = () => setPrizes((prev) => [...prev, { ...emptyPrize }]);
  const removePrize = (idx) =>
    setPrizes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const updatePrize = (idx, key, val) =>
    setPrizes((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: val } : p)));

  const addResource = () => setResources((prev) => [...prev, { ...emptyResource }]);
  const removeResource = (idx) =>
    setResources((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const updateResource = (idx, key, val) =>
    setResources((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));

  const tagsArray = useMemo(
    () => (tagsText.trim() ? tagsText.split(",").map((s) => s.trim()).filter(Boolean) : []),
    [tagsText]
  );
  const stagesArray = useMemo(
    () => (stagesText.trim() ? stagesText.split(",").map((s) => s.trim()).filter(Boolean) : []),
    [stagesText]
  );

  const validate = () => {
    if (!title.trim() || title.trim().length < 3)
      return setError("Title must be at least 3 characters"), false;
    if (!description.trim() || description.trim().length < 10)
      return setError("Description must be at least 10 characters"), false;

    if (!startDate || !endDate)
      return setError("Please select start and end dates"), false;
    if (new Date(endDate) <= new Date(startDate))
      return setError("End date must be after start date"), false;

    if (registrationStartDate && new Date(registrationStartDate) > new Date(startDate))
      return setError("Registration start must be on/before competition start"), false;

    if (registrationDeadline && new Date(registrationDeadline) > new Date(startDate))
      return setError("Registration deadline must be before competition start"), false;

    if (resultsDate && new Date(resultsDate) < new Date(endDate))
      return setError("Results date must be on/after competition end"), false;

    const m = parseInt(maxTeamSize, 10);
    if (!Number.isFinite(m) || m < 1)
      return setError("Max team size must be at least 1"), false;

    const s = parseInt(seatsRemaining, 10);
    if (!Number.isFinite(s) || s < 0)
      return setError("Seats available cannot be negative"), false;

    for (const r of resources) {
      if (r.url && !/^https?:\/\//i.test(r.url)) {
        return setError("Every Resource URL must start with http:// or https://"), false;
      }
    }
    if (bannerUrl && !/^https?:\/\//i.test(bannerUrl)) {
      return setError("Banner Image URL must start with http:// or https://"), false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sponsor: sponsor.trim() || null,
        location: locationField.trim() || null,
        banner_image_url: bannerUrl.trim() || null,

        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),

        registration_start_date: registrationStartDate
          ? new Date(registrationStartDate).toISOString()
          : null,
        registration_deadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : null,
        results_date: resultsDate ? new Date(resultsDate).toISOString() : null,

        max_team_size: parseInt(maxTeamSize, 10),
        seats_remaining: parseInt(seatsRemaining, 10),
        total_seats: parseInt(seatsRemaining, 10),

        tags: tagsArray,
        stages: stagesArray,

        eligibility_criteria: {
          minAge: eligibility.minAge ? Number(eligibility.minAge) : undefined,
          maxAge: eligibility.maxAge ? Number(eligibility.maxAge) : undefined,
          education: eligibility.education || undefined,
          countriesAllowed: eligibility.countriesAllowed
            ? eligibility.countriesAllowed.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        },

        contact_info: {
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          website: contact.website || undefined,
          discord: contact.discord || undefined,
        },

        prize_pool: prizePool ? Number(prizePool) : null,
        prizes_json: prizes
          .map((p) => ({
            place: p.place?.trim(),
            amount: p.amount ? Number(p.amount) : undefined,
          }))
          .filter((p) => p.place || (Number.isFinite(p.amount) && p.amount >= 0)),

        resources_json: resources
          .map((r) => ({ label: r.label?.trim(), url: r.url?.trim() }))
          .filter((r) => r.label || r.url),

        rules_markdown: rulesMarkdown?.trim() || null,
      };

      if (payload.eligibility_criteria && Object.values(payload.eligibility_criteria).every((v) => v === undefined)) {
        delete payload.eligibility_criteria;
      }
      if (payload.contact_info && Object.values(payload.contact_info).every((v) => v === undefined)) {
        delete payload.contact_info;
      }

      let response;
      if (isEdit) {
        const id = competitionToEdit.id || competitionToEdit._id;
        response = await apiService.makeRequest(`/competitions/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiService.makeRequest("/competitions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (response?.success) {
        navigate(-1, { state: { refreshCompetitions: true } });
      } else {
        setError(response?.message || `${isEdit ? "Update" : "Creation"} failed`);
      }
    } catch (err) {
      setError(err?.message || "Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

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
                  <h1 className="text-lg font-bold text-primary-text">
                    {isEdit ? "Edit Competition" : "Create Competition"}
                  </h1>
                  <p className="text-secondary-text text-sm">
                    {isEdit ? "Update competition details" : "Set up a new competition"}
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

          {/* Form */}
          <div className="bg-surface rounded-xl p-6 border border-border">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic */}
              <section className="space-y-6">
                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <FileText className="w-4 h-4 text-secondary-text" />
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter competition title"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the competition, expectations and deliverables…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-primary-text placeholder-secondary-text outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Sponsor
                    </label>
                    <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                      <ShieldCheck className="w-4 h-4 text-secondary-text" />
                      <input
                        value={sponsor}
                        onChange={(e) => setSponsor(e.target.value)}
                        placeholder="Competition sponsor"
                        className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Location
                    </label>
                    <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                      <MapPin className="w-4 h-4 text-secondary-text" />
                      <input
                        value={locationField}
                        onChange={(e) => setLocationField(e.target.value)}
                        placeholder="City / Online / Hybrid"
                        className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Banner Image URL
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <ImageIcon className="w-4 h-4 text-secondary-text" />
                    <input
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                </div>
              </section>

              {/* Capacity */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Max Team Size <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <Users className="w-4 h-4 text-secondary-text" />
                    <input
                      type="number"
                      min={1}
                      required
                      value={maxTeamSize}
                      onChange={(e) => setMaxTeamSize(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-primary-text h-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Seats Available <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <Hash className="w-4 h-4 text-secondary-text" />
                    <input
                      type="number"
                      min={0}
                      required
                      value={seatsRemaining}
                      onChange={(e) => setSeatsRemaining(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-primary-text h-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Prize Pool (optional)
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <Gift className="w-4 h-4 text-secondary-text" />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={prizePool}
                      onChange={(e) => setPrizePool(e.target.value)}
                      placeholder="100000"
                      className="flex-1 bg-transparent outline-none text-primary-text h-full"
                    />
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section>
                <h3 className="text-primary-text font-semibold mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Registration Opens
                    </label>
                    <input
                      type="date"
                      value={registrationStartDate}
                      onChange={(e) => setRegistrationStartDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Registration Closes
                    </label>
                    <input
                      type="date"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Results Date
                    </label>
                    <input
                      type="date"
                      value={resultsDate}
                      onChange={(e) => setResultsDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Tags & Stages */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Tags (comma-separated)
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <TagIcon className="w-4 h-4 text-secondary-text" />
                    <input
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder="e.g., ai,nlp,web-dev"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2 text-primary-text">
                    Stages (comma-separated)
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <Boxes className="w-4 h-4 text-secondary-text" />
                    <input
                      value={stagesText}
                      onChange={(e) => setStagesText(e.target.value)}
                      placeholder="registration,submission,evaluation,results"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                </div>
              </section>

              {/* Eligibility */}
              <section>
                <h3 className="text-primary-text font-semibold mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Eligibility
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Min Age
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={eligibility.minAge}
                      onChange={(e) =>
                        setEligibility((prev) => ({ ...prev, minAge: e.target.value }))
                      }
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2 text-primary-text">
                      Max Age
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={eligibility.maxAge}
                      onChange={(e) =>
                        setEligibility((prev) => ({ ...prev, maxAge: e.target.value }))
                      }
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-medium mb-2 text-primary-text">
                      Education
                    </label>
                    <input
                      value={eligibility.education}
                      onChange={(e) =>
                        setEligibility((prev) => ({ ...prev, education: e.target.value }))
                      }
                      placeholder="Any / College students / Open"
                      className="w-full h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block font-medium mb-2 text-primary-text">
                      Countries Allowed (comma-separated)
                    </label>
                    <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                      <Globe2 className="w-4 h-4 text-secondary-text" />
                      <input
                        value={eligibility.countriesAllowed}
                        onChange={(e) =>
                          setEligibility((prev) => ({
                            ...prev,
                            countriesAllowed: e.target.value,
                          }))
                        }
                        placeholder="e.g., US, IN, UK (leave empty for global)"
                        className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h3 className="text-primary-text font-semibold mb-3">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <Mail className="w-4 h-4 text-secondary-text" />
                    <input
                      value={contact.email}
                      onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <Phone className="w-4 h-4 text-secondary-text" />
                    <input
                      value={contact.phone}
                      onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <LinkIcon className="w-4 h-4 text-secondary-text" />
                    <input
                      value={contact.website}
                      onChange={(e) => setContact((p) => ({ ...p, website: e.target.value }))}
                      placeholder="Website URL"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                    <LinkIcon className="w-4 h-4 text-secondary-text" />
                    <input
                      value={contact.discord}
                      onChange={(e) => setContact((p) => ({ ...p, discord: e.target.value }))}
                      placeholder="Discord invite"
                      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                    />
                  </div>
                </div>
              </section>

              {/* Prizes */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-primary-text font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4" /> Prizes
                  </h3>
                  <button
                    type="button"
                    onClick={addPrize}
                    className="px-3 py-1.5 rounded-lg bg-surface hover:bg-border border border-border text-primary-text text-sm inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Prize
                  </button>
                </div>
                <div className="space-y-3">
                  {prizes.map((p, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                    >
                      <input
                        value={p.place}
                        onChange={(e) => updatePrize(idx, "place", e.target.value)}
                        placeholder="Place (e.g., 1st)"
                        className="h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={p.amount}
                        onChange={(e) => updatePrize(idx, "amount", e.target.value)}
                        placeholder="Amount (e.g., 35000)"
                        className="h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removePrize(idx)}
                          className="px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Resources */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-primary-text font-semibold flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Resources
                  </h3>
                  <button
                    type="button"
                    onClick={addResource}
                    className="px-3 py-1.5 rounded-lg bg-surface hover:bg-border border border-border text-primary-text text-sm inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Resource
                  </button>
                </div>
                <div className="space-y-3">
                  {resources.map((r, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                    >
                      <input
                        value={r.label}
                        onChange={(e) => updateResource(idx, "label", e.target.value)}
                        placeholder="Label (e.g., Dataset, Starter Notebook)"
                        className="h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                      />
                      <input
                        value={r.url}
                        onChange={(e) => updateResource(idx, "url", e.target.value)}
                        placeholder="https://..."
                        className="h-11 px-3 rounded-lg bg-background border border-border text-primary-text outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeResource(idx)}
                          className="px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rules */}
              <section>
                <h3 className="text-primary-text font-semibold mb-2">Rules (Markdown allowed)</h3>
                <textarea
                  rows={10}
                  placeholder="Write the competition rules here..."
                  value={rulesMarkdown}
                  onChange={(e) => setRulesMarkdown(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-primary-text placeholder-secondary-text outline-none resize-y"
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856"
                      />
                    </svg>
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit / Cancel */}
              <button
  type="submit"
  disabled={submitting}
  className="w-full h-11 rounded-lg bg-primary text-white font-semibold border border-primary/50 disabled:opacity-60"
>
  {submitting
    ? (isEdit ? "Saving Changes..." : "Creating Competition...")
    : (isEdit ? "Save Changes" : "Create Competition")}
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
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CreateCompetitionScreen;
