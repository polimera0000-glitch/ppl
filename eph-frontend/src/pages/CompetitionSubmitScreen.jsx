// import React, { useEffect, useRef, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { apiService } from '../services/apiService';
// import SidebarLayout from '../components/SidebarLayout';
// import CustomButton from '../components/CustomButton';

// const CompetitionSubmitScreen = () => {
//   const [title, setTitle] = useState('');
//   const [summary, setSummary] = useState('');
//   const [repoUrl, setRepoUrl] = useState('');
//   const [driveUrl, setDriveUrl] = useState('');
//   const [video, setVideo] = useState(null);
//   const [zip, setZip] = useState(null);
//   const [attachments, setAttachments] = useState([]);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   const videoInputRef = useRef(null);
//   const zipInputRef = useRef(null);
//   const attachmentInputRef = useRef(null);

//   const navigate = useNavigate();
//   const location = useLocation();
//   const { isAuthenticated } = useAuth();

//   const competitionId = location.state?.competitionId;
//   const competitionTitle = location.state?.competitionTitle || 'Submit Project';

//   useEffect(() => {
//     if (!isAuthenticated) navigate('/login');
//   }, [isAuthenticated, navigate]);

//   const formatFileSize = (bytes) => {
//     if (bytes < 1024) return `${bytes} B`;
//     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//     if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
//     return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
//   };

//   const handleVideoSelect = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (file.type.startsWith('video/')) {
//       setVideo(file);
//       setError(null);
//     } else {
//       setError('Please select a valid video file');
//       e.target.value = '';
//     }
//   };

//   const handleZipSelect = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (file.name.toLowerCase().endsWith('.zip')) {
//       setZip(file);
//     } else {
//       alert('Please select a ZIP file');
//       e.target.value = '';
//     }
//   };

//   const handleAttachmentSelect = (e) => {
//     const files = Array.from(e.target.files || []);
//     if (files.length) {
//       setAttachments((prev) => [...prev, ...files]);
//       e.target.value = '';
//     }
//   };

//   const removeAttachment = (index) => {
//     setAttachments((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!video) return setError('Please select a video file to submit');
//     if (!title.trim()) return setError('Project title is required');

//     setSubmitting(true);
//     setError(null);

//     try {
//       // 1) Upload the video (multipart)
//       const formData = new FormData();
//       formData.append('video', video);
//       formData.append('title', title.trim());
//       if (summary.trim()) formData.append('summary', summary.trim());
//       if (repoUrl.trim()) formData.append('repo_url', repoUrl.trim());
//       if (driveUrl.trim()) formData.append('drive_url', driveUrl.trim());
//       if (competitionId) formData.append('competition_id', competitionId);
//       if (zip) formData.append('zip', zip);
//       attachments.forEach((file) => formData.append('attachments', file));

//       const uploadResp = await apiService.makeRequest('/videos', {
//         method: 'POST',
//         body: formData,
//         headers: {}, // let the browser set multipart boundary
//       });

//       if (!uploadResp?.success) {
//         setError(uploadResp?.message || 'Upload failed');
//         setSubmitting(false);
//         return;
//       }

//       // 2) Create a submission record (non-blocking UX)
//       if (competitionId) {
//         const videoObj = uploadResp?.data?.video || {};
//         const videoUrl = videoObj?.url || null;
//         const metaAttachments = videoObj?.metadata?.attachments || [];
//         try {
//           await apiService.createSubmission(competitionId, {
//             title: title.trim(),
//             summary: summary.trim() || undefined,
//             repo_url: repoUrl.trim() || undefined,
//             drive_url: driveUrl.trim() || undefined,
//             video_url: videoUrl || undefined,
//             attachments: metaAttachments,
//           });
//         } catch (submissionErr) {
//           console.warn('createSubmission failed:', submissionErr?.message || submissionErr);
//         }
//       }

//       alert('Project submitted successfully!');
//       // 3) Redirect with state the list listens to
//       navigate('/main?tab=competitions', {
//         replace: true,
//         state: {
//           justSubmittedCompetitionId: competitionId || null,
//         },
//       });
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
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-lg font-bold">Submit Project</h1>
//                 <p className="text-white/70 text-sm">{competitionTitle}</p>
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
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Project Title */}
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
//                 </svg>
//                 <label className="font-medium">Project Title</label>
//                 <span className="text-red-400">*</span>
//               </div>
//               <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                 </svg>
//                 <input
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   placeholder="Enter your project title"
//                   className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                   required
//                 />
//               </div>
//             </div>

