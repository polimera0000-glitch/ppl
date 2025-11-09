// src/pages/ViewCompetitionScreen.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { apiService } from '../services/apiService';

const ViewCompetitionScreen = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [competition, setCompetition] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.makeRequest(`/competitions/${id}`);
        // controller returns { success, data: { competition } }
        const comp = res?.data?.competition || res?.competition || null;
        if (isMounted) setCompetition(comp);
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to load competition');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  const dateRange = useMemo(() => {
    if (!competition) return '';
    const start = competition.start_date ? new Date(competition.start_date).toLocaleDateString() : '—';
    const end   = competition.end_date   ? new Date(competition.end_date).toLocaleDateString()   : '—';
    return `${start} – ${end}`;
  }, [competition]);

  if (loading) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !competition) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="p-6">
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-400">{error || 'Competition not found'}</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="p-6 space-y-6">
        {/* Header (pure display, no buttons) */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
              {competition.banner_image_url ? (
                <img src={competition.banner_image_url} alt={competition.title} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 8h14l-1 8H6L5 8zm0 0L4 6m16 2l1-2m-7 13h10" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{competition.title}</h1>
              {competition.sponsor && (
                <p className="text-white/70 text-sm">Sponsor: {competition.sponsor}</p>
              )}
              {(competition.start_date || competition.end_date) && (
                <p className="text-white/60 text-sm mt-1">{dateRange}</p>
              )}
              {competition.posted_by?.name && (
                <p className="text-white/60 text-sm mt-1">Posted by: {competition.posted_by.name}</p>
              )}
              {competition.location && (
                <p className="text-white/60 text-sm mt-1">Location: {competition.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {competition.description && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-white/80 whitespace-pre-wrap">{competition.description}</p>
          </div>
        )}

        {/* Timeline Details */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-semibold mb-3">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/80">
            <div>
              <p className="text-sm text-white/60">Registration Opens</p>
              <p className="font-medium">{competition.registration_start_date ? new Date(competition.registration_start_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Registration Closes</p>
              <p className="font-medium">{competition.registration_deadline ? new Date(competition.registration_deadline).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Competition Dates</p>
              <p className="font-medium">{(competition.start_date || competition.end_date) ? `${competition.start_date ? new Date(competition.start_date).toLocaleDateString() : '—'} – ${competition.end_date ? new Date(competition.end_date).toLocaleDateString() : '—'}` : '—'}</p>
            </div>

            <div>
              <p className="text-sm text-white/60">Abstract Submission Start</p>
              <p className="font-medium">{competition.abstract_submission_start_date ? new Date(competition.abstract_submission_start_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Abstract Submission End</p>
              <p className="font-medium">{competition.abstract_submission_end_date ? new Date(competition.abstract_submission_end_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Shortlisted Candidates</p>
              <p className="font-medium">{competition.shortlisted_candidates_date ? new Date(competition.shortlisted_candidates_date).toLocaleDateString() : '—'}</p>
            </div>

            <div>
              <p className="text-sm text-white/60">Prototype Submission Start</p>
              <p className="font-medium">{competition.prototype_submission_start_date ? new Date(competition.prototype_submission_start_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Prototype Submission End</p>
              <p className="font-medium">{competition.prototype_submission_end_date ? new Date(competition.prototype_submission_end_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Pitch Deck Submission Start</p>
              <p className="font-medium">{competition.pitch_deck_start_date ? new Date(competition.pitch_deck_start_date).toLocaleDateString() : '—'}</p>
            </div>

            <div>
              <p className="text-sm text-white/60">Pitch Deck Submission End</p>
              <p className="font-medium">{competition.pitch_deck_end_date ? new Date(competition.pitch_deck_end_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Final Round Date</p>
              <p className="font-medium">{competition.final_round_date ? new Date(competition.final_round_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Results Announcement</p>
              <p className="font-medium">{competition.results_date ? new Date(competition.results_date).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>

        {/* Stats (display-only) */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-white/60 text-sm">Registered</p>
            <p className="text-white text-2xl font-bold">
              {competition.stats?.totalRegistrations ?? 0}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-white/60 text-sm">Submissions</p>
            <p className="text-white text-2xl font-bold">
              {competition.stats?.totalSubmissions ?? 0}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-white/60 text-sm">Seats Left</p>
            <p className="text-white text-2xl font-bold">
              {competition.seats_remaining ?? '—'}
            </p>
          </div>
        </div>

        {/* Tags & Stages */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="font-semibold mb-2">Tags</h3>
            {Array.isArray(competition.tags) && competition.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {competition.tags.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md">#{t}</span>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-sm">—</p>
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="font-semibold mb-2">Stages</h3>
            {Array.isArray(competition.stages) && competition.stages.length > 0 ? (
              <ol className="list-decimal list-inside space-y-1 text-white/80">
                {competition.stages.map((s, i) => (
                  <li key={i}>{typeof s === 'string' ? s : s?.name || JSON.stringify(s)}</li>
                ))}
              </ol>
            ) : (
              <p className="text-white/60 text-sm">—</p>
            )}
          </div>
        </div>

        {/* Eligibility & Contact */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="font-semibold mb-2">Eligibility</h3>
            {competition.eligibility_criteria && Object.keys(competition.eligibility_criteria).length > 0 ? (
              <pre className="text-white/80 text-sm whitespace-pre-wrap">
                {JSON.stringify(competition.eligibility_criteria, null, 2)}
              </pre>
            ) : (
              <p className="text-white/60 text-sm">—</p>
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="font-semibold mb-2">Contact</h3>
            {competition.contact_info && Object.keys(competition.contact_info).length > 0 ? (
              <pre className="text-white/80 text-sm whitespace-pre-wrap">
                {JSON.stringify(competition.contact_info, null, 2)}
              </pre>
            ) : (
              <p className="text-white/60 text-sm">—</p>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ViewCompetitionScreen;
