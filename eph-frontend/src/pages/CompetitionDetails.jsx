// src/screens/CompetitionDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import SidebarLayout from "../components/SidebarLayout";

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

  const registrationStart = useMemo(() => toDate(comp?.registration_start_date), [comp]);
  const registrationEnd = useMemo(() => toDate(comp?.registration_deadline), [comp]);

  const isRegistrationOpen = useMemo(() => {
    if (!registrationStart || !registrationEnd) return true; // permissive if not configured
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
    registration_start_date: { short: "Registration Opens.", long: "Registration opens." },
    registration_deadline: { short: "Registration Closes.", long: "Registration closes." },
    start_date: { short: "Start Date.", long: "Start Date." },
    entry_deadline: {
      short: "Entry Deadline.",
      long: "Entry Deadline. You must accept the competition rules before this date in order to compete.",
    },
    team_merger_deadline: {
      short: "Team Merger Deadline.",
      long: "Team Merger Deadline. This is the last day participants may join or merge teams.",
    },
    final_submission_deadline: { short: "Final Submission Deadline.", long: "Final Submission Deadline." },
    end_date: { short: "Competition Ends.", long: "Competition Ends." },
    results_date: { short: "Results Announced.", long: "Results announced." },
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

  const seatsLeft = comp?.seats_remaining;
  const canRegisterCTA =
    phase === "upcoming" &&
    isRegistrationOpen &&
    (typeof seatsLeft !== "number" || seatsLeft > 0);

  const handleRegister = () => {
  // prefer the url param, then comp.id, then comp._id
  const cid = String(id || comp?.id || comp?._id || '');
  navigate('/competition/register', {
    state: { competitionId: cid, fromDetails: true },
  });
};

  // ----- Loading -----
  if (loading) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-6">
            <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border mb-3 sm:mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary-text" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-primary-text">Competition</h1>
                    <p className="text-secondary-text text-xs sm:text-sm">Loading details…</p>
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

            <div className="bg-surface rounded-xl p-4 border border-border text-secondary-text">Loading…</div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ----- Error -----
  if (error || !comp) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-6">
            <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border mb-3 sm:mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary-text" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-primary-text">Competition</h1>
                    <p className="text-secondary-text text-xs sm:text-sm">Couldn’t load</p>
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
              <p className="text-secondary-text text-sm">{error || "Competition not found"}</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
          {/* Header */}
          <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-5 h-5 text-primary-text" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-primary-text truncate">{comp.title}</h1>
                  <p className="text-secondary-text text-xs sm:text-sm">
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

          {/* Summary */}
          <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="w-full sm:w-16 sm:h-16 aspect-video sm:aspect-auto rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {comp.banner_image_url ? (
                  <img
                    src={comp.banner_image_url}
                    alt={comp.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-secondary-text" />
                )}
              </div>

              <div className="flex-1 w-full">
                <div className="flex flex-wrap items-center gap-2">
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
                </div>

                {Array.isArray(tags) && tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((t, i) => (
                      <span
                        key={`${t}-${i}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border border-border text-secondary-text text-[11px] sm:text-xs"
                      >
                        <TagIcon className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <CalendarDays className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      <strong className="text-primary-text">Start:</strong> {fmtShort(comp.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                    <CalendarDays className="w-4 h-4 text-secondary-text" />
                    <span className="text-secondary-text text-sm">
                      <strong className="text-primary-text">End:</strong> {fmtShort(comp.end_date)}
                    </span>
                  </div>
                  {"seats_remaining" in comp && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
                      <Users className="w-4 h-4 text-secondary-text" />
                      <span className="text-secondary-text text-sm">
                        <strong className="text-primary-text">Seats Left:</strong>{" "}
                        {typeof seatsLeft === "number" ? seatsLeft : "—"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs (sticky on mobile) */}
          <div className="mb-0 sticky top-0 z-10 bg-transparent pt-1 sm:static sm:pt-0">
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {["overview", "leaderboard", "timeline", "rules"].map((tab) => (
                <button
                  key={`m-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    activeTab === tab
                      ? "bg-surface text-primary-text border-border"
                      : "bg-background text-secondary-text hover:text-primary-text border-border"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex sm:gap-2">
              {["overview", "leaderboard", "timeline", "rules"].map((tab) => (
                <button
                  key={`d-${tab}`}
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
          </div>

          {/* Panel */}
          <div className="p-3 sm:p-5 border border-border rounded-xl sm:rounded-tr-xl bg-surface space-y-5 sm:space-y-6">
            {/* Overview */}
            {activeTab === "overview" && (
              <>
                {(comp.description_long || comp.overview || comp.description) && (
                  <div>
                    <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
                      Overview
                    </h4>
                    <p className="text-secondary-text whitespace-pre-wrap text-[13px] sm:text-base leading-relaxed break-words">
                      {comp.description_long || comp.overview || comp.description}
                    </p>
                  </div>
                )}

                {Array.isArray(comp.resources_json) && comp.resources_json.length > 0 && (
                  <div>
                    <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
                      Resources
                    </h4>
                    <ul className="list-disc list-inside text-secondary-text space-y-1">
                      {comp.resources_json.map((r, i) => (
                        <li key={i} className="text-sm sm:text-base break-words">
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-text hover:underline break-all"
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

                {Array.isArray(comp.prizes_json) && comp.prizes_json.length > 0 && (
                  <div>
                    <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
                      Prizes
                    </h4>
                    {/* table on desktop, stacked rows on mobile */}
                    <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
                      <table className="min-w-full text-sm">
                        <thead className="bg-background text-secondary-text">
                          <tr>
                            <th className="text-left px-4 py-2">Place</th>
                            <th className="text-left px-4 py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="text-primary-text">
                          {comp.prizes_json.map((p, i) => (
                            <tr key={i} className={i % 2 ? "bg-background" : "bg-surface"}>
                              <td className="px-4 py-2">{p.place || "—"}</td>
                              <td className="px-4 py-2">{p.amount != null ? `$${p.amount}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="sm:hidden space-y-2">
                      {comp.prizes_json.map((p, i) => (
                        <div key={i} className="border border-border rounded-lg p-3 bg-background">
                          <div className="flex justify-between text-sm">
                            <span className="text-secondary-text">Place</span>
                            <span className="text-primary-text font-medium">{p.place || "—"}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-secondary-text">Amount</span>
                            <span className="text-primary-text font-medium">
                              {p.amount != null ? `$${p.amount}` : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(comp.contact_info || comp.eligibility_criteria) && (
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    {comp.contact_info && (
                      <div>
                        <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
                          Contact
                        </h4>
                        <div className="text-secondary-text space-y-1 text-sm sm:text-base break-words">
                          {comp.contact_info.email && <p>Email: {comp.contact_info.email}</p>}
                          {comp.contact_info.phone && <p>Phone: {comp.contact_info.phone}</p>}
                          {comp.contact_info.website && (
                            <p>
                              Website:{" "}
                              <a
                                href={comp.contact_info.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-text hover:underline break-all"
                              >
                                {comp.contact_info.website}
                              </a>
                            </p>
                          )}
                          {comp.contact_info.discord && <p>Discord: {comp.contact_info.discord}</p>}
                        </div>
                      </div>
                    )}
                    {comp.eligibility_criteria && (
                      <div>
                        <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
                          Eligibility
                        </h4>
                        <div className="text-secondary-text space-y-1 text-sm sm:text-base">
                          {"minAge" in comp.eligibility_criteria && <p>Min Age: {comp.eligibility_criteria.minAge}</p>}
                          {"maxAge" in comp.eligibility_criteria && <p>Max Age: {comp.eligibility_criteria.maxAge}</p>}
                          {comp.eligibility_criteria.education && <p>Education: {comp.eligibility_criteria.education}</p>}
                          {Array.isArray(comp.eligibility_criteria.countriesAllowed) &&
                            comp.eligibility_criteria.countriesAllowed.length > 0 && (
                              <p>Countries Allowed: {comp.eligibility_criteria.countriesAllowed.join(", ")}</p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Register CTA (only when upcoming) --- */}
                {phase === "upcoming" && (
                  <div className="pt-1 sm:pt-2">
                    <button
                      onClick={handleRegister}
                      disabled={!canRegisterCTA}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm font-semibold ${
                        canRegisterCTA
                          ? "bg-primary-text text-background border-primary-text hover:opacity-90 active:opacity-80"
                          : "bg-background text-secondary-text border-border cursor-not-allowed"
                      }`}
                      aria-disabled={!canRegisterCTA}
                    >
                      <Rocket className="w-4 h-4" />
                      {canRegisterCTA
                        ? "Register"
                        : registrationEnd && now > registrationEnd
                        ? "Registration Closed"
                        : "Not Open Yet"}
                    </button>
                    {!canRegisterCTA && (
                      <p className="mt-2 text-xs text-secondary-text">
                        {registrationStart && now < registrationStart && `Opens on ${fmtLong(registrationStart)}`}
                        {registrationEnd && now > registrationEnd && `Closed on ${fmtLong(registrationEnd)}`}
                        {typeof seatsLeft === "number" && seatsLeft <= 0 && " • No seats left"}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Leaderboard */}
            {activeTab === "leaderboard" && (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider">
                    Leaderboard
                  </h4>
                  <input
                    value={lbQuery}
                    onChange={(e) => setLbQuery(e.target.value)}
                    placeholder="Search..."
                    className="px-3 py-2 bg-background border border-border rounded-lg text-primary-text placeholder-secondary-text outline-none w-full sm:w-64"
                  />
                </div>

                {lbLoading ? (
                  <div className="flex justify-center py-10 text-secondary-text">Loading…</div>
                ) : filteredLb.length === 0 ? (
                  <p className="text-center text-secondary-text py-10">No leaderboard data available</p>
                ) : (
                  <>
                    {/* Card list on mobile */}
                    <div className="sm:hidden space-y-2">
                      {filteredLb.map((row, i) => (
                        <div key={i} className="border border-border rounded-lg p-3 bg-background">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-secondary-text">Rank</span>
                            <span className="text-sm font-semibold text-primary-text">
                              {row.rank ?? i + 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-secondary-text">Team/User</span>
                            <span className="text-sm text-primary-text max-w-[60%] truncate text-right">
                              {row.team_name || row.leader?.name || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-secondary-text">Score</span>
                            <span className="text-sm text-primary-text">
                              {typeof row.final_score === "number"
                                ? row.final_score.toFixed(3)
                                : row.score?.toFixed?.(3) || "—"}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="px-2 py-1 rounded text-[11px] border border-border text-secondary-text">
                              {row.status || "submitted"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Table on desktop */}
                    <div className="hidden sm:block overflow-x-auto border border-border rounded-xl">
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
                            <tr key={i} className={i % 2 ? "bg-background" : "bg-surface"}>
                              <td className="px-4 py-2">{row.rank ?? i + 1}</td>
                              <td className="px-4 py-2 break-words">{row.team_name || row.leader?.name || "—"}</td>
                              <td className="px-4 py-2">
                                {typeof row.final_score === "number"
                                  ? row.final_score.toFixed(3)
                                  : row.score?.toFixed?.(3) || "—"}
                              </td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-1 rounded text-xs border border-border text-secondary-text">
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
                <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
                  Timeline
                </h4>

                {timelineItems.length === 0 ? (
                  <p className="text-secondary-text">No timeline data available.</p>
                ) : (
                  <div className="relative pl-6 sm:pl-8">
                    <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-px bg-border" />
                    <ul className="space-y-5 sm:space-y-6">
                      {timelineItems.map((it, idx) => (
                        <li key={`${it.key}-${idx}`} className="relative flex items-start">
                          <span className="absolute top-2.5 left-2 sm:left-3 -translate-x-1/2 w-2 h-2 rounded-full bg-primary-text/80 border border-border shadow" />
                          <div className="ml-4 sm:ml-6 text-primary-text/85 text-sm sm:text-base">
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

            {/* Rules */}
            {activeTab === "rules" && (
              <>
                <h4 className="text-primary-text font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2">
                  Rules
                </h4>
                {comp.rules_markdown || comp.rules ? (
                  <div className="text-secondary-text whitespace-pre-wrap text-sm sm:text-base break-words">
                    {comp.rules_markdown || comp.rules}
                  </div>
                ) : (
                  <p className="text-secondary-text">No rules have been provided for this competition.</p>
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