//             {/* Summary */}
//             <div>
//               <div className="flex items-center gap-2 mb-3">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.94-6.071-2.466C3.73 10.7 3.73 7.3 5.929 5.466A7.962 7.962 0 0112 3c2.34 0 4.5.94 6.071 2.466C20.27 7.3 20.27 10.7 18.071 12.534A7.962 7.962 0 0112 15z" />
//                 </svg>
//                 <label className="font-medium">Project Summary</label>
//                 <span className="text-white/60 text-sm">(Optional)</span>
//               </div>
//               <textarea
//                 placeholder="Describe your project, what it does, how it works, key features..."
//                 value={summary}
//                 onChange={(e) => setSummary(e.target.value)}
//                 rows={4}
//                 className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none"
//               />
//             </div>

//             {/* Repo URL */}
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
//                 </svg>
//                 <label className="font-medium">Repository URL</label>
//                 <span className="text-white/60 text-sm">(Optional)</span>
//               </div>
//               <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
//                 </svg>
//                 <input
//                   value={repoUrl}
//                   onChange={(e) => setRepoUrl(e.target.value)}
//                   placeholder="https://github.com/username/project"
//                   className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                 />
//               </div>
//             </div>

//             {/* Drive URL */}
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                 </svg>
//                 <label className="font-medium">Drive/Cloud URL</label>
//                 <span className="text-white/60 text-sm">(Optional)</span>
//               </div>
//               <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4m5.02-1.967A.96.96 0 0118 8l-8.982 8.982A.96.96 0 019 17z" />
//                 </svg>
//                 <input
//                   value={driveUrl}
//                   onChange={(e) => setDriveUrl(e.target.value)}
//                   placeholder="https://drive.google.com/..."
//                   className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                 />
//               </div>
//             </div>

//             {/* File Uploads */}
//             <div className="space-y-6">
//               {/* Video */}
//               <div className="bg-white/10 rounded-xl p-4 border border-white/20">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                     </svg>
//                     <span className="font-medium">Project Video</span>
//                     <span className="text-red-400">*</span>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => videoInputRef.current?.click()}
//                     className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
//                   >
//                     {video ? 'Change Video' : 'Select Video'}
//                   </button>
//                 </div>

//                 <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />

//                 {video ? (
//                   <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/10">
//                     <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 0 0 118 0z" />
//                     </svg>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium">{video.name}</p>
//                       <p className="text-white/60 text-xs">{formatFileSize(video.size)}</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <p className="text-white/70 text-sm">Demo video of your project (required)</p>
//                 )}
//               </div>

//               {/* ZIP */}
//               <div className="bg-white/10 rounded-xl p-4 border border-white/20">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4m5.02-1.967A.96.96 0 0118 8l-8.982 8.982A.96.96 0 019 17z" />
//                     </svg>
//                     <span className="font-medium">Project Archive</span>
//                     <span className="text-white/60 text-sm">(Optional)</span>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => zipInputRef.current?.click()}
//                     className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
//                   >
//                     {zip ? 'Change ZIP' : 'Select ZIP'}
//                   </button>
//                 </div>

//                 <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipSelect} className="hidden" />

//                 {zip ? (
//                   <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/10">
//                     <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4m5.02-1.967A.96.96 0 0118 8l-8.982 8.982A.96.96 0 019 17z" />
//                     </svg>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium">{zip.name}</p>
//                       <p className="text-white/60 text-xs">{formatFileSize(zip.size)}</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <p className="text-white/70 text-sm">Compressed archive of source code or additional files</p>
//                 )}
//               </div>

//               {/* Attachments */}
//               <div className="bg-white/10 rounded-xl p-4 border border-white/20">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
//                     </svg>
//                     <span className="font-medium">Attachments ({attachments.length})</span>
//                     <span className="text-white/60 text-sm">(Optional)</span>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => attachmentInputRef.current?.click()}
//                     className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
//                   >
//                     Add Files
//                   </button>
//                 </div>

//                 <input
//                   ref={attachmentInputRef}
//                   type="file"
//                   multiple
//                   onChange={handleAttachmentSelect}
//                   className="hidden"
//                 />

