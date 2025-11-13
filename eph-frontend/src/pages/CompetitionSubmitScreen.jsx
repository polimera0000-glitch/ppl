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
