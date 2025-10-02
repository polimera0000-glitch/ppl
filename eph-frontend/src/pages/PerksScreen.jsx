import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";

const Pill = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold">
    {children}
  </span>
);

const useDebounced = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

const PerksScreen = () => {
  // header/auth (same shell as Profile/Feed)
  const [navUser, setNavUser] = useState(authService.getUser?.() || null);
  const isLoggedIn = useMemo(() => !!authService.getToken(), []);
  const initials = (navUser?.name?.[0] || "U").toString().toUpperCase();

  // search / list state
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 400);

  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [hasNextPage, setHasNextPage] = useState(true);

  // redeem
  const [redeemingId, setRedeemingId] = useState(null);

  // infinite scroll sentinel
  const sentinelRef = useRef(null);

  const logout = async () => {
    try {
      await apiService.logout().catch(() => {});
    } finally {
      authService.clear?.();
      window.location.replace("/roles");
    }
  };

  const loadPerks = async ({ reset }) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasNextPage(true);
      } else {
        if (!hasNextPage || fetchingMore) return;
        setFetchingMore(true);
      }

      const res = await apiService.getPerks({
        page: reset ? 1 : page,
        limit,
        search: debounced || undefined,
      });

      if (res?.success) {
        const data = res.data || res;
        const list = data?.perks || data?.items || [];
        const pagination = data?.pagination || {};
        const next = !!pagination.hasNextPage;

        setPerks((prev) => (reset ? list : [...prev, ...list]));
        setHasNextPage(next);
        setPage((p) => (reset ? 2 : p + 1));
        setError(null);
      } else {
        setError(res?.message || "Failed to load perks");
      }
    } catch (e) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  // initial + on search change
  useEffect(() => {
    setNavUser(authService.getUser?.() || null);
    loadPerks({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadPerks({ reset: false });
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, hasNextPage, loading, fetchingMore]);

  const redeem = async (perkId) => {
    if (!isLoggedIn) {
      alert("Please log in to redeem a perk.");
      return;
    }
    try {
      setRedeemingId(perkId);
      const res = await apiService.redeemPerk(perkId);
      if (res?.success) {
        // Optimistically flag as redeemed. Backend may return code/url.
        const updated = perks.map((p) =>
          (p._id || p.id) === perkId ? { ...p, redeemed: true, status: "redeemed" } : p
        );
        setPerks(updated);

        const code = res?.data?.code || res?.code;
        const url = res?.data?.url || res?.redeemUrl;
        let msg = "Perk redeemed!";
        if (code) msg += ` Code: ${code}`;
        if (url) msg += `\nOpen: ${url}`;
        alert(msg);
        if (url) window.open(url, "_blank");
      } else {
        alert(res?.message || "Failed to redeem perk");
      }
    } catch (e) {
      alert(e?.message || "Network error while redeeming");
    } finally {
      setRedeemingId(null);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="flex-1 p-6">
      {/* Top header (same as others) */}
      <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Perks</h1>
            <p className="text-white/60">
              Unlock discounts, credits, and goodies for your projects
            </p>
          </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="h-12 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/70" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
            <path d="m21 21-4.3-4.3" strokeWidth="2"></path>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search perks, partners, categories…"
            className="flex-1 bg-transparent outline-none text-white placeholder-white/60 px-3"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-white/70 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 animate-pulse bg-white/30" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-6 flex flex-col items-center text-center">
          <svg className="w-12 h-12 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2"/>
          </svg>
          <p className="text-white/80 mt-2">{error}</p>
          <button
            onClick={() => loadPerks({ reset: true })}
            className="mt-3 px-3 py-1.5 rounded-lg bg-amber-400 text-black font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!error && !loading && perks.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 13V7a2 2 0 0 0-2-2h-5" strokeWidth="2"/>
            <path d="M8 21H6a2 2 0 0 1-2-2v-5" strokeWidth="2"/>
            <path d="M3 3l18 18" strokeWidth="2"/>
          </svg>
          <p className="text-white/80 text-lg mt-4">No perks found</p>
          <p className="text-white/50">Try a different search</p>
        </div>
      )}

      {/* Grid list */}
      <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
        {perks.map((p) => {
          const id = p._id || p.id;
          const title = p.title || p.name || "Perk";
          const partner = p.partner || p.vendor || p.brand || "";
          const desc = p.description || "";
          const badge = p.category || p.type || "";
          const value = p.value || p.benefit || ""; // e.g., "3 months Pro", "₹5,000 credits"
          const expires = p.expires_at || p.expiresAt || p.valid_till || p.validTill;
          const already = p.redeemed === true || p.status === "redeemed" || p.claimed === true;

          return (
            <div key={id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="text-white font-bold text-[15px] truncate">{title}</div>
                {badge && <Pill>{badge}</Pill>}
              </div>

              {partner && (
                <div className="text-white/70 text-sm mt-1">by {partner}</div>
              )}

              {value && (
                <div className="mt-2 text-emerald-300 text-sm font-semibold">{value}</div>
              )}

              {desc && (
                <div className="mt-2 text-white/70 text-sm line-clamp-3">{desc}</div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.pointsCost ? (
                  <Pill>⭐ {p.pointsCost} XP</Pill>
                ) : null}
                {expires && <Pill>⏳ Expires {fmtDate(expires)}</Pill>}
                {p.limited === true && <Pill>🎟 Limited</Pill>}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  disabled={already || redeemingId === id}
                  onClick={() => redeem(id)}
                  className={`px-3 py-2 rounded-lg border text-sm font-semibold ${
                    already
                      ? "bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
                      : "bg-amber-400 text-black border-amber-300 hover:brightness-95"
                  }`}
                >
                  {already ? "Redeemed" : redeemingId === id ? "Redeeming…" : "Redeem"}
                </button>
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm hover:bg-white/15"
                  >
                    Details
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasNextPage && (
        <div ref={sentinelRef} className="py-6 flex items-center justify-center">
          {fetchingMore ? (
            <div className="text-white/80 text-sm">Loading more…</div>
          ) : (
            <div className="text-white/40 text-sm">Scroll to load more</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerksScreen;