//                 {attachments.length > 0 ? (
//                   <div className="space-y-2">
//                     {attachments.map((file, index) => (
//                       <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/10">
//                         <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.94-6.071-2.466C3.73 10.7 3.73 7.3 5.929 5.466A7.962 7.962 0 0112 3c2.34 0 4.5.94 6.071 2.466C20.27 7.3 20.27 10.7 18.071 12.534A7.962 7.962 0 0112 15z" />
//                         </svg>
//                         <div className="flex-1">
//                           <p className="text-sm font-medium truncate">{file.name}</p>
//                           <p className="text-white/60 text-xs">{formatFileSize(file.size)}</p>
//                         </div>
//                         <button
//                           type="button"
//                           onClick={() => removeAttachment(index)}
//                           className="p-1 text-white/60 hover:text-white"
//                           aria-label="Remove attachment"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-white/70 text-sm">Screenshots, documentation, or other supporting files</p>
//                 )}
//               </div>
//             </div>

//             {/* Error */}
//             {error && (
//               <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
//                 <div className="flex items-center gap-3">
//                   <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                   </svg>
//                   <p className="text-red-400">{error}</p>
//                 </div>
//               </div>
//             )}

//             {/* Submit */}
//             <CustomButton
//               type="submit"
//               text={submitting ? 'Submitting Project...' : 'Submit Project'}
//               enabled={!submitting}
//               loading={submitting}
//             />
//           </form>
//         </div>
//       </div>
//     </SidebarLayout>
//   );
// };

// export default CompetitionSubmitScreen;

// src/pages/CompetitionSubmitScreen.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import SidebarLayout from '../components/SidebarLayout';

import {
  UploadCloud,
  X,
  FileText,
  Link as LinkIcon,
  Film,
  Archive,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Hash
} from 'lucide-react';

