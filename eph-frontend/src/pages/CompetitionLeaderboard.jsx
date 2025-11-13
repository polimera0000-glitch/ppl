// src/pages/CompetitionLeaderboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { apiService } from '../services/apiService';

// Lucide (optional, for crisper icons)
import { ArrowLeft, Trophy, Crown, Medal, ListOrdered } from 'lucide-react';

const CompetitionLeaderboard = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  // fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getCompetitionLeaderboard(competitionId);
        // normalize: accept {data:{leaderboard,...}} or {leaderboard,...}
        const data = res?.data ?? res ?? {};
        if (!alive) return;
        setPayload(data);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || 'Failed to load leaderboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [competitionId]);

  const leaderboard = Array.isArray(payload?.leaderboard) ? payload.leaderboard : [];
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const getRankEmoji = (i) => (i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : null);

  const PodiumCard = ({ entry, rank, tone }) => {
  const toneCls = {
    gold: "from-yellow-500/20 to-yellow-600/10 border-yellow-400/30",
    silver: "from-zinc-400/20 to-zinc-500/10 border-zinc-400/30",
    bronze: "from-amber-600/20 to-amber-700/10 border-amber-500/30",
  }[tone];

  return (
    <div className="relative flex flex-col">
      <div
        className={`bg-gradient-to-b ${toneCls} border rounded-xl p-1 text-center transition-transform hover:scale-[1.01]`}
      >
        {/* Emoji */}
        <div className="text-2xl mb-1">
          {rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null}
        </div>

        {/* Rank */}
        <div className="text-lg font-bold text-primary-text mb-1">#{rank}</div>

        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-background border border-border mx-auto mb-2 overflow-hidden flex items-center justify-center">
          {entry?.leader?.profile_pic_url ? (
            <img
              src={entry.leader.profile_pic_url}
              alt={entry.leader?.name || "Leader"}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-5 h-5 text-secondary-text"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>

        {/* Name */}
        <div className="text-primary-text font-medium text-sm truncate">
          {entry?.team_name || entry?.leader?.name || "—"}
        </div>

        {/* Title */}
        {entry?.title && (
          <div className="text-secondary-text text-xs mb-2 line-clamp-1">
            {entry.title}
          </div>
        )}

        {/* Score */}
        <div className="bg-background border border-border rounded px-2 py-1 inline-block">
          <div className="text-secondary-text text-[10px]">Score</div>
          <div className="text-primary-text font-bold text-sm">
            {typeof entry?.final_score === "number"
              ? entry.final_score.toFixed(2)
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};



  const ListCard = ({ entry, rank }) => (
    <div className="bg-surface border border-border rounded-xl p-4 hover:bg-border/60 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center font-bold text-primary-text">
          {rank}
        </div>

        <div className="w-11 h-11 rounded-full bg-background border border-border overflow-hidden flex-shrink-0">
          {entry.leader?.profile_pic_url ? (
            <img src={entry.leader.profile_pic_url} alt={entry.leader.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary-text" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-primary-text font-semibold truncate">
              {entry.team_name || entry.leader?.name || '—'}
            </div>
            {entry.status === 'winner' && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                Winner
              </span>
            )}
          </div>
          <div className="text-secondary-text text-sm truncate">{entry.title || ''}</div>
          {entry.leader?.college && (
            <div className="text-secondary-text/70 text-xs mt-1">{entry.leader.college}</div>
          )}
        </div>

        <div className="text-right">
          <div className="text-secondary-text text-xs mb-1">Score</div>
          <div className="text-primary-text font-bold text-lg">
            {typeof entry.final_score === 'number' ? entry.final_score.toFixed(2) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );

  /* --------------------------- States --------------------------- */
  if (loading) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={(page) => navigate(`/main?tab=${page}`)}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={(page) => navigate(`/main?tab=${page}`)}>
        <div className="p-6">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300">
            {error}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  /* --------------------------- UI --------------------------- */
  return (
    <SidebarLayout currentPage="competitions" onPageChange={(page) => navigate(`/main?tab=${page}`)}>
      <div className="p-6">
        {/* Header */}
        <div className="bg-surface rounded-xl p-6 border border-border mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-secondary-text hover:text-primary-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-text" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-primary-text">
                  {payload?.competition?.title || 'Competition Leaderboard'}
                </h1>
                <p className="text-secondary-text">Competition Results & Leaderboard</p>
                {payload?.competition?.sponsor && (
                  <p className="text-secondary-text text-xs mt-1">
                    Sponsored by {payload.competition.sponsor}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-secondary-text text-sm">Total Submissions</div>
              <div className="text-primary-text font-extrabold text-2xl">
                {payload?.totalEntries ?? leaderboard.length ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* Top performers */}
{topThree.length > 0 && (
  <div className="mb-6">
    <h2 className="text-base font-semibold text-primary-text mb-3 flex items-center gap-2">
      Top Performers
    </h2>

    <div className="space-y-3">
      {/* Row 1: only #1 */}
      {topThree[0] && (
        <div className="flex justify-center">
          <div className="w-36">
            <PodiumCard entry={topThree[0]} rank={1} tone="gold" />
          </div>
        </div>
      )}

      {/* Row 2: #2 and #3 side by side */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {topThree[1] && (
          <PodiumCard entry={topThree[1]} rank={2} tone="silver" />
        )}
        {topThree[2] && (
          <PodiumCard entry={topThree[2]} rank={3} tone="bronze" />
        )}
      </div>
    </div>
  </div>
)}



        {/* Remaining */}
        {remaining.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-primary-text mb-3 flex items-center gap-2">
              <ListOrdered className="w-5 h-5" /> All Rankings
            </h2>
            <div className="space-y-3">
              {remaining.map((entry, i) => (
                <ListCard key={entry.id ?? `${entry.team_name}-${i}`} entry={entry} rank={i + 4} />
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {leaderboard.length === 0 && (
          <div className="text-center py-16">
            <Medal className="w-12 h-12 text-secondary-text mx-auto mb-3" />
            <h3 className="text-primary-text text-lg font-medium mb-1">No Results Yet</h3>
            <p className="text-secondary-text">Results will be published after evaluation.</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default CompetitionLeaderboard;
