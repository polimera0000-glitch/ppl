// src/pages/CompetitionScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

// ✅ Lucide icons
import {
  CalendarDays,
  Users,
  Tag as TagIcon,
  User as UserIcon,
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

// Bright gradient pills (chips)
const BADGE = {
  // time/status
  live:          'bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-emerald-400 shadow-sm',
  soon:          'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-400 shadow-sm',
  done:          'bg-gradient-to-r from-gray-500 to-slate-600 text-white border border-slate-400 shadow-sm',

  // participation
  registered:    'bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-emerald-400 shadow-sm',
  submitted:     'bg-gradient-to-r from-blue-500 to-sky-500 text-white border border-sky-400 shadow-sm',
  notRegistered: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border border-rose-400 shadow-sm',
  notSubmitted:  'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white border border-fuchsia-400 shadow-sm',
  participating: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border border-purple-400 shadow-sm',

  // results
  waiting:       'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border border-amber-300 shadow-sm',
  qualified:     'bg-gradient-to-r from-emerald-500 to-green-500 text-white border border-emerald-300 shadow-sm',
  disqualified:  'bg-gradient-to-r from-rose-600 to-red-500 text-white border border-rose-300 shadow-sm',
  finalist:      'bg-gradient-to-r from-violet-500 to-purple-500 text-white border border-violet-300 shadow-sm',
  winner:        'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border border-yellow-300 shadow-sm',
  neutral:       'bg-gradient-to-r from-slate-500 to-gray-600 text-white border border-slate-300 shadow-sm',
};

// Bright gradient buttons
const BTN = {
  submit:      'px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-400 shadow-sm hover:brightness-105 active:scale-[.99]',
  register:    'px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-sky-500 border border-sky-400 shadow-sm hover:brightness-105 active:scale-[.99]',
  viewResults: 'px-3 py-1 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 border border-sky-400 shadow-sm hover:brightness-105 active:scale-[.99]',
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
    ongoing:   { icon: <Activity className="w-4 h-4" />,   label: 'Live',  chipClass: BADGE.live },
    upcoming:  { icon: <Clock3 className="w-4 h-4" />,     label: 'Soon',  chipClass: BADGE.soon },
    completed: { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Done', chipClass: BADGE.done },
  }), []);

  // Metric button
  const MetricButton = ({ label, count, selected, onClick, Icon, palette }) => {
    const color = {
      green: { bg: 'bg-green-500/15', text: 'text-green-400', ring: 'ring-green-500/30' },
      amber: { bg: 'bg-amber-500/15', text: 'text-amber-300', ring: 'ring-amber-500/30' },
      gray:  { bg: 'bg-gray-500/15',  text: 'text-gray-300',  ring: 'ring-gray-500/30' },
      blue:  { bg: 'bg-blue-500/15',  text: 'text-blue-300',  ring: 'ring-blue-500/30' },
    }[palette];

    return (
      <button
        onClick={onClick}
        className={[
          "px-4 py-3 rounded-xl transition-all duration-200 border",
          selected ? "bg-surface ring-2 "+color.ring+" border-border" : "bg-surface hover:bg-border border-border/70"
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color.text}`} />
          </div>
          <div className="text-left">
            <div className="text-primary-text font-bold text-lg">{count}</div>
            <div className="text-secondary-text text-sm">{label}</div>
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
      case 'winner':        return { label: 'Winner',        cls: BADGE.winner };
      case 'finalist':      return { label: 'Finalist',      cls: BADGE.finalist };
      case 'qualified':     return { label: 'Qualified',     cls: BADGE.qualified };
      case 'disqualified':  return { label: 'Disqualified',  cls: BADGE.disqualified };
      case 'participant':   return { label: 'Participant',   cls: BADGE.neutral };
      default:              return { label: 'Result',        cls: BADGE.neutral };
    }
  };

  // ---- Card (clickable -> details) ----
  const CompetitionCard = ({ competition }) => {
    const status = computeStatus(competition);
    const pill = getStatusPill[status] || getStatusPill.upcoming;
    const userRegistered = Boolean(competition.user_registered);
    const userSubmitted  = Boolean(competition.user_submitted);
    const resultsPublished = Boolean(
      competition.results_published || competition.result_published || competition.resultsPublished || competition.has_results || competition.hasResults
    );
    const userResultStatus = competition.user_result_status || competition.userResultStatus || null;

    const cid = getId(competition);
    const handleCardOpen = () => navigate(`/competition/${cid}`);
    const stop = (e) => e.stopPropagation();

    const myStatus = (() => {
      if (activeFilter === FILTERS.MY_COMPETITIONS) {
        if (userSubmitted)  return { text: 'Submitted', class: BADGE.submitted,    Icon: FileCheck };
        if (userRegistered) return { text: 'Registered', class: BADGE.registered,  Icon: CheckCircle2 };
        return { text: 'Participating', class: BADGE.participating, Icon: Rocket };
      }
      return null;
    })();

    // --- Student/User actions ---
    const renderStudentActions = () => {
      if (status === 'upcoming') {
        return userRegistered ? (
          <div className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${BADGE.registered}`}>
            <CheckCircle2 className="w-4 h-4" />
            Registered
          </div>
        ) : (
          <button onClick={(e) => { stop(e); goToRegister(competition); }} className={BTN.register}>
            Register
          </button>
        );
      }

      if (status === 'ongoing') {
        if (userSubmitted) {
          return <div className={`px-3 py-1 rounded-lg text-sm font-medium ${BADGE.submitted}`}>Submitted</div>;
        }
        return userRegistered
          ? <button onClick={(e) => { stop(e); goToSubmit(competition); }} className={BTN.submit}>Submit</button>
          : <div className={`px-3 py-1 rounded-lg text-sm font-medium ${BADGE.notRegistered}`}>Not registered</div>;
      }

      // completed
      if (!userRegistered) {
        // Completed without registration → show nothing
        return null;
      }
      if (!userSubmitted) {
        // Completed without submission
        return <div className={`px-3 py-1 rounded-lg text-sm font-medium ${BADGE.notSubmitted}`}>Not submitted</div>;
      }
      // Completed with submission
      if (!resultsPublished) {
        return <div className={`px-3 py-1 rounded-lg text-sm font-medium ${BADGE.waiting}`}>Waiting for results</div>;
      }
      const { label, cls } = resultBadgeFor(userResultStatus);
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${cls}`}>{label}</div>
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
        className="bg-surface rounded-xl p-6 border border-border hover:bg-border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full aspect-[16/9] sm:w-20 sm:h-20 sm:aspect-auto rounded-lg bg-background flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
            {competition.banner_image_url ? (
              <img
                src={competition.banner_image_url}
                alt={competition.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Award className="w-8 h-8 text-secondary-text" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <h3 className="text-primary-text text-lg font-bold leading-snug break-words">
                {competition.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`px-3 py-1 rounded-full inline-flex items-center gap-2 ${pill.chipClass}`}>
                  {pill.icon}
                  <span className="text-sm font-medium">{pill.label}</span>
                </div>
                {myStatus && (
                  <div className={`px-3 py-1 rounded-full inline-flex items-center gap-2 ${myStatus.class}`}>
                    <myStatus.Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{myStatus.text}</span>
                  </div>
                )}
              </div>
            </div>

            {(competition.start_date || competition.end_date) && (
              <div className="flex items-center gap-2 mb-2 text-secondary-text text-sm">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {competition.start_date ? new Date(competition.start_date).toLocaleDateString() : '—'} – {competition.end_date ? new Date(competition.end_date).toLocaleDateString() : '—'}
                </span>
              </div>
            )}

            <p className="text-secondary-text mb-4 line-clamp-2 break-words">
              {competition.description || competition.subtitle}
            </p>

            {Array.isArray(competition.tags) && competition.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {competition.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-background text-primary-text/80 border border-border text-xs rounded-md inline-flex items-center gap-1">
                    <TagIcon className="w-3.5 h-3.5" /> {tag}
                  </span>
                ))}
                {competition.tags.length > 3 && (
                  <span className="text-secondary-text text-xs">+{competition.tags.length - 3} more</span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center gap-2 text-secondary-text">
                <Users className="w-4 h-4" />
                <span className="text-sm">{competition.stats?.totalRegistrations || 0} registered</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-text">
                <ListOrdered className="w-4 h-4" />
                <span className="text-sm">{competition.seats_remaining ?? '-' } seats left</span>
              </div>
              {!!competition.max_team_size && (
                <div className="flex items-center gap-2 text-secondary-text">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Max team: {competition.max_team_size}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-secondary-text min-w-0">
                <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm truncate">{competition.posted_by?.name || 'Unknown'}</span>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {isAdmin ? (
                  // --- Admin actions by status ---
                  (() => {
                    if (status === 'upcoming') {
                      return (
                        <>
                          <button
                            onClick={(e) => { stop(e); goToAdminSubmissions(competition); }}
                            className="p-2 rounded-lg bg-surface hover:bg-border border border-border transition-colors"
                            title="View Submissions"
                          >
                            <Eye className="w-4 h-4 text-secondary-text" />
                          </button>
                          <button
                            onClick={(e) => { stop(e); handleEdit(competition); }}
                            className="p-2 rounded-lg bg-surface hover:bg-border border border-border transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 text-secondary-text" />
                          </button>
                          <button
                            onClick={async (e) => { stop(e); await handleDelete(competition); }}
                            disabled={deletingId === cid}
                            className="p-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 transition-colors disabled:opacity-60"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      );
                    }
                    if (status === 'ongoing') {
                      return (
                        <button
                          onClick={(e) => { stop(e); goToAdminSubmissions(competition); }}
                          className="p-2 rounded-lg bg-surface hover:bg-border border border-border transition-colors"
                          title="View Submissions"
                        >
                          <Eye className="w-4 h-4 text-secondary-text" />
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
                          className="p-2 rounded-lg bg-surface hover:bg-border border border-border transition-colors"
                          title="View Submissions"
                        >
                          <Eye className="w-4 h-4 text-secondary-text" />
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-primary-text">Competitions</h2>
                <p className="text-secondary-text">Discover and join exciting competitions</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate('/competition/create')}
                  className="w-full sm:w-auto px-4 py-2 bg-surface hover:bg-border border border-border text-primary-text rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Create Competition
                </button>
              )}
            </div>

            {isAdmin && (
              <div className="mb-4">
                <button
                  onClick={() => setMyOnly((v) => !v)}
                  className={[
                    "w-full sm:w-auto px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border",
                    myOnly ? "bg-surface text-primary-text border-border ring-2 ring-primary/30" : "bg-surface text-secondary-text hover:bg-border border-border"
                  ].join(' ')}
                >
                  <UserIcon className="w-4 h-4" />
                  My Competitions ({counts.my})
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-1 mb-4">
              <MetricButton label="Ongoing"  count={counts.ongoing}  selected={activeFilter === FILTERS.ONGOING}  onClick={() => setActiveFilter(FILTERS.ONGOING)}  Icon={Activity} palette="green" />
              <MetricButton label="Upcoming" count={counts.upcoming} selected={activeFilter === FILTERS.UPCOMING} onClick={() => setActiveFilter(FILTERS.UPCOMING)} Icon={Clock3} palette="amber" />
              <MetricButton label="Completed" count={counts.completed} selected={activeFilter === FILTERS.COMPLETED} onClick={() => setActiveFilter(FILTERS.COMPLETED)} Icon={CheckCircle2} palette="gray" />
              
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-secondary-text" />
              </div>
              <input
                type="text"
                placeholder="Search competitions, sponsors, tags..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {!!searchText && (
                <button onClick={() => setSearchText('')} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Clear search">
                  <svg className="h-5 w-5 text-secondary-text hover:text-primary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 font-medium">Error loading competitions</p>
                  <p className="text-red-400/90 text-sm">{error}</p>
                </div>
                <button onClick={() => fetchCompetitions(true)} className="px-3 py-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 rounded-lg text-sm font-medium transition-colors">
                  Retry
                </button>
              </div>
            </div>
          )}

          {refreshing && (
            <div className="mb-4">
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary/40 animate-pulse"></div>
              </div>
            </div>
          )}

          {competitions.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-14 h-14 text-secondary-text mx-auto mb-4" />
              <h3 className="text-primary-text text-lg font-medium mb-2">
                {activeFilter === FILTERS.MY_COMPETITIONS ? 'No competitions joined yet' : 'No competitions found'}
              </h3>
              <p className="text-secondary-text">
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