const CompetitionSubmitScreen = () => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [zip, setZip] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const videoInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const competitionId = location.state?.competitionId;
  const competitionTitle = location.state?.competitionTitle || 'Submit Project';

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      setVideo(file);
      setError(null);
    } else {
      setError('Please select a valid video file');
      e.target.value = '';
    }
  };

  const handleZipSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.zip')) {
      setZip(file);
    } else {
      setError('Please select a ZIP file');
      e.target.value = '';
    }
  };

  const handleAttachmentSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setAttachments((prev) => [...prev, ...files]);
      e.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!video) return setError('Please select a video file to submit');
    if (!title.trim()) return setError('Project title is required');

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', video);
      formData.append('title', title.trim());
      if (summary.trim()) formData.append('summary', summary.trim());
      if (repoUrl.trim()) formData.append('repo_url', repoUrl.trim());
      if (driveUrl.trim()) formData.append('drive_url', driveUrl.trim());
      if (competitionId) formData.append('competition_id', competitionId);
      if (zip) formData.append('zip', zip);
      attachments.forEach((file) => formData.append('attachments', file));

      const uploadResp = await apiService.makeRequest('/videos', {
        method: 'POST',
        body: formData,
        headers: {},
      });

      if (!uploadResp?.success) {
        setError(uploadResp?.message || 'Upload failed');
        setSubmitting(false);
        return;
      }

      if (competitionId) {
        const videoObj = uploadResp?.data?.video || {};
        const videoUrl = videoObj?.url || null;
        const metaAttachments = videoObj?.metadata?.attachments || [];
        try {
          await apiService.createSubmission(competitionId, {
            title: title.trim(),
            summary: summary.trim() || undefined,
            repo_url: repoUrl.trim() || undefined,
            drive_url: driveUrl.trim() || undefined,
            video_url: videoUrl || undefined,
            attachments: metaAttachments,
          });
        } catch (submissionErr) {
          console.warn('createSubmission failed:', submissionErr?.message || submissionErr);
        }
      }

      navigate('/main?tab=competitions', {
        replace: true,
        state: { justSubmittedCompetitionId: competitionId || null },
      });
    } catch (err) {
      setError(err?.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      {/* stop horizontal scroll on mobile */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="bg-surface rounded-xl p-4 border border-border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5 text-primary-text" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-primary-text truncate">Submit Project</h1>
                  <p className="text-secondary-text text-sm truncate">{competitionTitle}</p>
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

          {/* Optional quick stats */}
          {location.state?.competitionMeta && (
            <div className="bg-surface rounded-xl p-4 border border-border mb-6">
              <div className="flex flex-wrap gap-3">
                {location.state.competitionMeta.start_date && location.state.competitionMeta.end_date && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <CalendarDays className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      {new Date(location.state.competitionMeta.start_date).toLocaleDateString()} — {new Date(location.state.competitionMeta.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {typeof location.state.competitionMeta.seats_remaining === 'number' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <Hash className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      Seats: {location.state.competitionMeta.seats_remaining}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-surface rounded-xl p-4 sm:p-6 border border-border">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <section className="space-y-2">
                <label className="block font-medium text-primary-text">
                  Project Title <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                  <FileText className="w-4 h-4 text-secondary-text" />
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your project title"
                    className="flex-1 min-w-0 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full"
                  />
                </div>
              </section>

              {/* Summary */}
              <section className="space-y-2">
                <label className="block font-medium text-primary-text">
                  Project Summary <span className="text-secondary-text text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your project, what it does, how it works, key features…"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-primary-text placeholder-secondary-text outline-none resize-none"
                />
              </section>

              {/* Repo URL */}
              <section className="space-y-2">
                <label className="block font-medium text-primary-text">
                  Repository URL <span className="text-secondary-text text-xs font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                  <LinkIcon className="w-4 h-4 text-secondary-text" />
                  <input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="flex-1 min-w-0 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full break-all"
                  />
                </div>
              </section>

              {/* Drive URL */}
              <section className="space-y-2">
                <label className="block font-medium text-primary-text">
                  Drive / Cloud URL <span className="text-secondary-text text-xs font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                  <LinkIcon className="w-4 h-4 text-secondary-text" />
                  <input
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 min-w-0 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full break-all"
                  />
                </div>
              </section>

              {/* Uploads */}
              <section className="space-y-6">
                {/* Video (required) */}
                <div className="bg-background rounded-xl p-4 border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Film className="w-5 h-5 text-secondary-text shrink-0" />
                      <span className="font-medium text-primary-text">Project Video</span>
                      <span className="text-red-400">*</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-surface hover:bg-border border border-border text-primary-text text-sm"
                    >
                      {video ? 'Change Video' : 'Select Video'}
                    </button>
                  </div>

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />

                  {video ? (
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-text truncate">{video.name}</p>
                        <p className="text-secondary-text text-xs">{formatFileSize(video.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary-text text-sm">
                      Upload a short demo video of your project (required)
                    </p>
                  )}
                </div>

                {/* ZIP (optional) */}
                <div className="bg-background rounded-xl p-4 border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Archive className="w-5 h-5 text-secondary-text shrink-0" />
                      <span className="font-medium text-primary-text">Project Archive</span>
                      <span className="text-secondary-text text-sm">(Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => zipInputRef.current?.click()}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-surface hover:bg-border border border-border text-primary-text text-sm"
                    >
                      {zip ? 'Change ZIP' : 'Select ZIP'}
                    </button>
                  </div>

                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleZipSelect}
                    className="hidden"
                  />

                  {zip ? (
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-text truncate">{zip.name}</p>
                        <p className="text-secondary-text text-xs">{formatFileSize(zip.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary-text text-sm">
                      Compressed archive of source code or additional files
                    </p>
                  )}
                </div>

                {/* Attachments (optional) */}
                <div className="bg-background rounded-xl p-4 border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-5 h-5 text-secondary-text shrink-0" />
                      <span className="font-medium text-primary-text">Attachments ({attachments.length})</span>
                      <span className="text-secondary-text text-sm">(Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-surface hover:bg-border border border-border text-primary-text text-sm"
                    >
                      Add Files
                    </button>
                  </div>

                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    onChange={handleAttachmentSelect}
                    className="hidden"
                  />

                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border min-w-0"
                        >
                          <FileText className="w-4 h-4 text-secondary-text shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary-text truncate">{file.name}</p>
                            <p className="text-secondary-text text-xs">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="p-1 text-secondary-text hover:text-primary-text shrink-0"
                            aria-label="Remove attachment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-text text-sm">
                      Screenshots, documentation, or other supporting files
                    </p>
                  )}
                </div>
              </section>

              {/* Error banner */}
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <p className="text-primary-text break-words">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-primary text-white font-semibold border border-primary/50 disabled:opacity-60"
              >
                {submitting ? 'Submitting Project…' : 'Submit Project'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-secondary-text hover:text-primary-text transition-colors text-sm inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
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

export default CompetitionSubmitScreen;
