import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import SidebarLayout from '../components/SidebarLayout';
import Toast from '../components/Toast';

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

  const [toast, setToast] = useState(null); // {type, message}

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // NOTE: your router passes competition id via state.competitionId; keep var name as "id" to match apiService
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
        // in case backend returns { competition }
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

  const addMemberEmail = async () => {
    const raw = memberEmail;
    const email = normalizeEmail(raw);

    if (!email) return showToast('error', 'Please enter an email address');
    if (!emailFormatOk(email)) return showToast('error', 'Please enter a valid email address');
    if (!emailDomainOk(email))
      return showToast('error', 'Only official emails allowed: gmail.com, outlook.com, yahoo.com');

    if (memberEmails.includes(email)) return showToast('error', 'Email already added');

    const maxTeamSize = competition?.max_team_size || 1;
    if (memberEmails.length + 1 >= maxTeamSize) {
      return showToast('error', `Maximum team size is ${maxTeamSize}`);
    }

    // DB presence check
    try {
      const res = await apiService.checkUserExists(email);
      const exists = !!(res?.data?.exists ?? res?.exists);
      if (!exists) {
        return showToast('error', 'This email is not registered on the platform. Ask the member to sign up first.');
      }
    } catch {
      return showToast('error', 'Could not verify user. Please try again.');
    }

    setMemberEmails((prev) => [...prev, email]);
    setMemberEmail('');
    showToast('success', 'Member added successfully');
  };

  const removeMemberEmail = (index) => {
    setMemberEmails((prev) => prev.filter((_, i) => i !== index));
    showToast('info', 'Member removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (registrationType === 'team' && !teamName.trim()) {
      return showToast('error', 'Team name is required for team registration');
    }
    if (competition?.seats_remaining <= 0) {
      return showToast('error', 'No seats remaining for this competition');
    }

    // domain + format check for all members
    if (registrationType === 'team' && memberEmails.length > 0) {
      for (const em of memberEmails) {
        if (!emailFormatOk(em)) {
          return showToast('error', `Invalid email: ${em}`);
        }
        if (!emailDomainOk(em)) {
          return showToast('error', `Only official emails allowed: gmail.com, outlook.com, yahoo.com (found: ${em})`);
        }
      }

      // bulk DB existence check
      try {
        const bulk = await apiService.checkUsersExistBulk(memberEmails);
        const missing = bulk?.data?.missing || bulk?.missing || [];
        if (missing.length > 0) {
          return showToast('error', `These emails are not registered yet: ${missing.join(', ')}`);
        }
      } catch {
        return showToast('error', 'Could not verify team members. Please try again.');
      }
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

      const response = await apiService.registerForCompetition(id, payload);

      if (response?.success) {
        showToast('success', 'Registration submitted!');
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
              {/* Header */}
              <div className="bg-surface rounded-xl p-4 border border-border mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary-text" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-lg font-bold text-primary-text truncate">
                        Register for Competition
                      </h1>
                      <p className="text-secondary-text text-sm truncate">
                        {competition?.title}
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

              {/* Competition Info */}
              <div className="bg-surface rounded-xl p-4 border border-border mb-6">
                <p className="text-secondary-text mb-4 break-words">
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

              {/* Form */}
              <div className="bg-surface rounded-xl p-4 sm:p-6 border border-border">
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
                      <p className="text-xs text-secondary-text">
                        Allowed domains: gmail.com, outlook.com, yahoo.com. Members must already have an account.
                      </p>

                      {/* STACK on mobile; row on ≥sm */}
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3">
                        <div className="min-w-0 inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-background border border-border">
                          <Users className="w-4 h-4 text-secondary-text shrink-0" />
                          <input
                            type="email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            placeholder="Add member email address"
                            className="flex-1 min-w-0 bg-transparent outline-none text-primary-text placeholder-secondary-text h-full break-words"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={addMemberEmail}
                          className="w-full sm:w-auto px-3 h-11 rounded-lg bg-surface hover:bg-border text-primary-text font-medium border border-border inline-flex items-center justify-center gap-1"
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
                                className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg max-w-full"
                              >
                                <span className="text-secondary-text text-sm break-all">{email}</span>
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

                  {/* Submit */}
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

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </SidebarLayout>
  );
};

export default CompetitionRegisterScreen;
