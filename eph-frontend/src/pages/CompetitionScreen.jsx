// src/pages/CompetitionScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

// ✅ Lucide icons
import {
  CalendarDays,
  Users,
  Tag,
  User,
  Eye,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  Clock3,
  Activity,
  Award,
  Star,
  ListOrdered,
  FileCheck,
  Rocket,
  Plus,
  X,
} from 'lucide-react';

const FILTERS = {
  ALL: 'all',
  ONGOING: 'ongoing',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  MY_COMPETITIONS: 'my_competitions'
};

// --- Persistence keys for optimistic flags ---
const LS_REG = 'ppl:optimistic:registered';
const LS_SUB = 'ppl:optimistic:submitted';

const loadSet = (key) => {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    return new Set((arr || []).map(String));
  } catch {
    return new Set();
  }
};
const saveSet = (key, set) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
};

// Normalize any backend shape into booleans we care about
const normalizeUserFlags = (c) => {
  const registeredServer = Boolean(
    c.user_registered ||
    c.user?.registered ||
    c.registration?.is_registered ||
    c.registration_status === 'registered' ||
    c.user_has_registration
  );

  const submittedServer = Boolean(
    c.user_submitted ||
    c.submission?.exists ||
    c.user_has_submission
  );

  return { registeredServer, submittedServer };
};

// Updated badge styles with blue theme for light/dark mode
const BADGE = {
  // Status badges
  live: 'bg-emerald-500 text-white',
  soon: 'bg-blue-500 text-white',
  done: 'bg-slate-500 text-white',

  // Participation badges
  registered: 'bg-blue-600 text-white',
  submitted: 'bg-green-500 text-white',
  notRegistered: 'bg-orange-500 text-white',
  notSubmitted: 'bg-purple-500 text-white',
  participating: 'bg-indigo-600 text-white',

  // Result badges
  waiting: 'bg-amber-500 text-white',
  qualified: 'bg-green-500 text-white',
  disqualified: 'bg-red-500 text-white',
  finalist: 'bg-violet-500 text-white',
  winner: 'bg-yellow-500 text-white',
  neutral: 'bg-gray-500 text-white',
};

// Updated button styles with blue theme
const BTN = {
  submit: 'px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 active:scale-95',
  register: 'px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-200 active:scale-95',
  viewResults: 'px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 active:scale-95',
};

