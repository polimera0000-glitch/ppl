// src/screens/CompetitionDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import SidebarLayout from "../components/SidebarLayout";
import { useAuth } from "../hooks/useAuth";
import RegistrationStatusComponent from "../components/RegistrationStatusComponent";
import TeamDetailsPanel from "../components/TeamDetailsPanel";
import InvitationProgressComponent from "../components/InvitationProgressComponent";

import {
  Rocket,
  X,
  CalendarDays,
  Gift,
  Users,
  MapPin,
  Image as ImageIcon,
  Tag as TagIcon,
  GraduationCap,
} from "lucide-react";

const CompetitionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const role = user?.role || null;
  const isAdmin = role === "admin";

  // --- Registration Fee Logic ---
  const FEE_UNDERGRAD = 999;
  const FEE_GRADUATE = 1999;
  const feeFor = (eduType) => (eduType === 'graduate' ? FEE_GRADUATE : FEE_UNDERGRAD);

  const [loading, setLoading] = useState(true);
  const [comp, setComp] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [lbLoading, setLbLoading] = useState(false);
  const [lbData, setLbData] = useState([]);
  const [lbQuery, setLbQuery] = useState("");

  // --- date helpers ---
  const toDate = (d) => (d ? new Date(d) : null);
  const now = new Date();

  const startAt = useMemo(() => toDate(comp?.start_date), [comp]);
  const endAt = useMemo(() => toDate(comp?.end_date), [comp]);

  // derive phase from dates
  const phase = useMemo(() => {
    if (!startAt && !endAt) return "upcoming";
    if (endAt && now > endAt) return "completed";
    if (startAt && now >= startAt) return "ongoing";
    return "upcoming";
  }, [startAt, endAt, now]);

  const registrationStart = useMemo(() => toDate(comp?.registration_start_date) || toDate(comp?.start_date), [comp]);
  const registrationEnd = useMemo(() => toDate(comp?.registration_deadline) || toDate(comp?.end_date), [comp]);

  const isRegistrationOpen = useMemo(() => {
    if (!registrationStart || !registrationEnd) return true;
    return now >= registrationStart && now <= registrationEnd;
  }, [registrationStart, registrationEnd, now]);

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
      short: "Registration Opens",
      long: "Registration Opens",
    },
    registration_deadline: {
      short: "Registration Closes",
      long: "Registration Closes",
    },
    abstract_submission_start_date: {
      short: "Abstract Submission Opens",
      long: "Abstract Submission Opens",
    },
    abstract_submission_end_date: {
      short: "Abstract Submission Closes",
      long: "Abstract Submission Closes",
    },
    shortlisted_candidates_date: {
      short: "Shortlisted Candidates Announced",
      long: "Shortlisted Candidates Announced",
    },
    prototype_submission_start_date: {
      short: "Prototype Submission Opens",
      long: "Prototype Submission Opens",
    },
    prototype_submission_end_date: {
      short: "Prototype Submission Closes",
      long: "Prototype Submission Closes",
    },
    pitch_deck_start_date: {
      short: "Pitch Deck Submission Opens",
      long: "Pitch Deck Submission Opens",
    },
    pitch_deck_end_date: {
      short: "Pitch Deck Submission Closes",
      long: "Pitch Deck Submission Closes",
    },
    final_round_date: {
      short: "Final Round",
      long: "Final Round",
    },
    results_date: {
      short: "Results Announced",
      long: "Results Announced",
    },
    entry_deadline: {
      short: "Entry Deadline",
      long: "Entry Deadline. Accept rules before this date to compete.",
    },
    team_merger_deadline: {
      short: "Team Merger Deadline",
      long: "Team Merger Deadline — Last day participants may join or merge teams.",
    },
    final_submission_deadline: {
      short: "Final Submission Deadline",
      long: "Final Submission Deadline",
    },
  };

  const tags = useMemo(() => (Array.isArray(comp?.tags) ? comp.tags : []), [comp]);

  const timelineItems = useMemo(() => {
    if (!comp) return [];
    const candidates = [
      ["registration_start_date", comp.registration_start_date],
      ["registration_deadline", comp.registration_deadline],
      ["abstract_submission_start_date", comp.abstract_submission_start_date],
      ["abstract_submission_end_date", comp.abstract_submission_end_date],
      ["shortlisted_candidates_date", comp.shortlisted_candidates_date],
      ["prototype_submission_start_date", comp.prototype_submission_start_date],
      ["prototype_submission_end_date", comp.prototype_submission_end_date],
      ["pitch_deck_start_date", comp.pitch_deck_start_date],
      ["pitch_deck_end_date", comp.pitch_deck_end_date],
      ["final_round_date", comp.final_round_date],
      ["results_date", comp.results_date],
    ].filter(([, v]) => !!v);

    const toTS = (d) => (d ? new Date(d).getTime() : Number.MAX_SAFE_INTEGER);

    return candidates
      .map(([key, date]) => ({
        key,
        date,
        ts: toTS(date),
        text:
          TIMELINE_LABELS[key]?.long ||
          TIMELINE_LABELS[key]?.short ||
          key.replaceAll("_", " "),
      }))
      .sort((a, b) => a.ts - b.ts);
  }, [comp]);

  const seatsLeft = comp?.seats_remaining;

  const canRegisterCTA =
    phase !== "completed" &&
    !isAdmin &&
    isRegistrationOpen &&
    (typeof seatsLeft !== "number" || seatsLeft > 0);

  const handleRegister = () => {
    const cid = String(id || comp?.id || comp?._id || "");
    navigate("/competition/register", {
      state: { competitionId: cid, fromDetails: true },
    });
  };

  // ----- Loading -----
  if (loading) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
          <div className="p-3 sm:p-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Competition</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Loading details…</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-slate-200 dark:border-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400"></div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ----- Error -----
  if (error || !comp) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
          <div className="p-3 sm:p-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Competition</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Couldn't load</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-slate-200 dark:border-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl">
              <p className="text-red-900 dark:text-red-100 font-semibold mb-1">Error</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{error || "Competition not found"}</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
          {/* Banner Section */}
          {comp.banner_image_url && (
            <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
              <img
                src={comp.banner_image_url}
                alt={`${comp.title} Banner`}
                className="w-full h-56 sm:h-80 object-cover"
                onError={(e) => (e.target.style.display = 'none')}
              />
            </div>
          )}

          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">{comp.title}</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {comp.sponsor ? `Sponsored by ${comp.sponsor}` : "Competition details"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-slate-200 dark:border-slate-600 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700">
            <div className="space-y-4">
              {/* Quick Info Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {comp.location && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    {comp.location}
                  </div>
                )}
                {typeof comp.max_team_size === "number" && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
                    <Users className="w-4 h-4" />
                    Max team: {comp.max_team_size}
                  </div>
                )}
                {typeof comp.prize_pool === "number" && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                    <Gift className="w-4 h-4" />
                    Prize: ${comp.prize_pool}
                  </div>
                )}
              </div>

              {/* Registration Fee */}
              {(() => {
                const eduType =
                  comp.education_level ||
                  comp.eligibility_criteria?.education?.toLowerCase?.() ||
                  "undergraduate";
                const fee = feeFor(eduType);

                return (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold">
                    <GraduationCap className="w-4 h-4" />
                    ₹{fee} • {eduType.charAt(0).toUpperCase() + eduType.slice(1)}
                  </div>
                );
              })()}

              {/* Tags */}
              {Array.isArray(tags) && tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium"
                    >
                      <TagIcon className="w-3 h-3" />
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Start Date</p>
                    <p className="text-sm text-slate-900 dark:text-white font-semibold">{fmtShort(comp.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">End Date</p>
                    <p className="text-sm text-slate-900 dark:text-white font-semibold">{fmtShort(comp.end_date)}</p>
                  </div>
                </div>
                {"seats_remaining" in comp && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Seats Left</p>
                      <p className="text-sm text-slate-900 dark:text-white font-semibold">
                        {typeof seatsLeft === "number" ? seatsLeft : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-0 sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pt-2">
            {/* Mobile Tabs */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {["overview", "rules", "timeline", "leaderboard"].map((tab) => {
                const displayName = tab === "rules" ? "Description" : tab.charAt(0).toUpperCase() + tab.slice(1);
                return (
                  <button
                    key={`m-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      activeTab === tab
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-500"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>

            {/* Desktop Tabs */}
            <div className="hidden sm:flex sm:gap-2">
              {["overview", "rules", "timeline", "leaderboard"].map((tab) => {
                const displayName = tab === "rules" ? "Description" : tab.charAt(0).toUpperCase() + tab.slice(1);
                return (
                  <button
                    key={`d-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-t-xl text-sm font-semibold border-2 border-b-0 transition-all ${
                      activeTab === tab
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-500 border-b-2 border-b-white dark:border-b-slate-800"
                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel */}
          <div className="p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-tl-none bg-white dark:bg-slate-800 space-y-6">
            {/* Registration Button - Visible in all tabs */}
            {!isAdmin && canRegisterCTA && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold mb-1">Ready to participate?</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Registration is open. Secure your spot now!
                    </p>
                  </div>
                  <button
                    onClick={handleRegister}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors whitespace-nowrap"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            )}
            
            {/* Show registration closed message if registration period has ended */}
            {!isAdmin && !canRegisterCTA && registrationEnd && now > registrationEnd && (
              <div className="p-4 bg-slate-100 dark:bg-slate-700/30 border-2 border-slate-300 dark:border-slate-600 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold mb-1">Registration Closed</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Registration deadline has passed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show registration not yet open message if before registration start */}
            {!isAdmin && !canRegisterCTA && registrationStart && now < registrationStart && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-200 dark:bg-amber-900/40 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold mb-1">Registration Opens Soon</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Registration starts on {fmtLong(comp.registration_start_date)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overview */}
            {activeTab === "overview" && (
              <>
                {(comp.description_long || comp.overview || comp.description) && (
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-3">
                      Overview
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-base leading-relaxed">
                      {comp.description_long || comp.overview || comp.description}
                    </p>
                  </div>
                )}

                {Array.isArray(comp.resources_json) && comp.resources_json.length > 0 && (
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-3">
                      Resources
                    </h4>
                    <ul className="space-y-2">
                      {comp.resources_json.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {r.label || r.url}
                            </a>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300">{r.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(comp.prizes_json) && comp.prizes_json.length > 0 && (
                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-3">
                      Prizes
                    </h4>
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Place</th>
                            <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-900 dark:text-white">
                          {comp.prizes_json.map((p, i) => (
                            <tr key={i} className={i % 2 ? "bg-slate-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"}>
                              <td className="px-4 py-3">{p.place || "—"}</td>
                              <td className="px-4 py-3 font-semibold">{p.amount != null ? `$${p.amount}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-2">
                      {comp.prizes_json.map((p, i) => (
                        <div key={i} className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-700/30">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Place</span>
                            <span className="text-slate-900 dark:text-white font-semibold">{p.place || "—"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Amount</span>
                            <span className="text-slate-900 dark:text-white font-semibold">
                              {p.amount != null ? `$${p.amount}` : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(comp.contact_info || comp.eligibility_criteria) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {comp.contact_info && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                        <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-3">
                          Contact
                        </h4>
                        <div className="text-slate-600 dark:text-slate-300 space-y-2 text-sm">
                          {comp.contact_info.email && <p><span className="font-medium">Email:</span> {comp.contact_info.email}</p>}
                          {comp.contact_info.phone && <p><span className="font-medium">Phone:</span> {comp.contact_info.phone}</p>}
                          {comp.contact_info.website && (
                            <p>
                              <span className="font-medium">Website:</span>{" "}
                              <a
                                href={comp.contact_info.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {comp.contact_info.website}
                              </a>
                            </p>
                          )}
                          {comp.contact_info.discord && <p><span className="font-medium">Discord:</span> {comp.contact_info.discord}</p>}
                        </div>
                      </div>
                    )}
                    {comp.eligibility_criteria && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                        <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-3">
                          Eligibility
                        </h4>
                        <div className="text-slate-600 dark:text-slate-300 space-y-2 text-sm">
                          {"minAge" in comp.eligibility_criteria && <p><span className="font-medium">Min Age:</span> {comp.eligibility_criteria.minAge}</p>}
                          {"maxAge" in comp.eligibility_criteria && <p><span className="font-medium">Max Age:</span> {comp.eligibility_criteria.maxAge}</p>}
                          {comp.eligibility_criteria.education && <p><span className="font-medium">Education:</span> {comp.eligibility_criteria.education}</p>}
                          {Array.isArray(comp.eligibility_criteria.countriesAllowed) &&
                            comp.eligibility_criteria.countriesAllowed.length > 0 && (
                              <p><span className="font-medium">Countries:</span> {comp.eligibility_criteria.countriesAllowed.join(", ")}</p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </>
            )}

            {/* Leaderboard */}
            {activeTab === "leaderboard" && (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                    Leaderboard
                  </h4>
                  <input
                    value={lbQuery}
                    onChange={(e) => setLbQuery(e.target.value)}
                    placeholder="Search teams or rankings..."
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none focus:border-blue-500 w-full sm:w-72 transition-colors"
                  />
                </div>

                {lbLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400"></div>
                  </div>
                ) : filteredLb.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No leaderboard data available</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                      {filteredLb.map((row, i) => (
                        <div key={i} className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-700/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rank</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              #{row.rank ?? i + 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Team/User</span>
                            <span className="text-sm text-slate-900 dark:text-white font-semibold max-w-[60%] truncate text-right">
                              {row.team_name || row.leader?.name || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Score</span>
                            <span className="text-sm text-slate-900 dark:text-white font-semibold">
                              {typeof row.final_score === "number"
                                ? row.final_score.toFixed(3)
                                : row.score?.toFixed?.(3) || "—"}
                            </span>
                          </div>
                          <div className="mt-3 pt-3 border-t-2 border-slate-200 dark:border-slate-600">
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800">
                              {row.status || "submitted"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto border-2 border-slate-200 dark:border-slate-700 rounded-xl">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Rank</th>
                            <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Team/User</th>
                            <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Score</th>
                            <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-900 dark:text-white">
                          {filteredLb.map((row, i) => (
                            <tr key={i} className={i % 2 ? "bg-slate-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"}>
                              <td className="px-4 py-3">
                                <span className="font-bold text-blue-600 dark:text-blue-400">#{row.rank ?? i + 1}</span>
                              </td>
                              <td className="px-4 py-3 font-medium">{row.team_name || row.leader?.name || "—"}</td>
                              <td className="px-4 py-3 font-semibold">
                                {typeof row.final_score === "number"
                                  ? row.final_score.toFixed(3)
                                  : row.score?.toFixed?.(3) || "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800">
                                  {row.status || "submitted"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Timeline */}
            {activeTab === "timeline" && (
              <>
                <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-6">
                  Timeline
                </h4>

                {timelineItems.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No timeline data available</p>
                  </div>
                ) : (
                  <div className="relative pl-8">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600" />
                    <ul className="space-y-6">
                      {timelineItems.map((it, idx) => (
                        <li key={`${it.key}-${idx}`} className="relative flex items-start">
                          <span className="absolute top-2 left-3 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-slate-800" />
                          <div className="ml-6 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 w-full">
                            <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                              {fmtLong(it.date)}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-sm">{it.text}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Rules/Description */}
            {activeTab === "rules" && (
              <>
                <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-4">
                  Description
                </h4>
                {comp.rules_markdown || comp.rules ? (
                  <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-base leading-relaxed bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700">
                    {comp.rules_markdown || comp.rules}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No description has been provided for this competition</p>
                  </div>
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