const CompetitionScreen = () => {
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [myOnly, setMyOnly] = useState(false);
  const [counts, setCounts] = useState({ ongoing: 0, upcoming: 0, completed: 0, my: 0, my_competitions: 0 });
  const [deletingId, setDeletingId] = useState(null);

  // Optimistic flags that survive refetch & reload
  const [optimisticRegistered, setOptimisticRegistered] = useState(() => loadSet(LS_REG));
  const [optimisticSubmitted, setOptimisticSubmitted] = useState(() => loadSet(LS_SUB));

  // Modal state (kept for parity; not critical for student actions)
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const getId = (c) => c.id || c._id;
  const formatDate = (d, withTime = false) => {
    if (!d) return '—';
    const dt = new Date(d);
    return withTime ? dt.toLocaleString() : dt.toLocaleDateString();
  };

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchText.trim().toLowerCase()), 400);
    return () => clearTimeout(id);
  }, [searchText]);

  const computeStatus = useCallback((competition) => {
    const start = competition.start_date ? new Date(competition.start_date) : null;
    const end = competition.end_date ? new Date(competition.end_date) : null;
    const now = new Date();
    if (start && start > now) return 'upcoming';
    if (start && end && start <= now && end > now) return 'ongoing';
    if (end && end < now) return 'completed';
    return 'upcoming';
  }, []);

  const isMine = useCallback((competition) => {
    if (!user) return false;
    const postedBy = competition.posted_by || competition.createdBy;
    const postedId = postedBy?.id ?? postedBy?._id;
    const userId = user.id ?? user._id;
    return String(postedId || '') === String(userId || '');
  }, [user]);

  const isMyCompetition = useCallback((competition) => {
    return Boolean(competition.user_registered) || Boolean(competition.user_submitted);
  }, []);

  const fetchCompetitions = useCallback(async (forceRefresh = false) => {
    if (!refreshing) {
      setLoading(!forceRefresh);
      setRefreshing(forceRefresh);
      setError(null);
    }
    try {
      const response = await apiService.listCompetitions();
      let allComps = response?.data?.competitions || response?.competitions || [];

      // Merge normalized server flags + optimistic flags
      allComps = allComps.map((c) => {
        const cid = String(getId(c));
        const { registeredServer, submittedServer } = normalizeUserFlags(c);

        const submitted = submittedServer || optimisticSubmitted.has(cid);
        const registered = registeredServer || optimisticRegistered.has(cid) || submitted;

        return {
          ...c,
          user_submitted: submitted,
          user_registered: registered,
        };
      });

      const newCounts = { ongoing: 0, upcoming: 0, completed: 0, my: 0, my_competitions: 0 };
      for (const comp of allComps) {
        const s = computeStatus(comp);
        if (newCounts[s] !== undefined) newCounts[s] += 1;
        if (isMine(comp)) newCounts.my += 1;
        if (isMyCompetition(comp)) newCounts.my_competitions += 1;
      }
      setCounts(newCounts);
      setAllCompetitions(allComps);
    } catch (err) {
      setError(err.message || 'Failed to load competitions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [computeStatus, isMine, isMyCompetition, refreshing, optimisticRegistered, optimisticSubmitted]);

  useEffect(() => { fetchCompetitions(); }, [fetchCompetitions]);

  // If we just registered, flip it locally + persist + refetch once
  useEffect(() => {
    const cid = location.state?.justRegisteredCompetitionId;
    if (!cid) return;

    const cidStr = String(cid);
    setOptimisticRegistered(prev => {
      const next = new Set(prev); next.add(cidStr); saveSet(LS_REG, next); return next;
    });
    setAllCompetitions(prev =>
      prev.map(c => (String(getId(c)) === cidStr ? { ...c, user_registered: true } : c))
    );

    fetchCompetitions(true);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.state, fetchCompetitions, navigate, location.pathname, location.search]);

  // If we just submitted, flip it locally + persist + refetch once
  useEffect(() => {
    const cid = location.state?.justSubmittedCompetitionId;
    if (!cid) return;

    const cidStr = String(cid);
    setOptimisticSubmitted(prev => {
      const next = new Set(prev); next.add(cidStr); saveSet(LS_SUB, next); return next;
    });
    setOptimisticRegistered(prev => {
      const next = new Set(prev); next.add(cidStr); saveSet(LS_REG, next); return next;
    });
    setAllCompetitions(prev =>
      prev.map(c =>
        String(getId(c)) === cidStr ? { ...c, user_submitted: true, user_registered: true } : c
      )
    );

    fetchCompetitions(true);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.state, fetchCompetitions, navigate, location.pathname, location.search]);

  // Navigation for user flows
  const goToRegister = (competition) => {
    if (!isAuthenticated) return navigate('/login');
    navigate('/competition/register', { state: { competitionId: getId(competition) } });
  };

  const goToSubmit = (competition) => {
    if (!isAuthenticated) return navigate('/login');
    navigate('/competition/submit', {
      state: { competitionId: getId(competition), competitionTitle: competition.title },
    });
  };

  // Admin view submissions navigation
  const goToAdminSubmissions = (competition) => {
    const id = getId(competition);
    navigate(`/admin/competition/${id}/submissions`, {
      state: { competitionId: id, competitionTitle: competition.title },
    });
  };

  const handleEdit = (competition) => {
    const id = getId(competition);
    navigate(`/competition/${id}/edit`);
  };

  const handleDelete = async (competition) => {
    const id = getId(competition);
    if (!id) return;
    try {
      setDeletingId(id);
      await apiService.deleteCompetition(id);
      await fetchCompetitions(true);
    } catch (e) {
      alert(e.message || 'Failed to delete competition');
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Status chip icons & classes (semantic + color)
  const getStatusPill = useMemo(() => ({
    ongoing: { icon: <Activity className="w-4 h-4" />, label: 'Live', chipClass: BADGE.live },
    upcoming: { icon: <Clock3 className="w-4 h-4" />, label: 'Soon', chipClass: BADGE.soon },
    completed: { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Done', chipClass: BADGE.done },
  }), []);

  // Updated MetricButton with blue theme
  const MetricButton = ({ label, count, selected, onClick, Icon, palette }) => {
    const colors = {
      green: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        ring: 'ring-emerald-500/50',
        hover: 'hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30'
      },
      blue: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        ring: 'ring-blue-500/50',
        hover: 'hover:bg-blue-500/20 dark:hover:bg-blue-500/30'
      },
      amber: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        ring: 'ring-amber-500/50',
        hover: 'hover:bg-amber-500/20 dark:hover:bg-amber-500/30'
      },
      gray: {
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-600 dark:text-slate-400',
        ring: 'ring-slate-500/50',
        hover: 'hover:bg-slate-500/20 dark:hover:bg-slate-500/30'
      },
    }[palette];

    return (
      <button
        onClick={onClick}
        className={`
          group relative px-4 py-3 rounded-xl transition-all duration-200 border-2 touch-manipulation
          ${selected 
            ? `bg-white dark:bg-slate-800 border-blue-500 ring-2 ${colors.ring} shadow-lg` 
            : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${colors.hover}`
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${selected ? 'scale-110' : 'group-hover:scale-105'}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div className="text-left min-w-0">
            <div className="text-slate-900 dark:text-white font-bold text-lg leading-tight">{count}</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">{label}</div>
          </div>
        </div>
      </button>
    );
  };

  // Filtered list
  const competitions = useMemo(() => {
    let arr = allCompetitions;
    if (activeFilter === FILTERS.MY_COMPETITIONS) {
      arr = arr.filter(isMyCompetition);
    } else if (activeFilter !== FILTERS.ALL) {
      arr = arr.filter((c) => computeStatus(c) === activeFilter);
    }
    if (isAdmin && myOnly) arr = arr.filter(isMine);
    if (debouncedQuery) {
      arr = arr.filter((c) =>
        (c.title || '').toLowerCase().includes(debouncedQuery) ||
        (c.description || '').toLowerCase().includes(debouncedQuery) ||
        (c.sponsor || '').toLowerCase().includes(debouncedQuery) ||
        (Array.isArray(c.tags) ? c.tags : []).some((t) => (t || '').toLowerCase().includes(debouncedQuery))
      );
    }
    return arr;
  }, [allCompetitions, activeFilter, myOnly, isAdmin, isMine, isMyCompetition, computeStatus, debouncedQuery]);

  // ---- Helpers for result status ----
  const normalize = (s) => String(s || '').trim().toLowerCase();
  const resultBadgeFor = (status) => {
    switch (normalize(status)) {
      case 'winner': return { label: 'Winner', cls: BADGE.winner };
      case 'finalist': return { label: 'Finalist', cls: BADGE.finalist };
      case 'qualified': return { label: 'Qualified', cls: BADGE.qualified };
      case 'disqualified': return { label: 'Disqualified', cls: BADGE.disqualified };
      case 'participant': return { label: 'Participant', cls: BADGE.neutral };
      default: return { label: 'Result', cls: BADGE.neutral };
    }
  };

  // ---- Card (clickable -> details) ----
  const CompetitionCard = ({ competition }) => {
    const status = computeStatus(competition);
    const pill = getStatusPill[status] || getStatusPill.upcoming;
    const userRegistered = Boolean(competition.user_registered);
    const userSubmitted = Boolean(competition.user_submitted);
    const resultsPublished = Boolean(
      competition.results_published || competition.result_published || competition.resultsPublished || competition.has_results || competition.hasResults
    );
    const userResultStatus = competition.user_result_status || competition.userResultStatus || null;

    const cid = getId(competition);
    const handleCardOpen = () => navigate(`/competition/${cid}`);
    const stop = (e) => e.stopPropagation();

    const myStatus = (() => {
      if (activeFilter === FILTERS.MY_COMPETITIONS) {
        if (userSubmitted) return { text: 'Submitted', class: BADGE.submitted, Icon: FileCheck };
        if (userRegistered) return { text: 'Registered', class: BADGE.registered, Icon: CheckCircle2 };
        return { text: 'Participating', class: BADGE.participating, Icon: Rocket };
      }
      return null;
    })();

    // --- Student/User actions ---
    const renderStudentActions = () => {
      if (status === 'upcoming') {
        return userRegistered ? (
          <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${BADGE.registered}`}>
            <CheckCircle2 className="w-4 h-4" />
            Registered
          </div>
        ) : (
          <button onClick={(e) => { stop(e); goToRegister(competition); }} className={BTN.register}>
            Register Now
          </button>
        );
      }

      if (status === 'ongoing') {
        if (userSubmitted) {
          return <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${BADGE.submitted}`}>
            <CheckCircle2 className="w-4 h-4" />
            Submitted
          </div>;
        }
        return userRegistered
          ? <button onClick={(e) => { stop(e); goToSubmit(competition); }} className={BTN.submit}>Submit Project</button>
          : <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${BADGE.notRegistered}`}>Not Registered</div>;
      }

      // completed
      if (!userRegistered) {
        // Completed without registration → show nothing
        return null;
      }
      if (!userSubmitted) {
        // Completed without submission
        return <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${BADGE.notSubmitted}`}>Not Submitted</div>;
      }
      // Completed with submission
      if (!resultsPublished) {
        return <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${BADGE.waiting}`}>
          <Clock3 className="w-4 h-4" />
          Awaiting Results
        </div>;
      }
      const { label, cls } = resultBadgeFor(userResultStatus);
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${cls}`}>{label}</div>
          <button
            onClick={(e) => { stop(e); navigate(`/competition/${cid}/leaderboard`); }}
            className={BTN.viewResults}
            title="View Results"
          >
            View Results
          </button>
        </div>
      );
    };

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardOpen}
        onKeyUp={(e) => (e.key === 'Enter' ? handleCardOpen() : null)}
        className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-manipulation"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full aspect-[16/9] sm:w-24 sm:h-24 sm:aspect-auto rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-slate-100 dark:border-slate-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
            {competition.banner_image_url ? (
              <img
                src={competition.banner_image_url}
                alt={competition.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Award className="w-10 h-10 text-blue-400 dark:text-blue-500" />
            )}
          </div>

          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {competition.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <div className={`px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-sm font-semibold ${pill.chipClass}`}>
                  {pill.icon}
                  {pill.label}
                </div>
                {myStatus && (
                  <div className={`px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-sm font-semibold ${myStatus.class}`}>
                    <myStatus.Icon className="w-4 h-4" />
                    {myStatus.text}
                  </div>
                )}
              </div>
            </div>

            {(competition.start_date || competition.end_date) && (
              <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-400 text-sm">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                <span className="font-medium">
                  {competition.start_date ? new Date(competition.start_date).toLocaleDateString() : '—'} – {competition.end_date ? new Date(competition.end_date).toLocaleDateString() : '—'}
                </span>
              </div>
            )}

            <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 break-words leading-relaxed">
              {competition.description || competition.subtitle}
            </p>

            {Array.isArray(competition.tags) && competition.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {competition.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium rounded-full inline-flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
                {competition.tags.length > 3 && (
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">+{competition.tags.length - 3} more</span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium">{competition.stats?.totalRegistrations || 0} registered</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ListOrdered className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium">{competition.seats_remaining ?? '-'} seats left</span>
              </div>
              {!!competition.max_team_size && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">Max team: {competition.max_team_size}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium truncate">{competition.posted_by?.name || 'Unknown'}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {isAdmin ? (
                  // --- Admin actions by status ---
                  (() => {
                    if (status === 'upcoming') {
                      return (
                        <>
                          <button
                            onClick={(e) => { stop(e); goToAdminSubmissions(competition); }}
                            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                            title="View Submissions"
                          >
                            <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                          </button>
                          <button
                            onClick={(e) => { stop(e); handleEdit(competition); }}
                            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                          </button>
                          <button
                            onClick={async (e) => { stop(e); await handleDelete(competition); }}
                            disabled={deletingId === cid}
                            className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </>
                      );
                    }
                    if (status === 'ongoing') {
                      return (
                        <button
                          onClick={(e) => { stop(e); goToAdminSubmissions(competition); }}
                          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                          title="View Submissions"
                        >
                          <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      );
                    }
                    // completed
                    return (
                      <>
                        <button
                          onClick={(e) => { stop(e); navigate(`/competition/${cid}/leaderboard`); }}
                          className={BTN.viewResults}
                          title="View Results"
                        >
                          View Results
                        </button>
                        <button
                          onClick={(e) => { stop(e); goToAdminSubmissions(competition); }}
                          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                          title="View Submissions"
                        >
                          <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      </>
                    );
                  })()
                ) : (
                  // --- Student/User actions ---
                  renderStudentActions()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Competitions</h2>
                <p className="text-base text-slate-600 dark:text-slate-400">Discover and join exciting competitions</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate('/competition/create')}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Competition</span>
                </button>
              )}
            </div>

            {isAdmin && (
              <div className="mb-6">
                <button
                  onClick={() => setMyOnly((v) => !v)}
                  className={`
                    w-full sm:w-auto px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border-2 font-medium
                    ${myOnly 
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-500 ring-2 ring-blue-500/50" 
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500"
                    }
                  `}
                >
                  <User className="w-4 h-4" />
                  My Competitions ({counts.my})
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <MetricButton label="Ongoing" count={counts.ongoing} selected={activeFilter === FILTERS.ONGOING} onClick={() => setActiveFilter(FILTERS.ONGOING)} Icon={Activity} palette="green" />
              <MetricButton label="Upcoming" count={counts.upcoming} selected={activeFilter === FILTERS.UPCOMING} onClick={() => setActiveFilter(FILTERS.UPCOMING)} Icon={Clock3} palette="amber" />
              <MetricButton label="Completed" count={counts.completed} selected={activeFilter === FILTERS.COMPLETED} onClick={() => setActiveFilter(FILTERS.COMPLETED)} Icon={CheckCircle2} palette="gray" />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search competitions, sponsors, tags..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-base"
              />
              {!!searchText && (
                <button onClick={() => setSearchText('')} className="absolute inset-y-0 right-0 pr-4 flex items-center" aria-label="Clear search">
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-600 dark:text-red-400 font-semibold">Error loading competitions</p>
                  <p className="text-red-600/80 dark:text-red-400/80 text-sm">{error}</p>
                </div>
                <button onClick={() => fetchCompetitions(true)} className="px-4 py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm font-semibold transition-all">
                  Retry
                </button>
              </div>
            </div>
          )}

          {refreshing && (
            <div className="mb-4">
              <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse"></div>
              </div>
            </div>
          )}

          {competitions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-2">
                {activeFilter === FILTERS.MY_COMPETITIONS ? 'No competitions joined yet' : 'No competitions found'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {activeFilter === FILTERS.MY_COMPETITIONS
                  ? 'Register for competitions to see them here'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {competitions.map((c) => (
                <CompetitionCard key={getId(c)} competition={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CompetitionScreen;
                            