// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import { apiService } from "../services/apiService";
// import { authService } from "../services/authService";

// const Pill = ({ children }) => (
//   <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold">
//     {children}
//   </span>
// );

// const TagChip = ({ text }) => (
//   <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs">
//     <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor">
//       <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11l4 4 10-10" />
//     </svg>
//     {text}
//   </span>
// );

// const useDebounced = (value, delay = 400) => {
//   const [v, setV] = useState(value);
//   useEffect(() => {
//     const id = setTimeout(() => setV(value), delay);
//     return () => clearTimeout(id);
//   }, [value, delay]);
//   return v;
// };

// const FeedScreen = () => {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const videoIdFromUrl = searchParams.get('video');
//   const videoUrlParam = searchParams.get('videoUrl');
// const videoTitleParam = searchParams.get('title') || '';
// const videoDescParam = searchParams.get('desc') || '';


//   const [navUser, setNavUser] = useState(authService.getUser?.() || null);
//   const isLoggedIn = useMemo(() => !!authService.getToken(), []);

//   const [search, setSearch] = useState("");
//   const debounced = useDebounced(search, 400);

//   const [videos, setVideos] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [fetchingMore, setFetchingMore] = useState(false);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const limit = 12;
//   const [hasNextPage, setHasNextPage] = useState(true);

//   const [expandedIndex, setExpandedIndex] = useState(null);
//   const [specificVideo, setSpecificVideo] = useState(null);
//   const [loadingSpecific, setLoadingSpecific] = useState(false);

//   const sentinelRef = useRef(null);

//   const normalizeMedia = (v) => {
//     const copy = { ...v };
//     const fix = (u) => (typeof u === "string" ? u : "");
//     copy.url = fix(v.url);
//     copy.thumbnail_url = fix(v.thumbnail_url ?? v.thumbnailUrl);
//     return copy;
//   };

//   const fmtAgo = (iso) => {
//     if (!iso) return "-";
//     const dt = new Date(iso);
//     const diff = Date.now() - dt.getTime();
//     const m = Math.floor(diff / 60000);
//     if (m < 1) return "just now";
//     if (m < 60) return `${m}m ago`;
//     const h = Math.floor(m / 60);
//     if (h < 24) return `${h}h ago`;
//     const d = Math.floor(h / 24);
//     if (d < 7) return `${d}d ago`;
//     return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
//   };

//   const fmtLen = (sec) => {
//     const s = Number(sec || 0);
//     const m = Math.floor(s / 60);
//     const r = s % 60;
//     return `${m}:${String(r).padStart(2, "0")}`;
//   };

//   const loadSpecificVideo = async (videoId) => {
//     setLoadingSpecific(true);
//     try {
//       const res = await apiService.getVideoById(videoId);
//       if (res?.success) {
//         const videoData = res.data?.video || res.video;
//         if (videoData) {
//           const normalized = normalizeMedia(videoData);
//           setSpecificVideo(normalized);
//           setExpandedIndex('specific');
//           setTimeout(() => {
//             window.scrollTo({ top: 0, behavior: 'smooth' });
//           }, 100);
//         }
//       }
//     } catch (e) {
//       console.error('Failed to load specific video:', e);
//       setError('Failed to load video');
//     } finally {
//       setLoadingSpecific(false);
//     }
//   };

//   const loadFeed = async ({ reset }) => {
//     try {
//       if (reset) {
//         setLoading(true);
//         setError(null);
//         setPage(1);
//         setHasNextPage(true);
//         setExpandedIndex(null);
//       } else {
//         if (!hasNextPage || fetchingMore) return;
//         setFetchingMore(true);
//       }

//       const res = await apiService.getFeed({
//         page: reset ? 1 : page,
//         limit,
//         search: debounced || undefined,
//       });

//       if (res?.success) {
//         const data = res.data || res;
//         const fetched =
//           (data?.videos || [])
//             .map((v) => ({ ...v }))
//             .map(normalizeMedia) ?? [];

//         const pagination = data?.pagination || {};
//         const next = !!pagination.hasNextPage;

//         setVideos((prev) => (reset ? fetched : [...prev, ...fetched]));
//         setHasNextPage(next);
//         setPage((p) => (reset ? 2 : p + 1));
//         setError(null);
//       } else {
//         setError(res?.message || "Failed to load feed");
//       }
//     } catch (e) {
//       setError(e?.message || "Network error");
//     } finally {
//       setLoading(false);
//       setFetchingMore(false);
//     }
//   };

//   useEffect(() => {
//   // If a direct URL is provided (preferred fallback)
//   if (videoUrlParam) {
//     const url = decodeURIComponent(videoUrlParam);
//     setSpecificVideo({
//       id: 'url-featured',
//       url,
//       thumbnail_url: '',
//       title: videoTitleParam || 'Shared video',
//       description: videoDescParam || '',
//       tags: [],
//       views_count: 0,
//       likes_count: 0,
//       length_sec: 0
//     });
//     setExpandedIndex('specific');
//     setTimeout(() => {
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }, 100);
//     return;
//   }

//   // If "video" looks like an ID, fetch by ID; if it looks like a URL, treat as URL
//   if (videoIdFromUrl) {
//     try {
//       const decoded = decodeURIComponent(videoIdFromUrl);
//       const looksLikeUrl = /^https?:\/\//i.test(decoded);
//       if (looksLikeUrl) {
//         setSpecificVideo({
//           id: 'url-featured',
//           url: decoded,
//           thumbnail_url: '',
//           title: videoTitleParam || 'Shared video',
//           description: videoDescParam || '',
//           tags: [],
//           views_count: 0,
//           likes_count: 0,
//           length_sec: 0
//         });
//         setExpandedIndex('specific');
//         setTimeout(() => {
//           window.scrollTo({ top: 0, behavior: 'smooth' });
//         }, 100);
//       } else {
//         loadSpecificVideo(decoded);
//       }
//     } catch {
//       loadSpecificVideo(videoIdFromUrl);
//     }
//   }
// }, [videoIdFromUrl, videoUrlParam, videoTitleParam, videoDescParam]);


//   useEffect(() => {
//     setNavUser(authService.getUser?.() || null);
//     loadFeed({ reset: true });
//   }, [debounced]);

//   useEffect(() => {
//     if (!sentinelRef.current) return;
//     const el = sentinelRef.current;
//     const obs = new IntersectionObserver(
//       (entries) => {
//         if (entries.some((e) => e.isIntersecting)) {
//           loadFeed({ reset: false });
//         }
//       },
//       { root: null, rootMargin: "400px 0px", threshold: 0 }
//     );
//     obs.observe(el);
//     return () => obs.disconnect();
//   }, [sentinelRef.current, hasNextPage, loading, fetchingMore]);

//   const onTogglePlay = (idx) => {
//     setExpandedIndex((cur) => (cur === idx ? null : idx));
//   };

//   const closeSpecificVideo = () => {
//   setSpecificVideo(null);
//   setExpandedIndex(null);
//   const newParams = new URLSearchParams(searchParams);
//   newParams.delete('video');
//   newParams.delete('videoUrl');
//   newParams.delete('title');
//   newParams.delete('desc');
//   setSearchParams(newParams);
// };


//   const renderVideoCard = (v, i, isSpecific = false) => {
//     const title = String(v.title ?? "");
//     const desc = String(v.description ?? "");
//     const tags = Array.isArray(v.tags) ? v.tags.map(String) : [];
//     const views = v.views_count ?? v.viewsCount ?? 0;
//     const likes = v.likes_count ?? v.likesCount ?? 0;
//     const lenSec = v.length_sec ?? v.lengthSec ?? 0;
//     const createdAt = v.created_at ?? v.createdAt;
//     const uploader =
//       (v.uploader && typeof v.uploader === "object" ? v.uploader.name : v.uploader_name) || "Unknown";
//     const isExpanded = isSpecific ? expandedIndex === 'specific' : expandedIndex === i;

//     return (
//       <div 
//         key={isSpecific ? 'specific' : (v._id || v.id || i)} 
//         className={`rounded-xl p-4 border ${isSpecific ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30' : 'bg-white/5 border-white/10'}`}
//       >
//         {isSpecific && (
//           <div className="flex items-center justify-between mb-3">
//             <div className="flex items-center gap-2">
//               <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
//                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
//               </svg>
//               <span className="text-purple-300 text-sm font-semibold">Featured Video</span>
//             </div>
//             <button
//               onClick={closeSpecificVideo}
//               className="text-white/60 hover:text-white text-xl font-bold leading-none px-2 py-1 hover:bg-white/10 rounded transition-colors"
//               title="Close"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <div className="flex gap-3">
//           <button
//             onClick={() => isSpecific ? setExpandedIndex(cur => cur === 'specific' ? null : 'specific') : onTogglePlay(i)}
//             className="relative w-[140px] h-[82px] shrink-0 rounded-lg overflow-hidden bg-white/10 hover:opacity-90 transition-opacity"
//             title={isExpanded ? "Close" : "Play"}
//           >
//             {v.thumbnail_url ? (
//               <img
//                 src={v.thumbnail_url}
//                 alt={title}
//                 className="w-full h-full object-cover"
//                 onError={(e) => (e.currentTarget.style.display = "none")}
//               />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center">
//                 <svg className="w-12 h-12 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                   <path d="M23 7l-7 5 7 5V7z" strokeWidth="2" />
//                   <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="2" />
//                 </svg>
//               </div>
//             )}
//             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
//               <svg className="w-10 h-10 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
//                 {isExpanded ? (
//                   <path d="M6 6h12v12H6z" />
//                 ) : (
//                   <path d="M8 5v14l11-7z" />
//                 )}
//               </svg>
//             </div>
//           </button>

//           <div className="min-w-0 flex-1">
//             <div className="text-white font-bold text-[15px] line-clamp-2 mb-1">{title}</div>
//             {desc && <div className="text-white/70 text-xs mt-1 line-clamp-2">{desc}</div>}
//             <div className="mt-2 flex flex-wrap items-center gap-2">
//               <Pill>👤 {uploader}</Pill>
//               <Pill>👁️ {views}</Pill>
//               <Pill>❤ {likes}</Pill>
//               {createdAt && <Pill>⏱ {fmtAgo(createdAt)}</Pill>}
//             </div>
//           </div>

//           {!isExpanded && (
//             <div className="self-start">
//               <span className="px-2 py-1 rounded bg-black/70 text-white text-[11px] font-bold">
//                 {fmtLen(lenSec)}
//               </span>
//             </div>
//           )}
//         </div>

//         {tags.length > 0 && (
//           <div className="mt-3 flex flex-wrap gap-2">
//             {tags.slice(0, 8).map((t, idx) => {
//               let txt = t.trim();
//               if (txt.startsWith("#")) txt = txt.slice(1).trim();
//               if (!txt) return null;
//               return <TagChip key={`${txt}-${idx}`} text={txt} />;
//             })}
//           </div>
//         )}

//         {isExpanded && v.url && (
//           <div className="mt-4 rounded-xl overflow-hidden shadow-2xl">
//             <div className="aspect-video bg-black">
//               <video 
//                 src={v.url} 
//                 controls 
//                 autoPlay 
//                 className="w-full h-full"
//                 style={{ width: "100%", height: "100%" }}
//               />
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="flex-1 p-6">
//       <div className="mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-white mb-1">Feed</h1>
//           <p className="text-white/60">Watch 60-sec submissions from the community</p>
//         </div>
//       </div>

//       <div className="mb-4">
//         <div className="h-12 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center hover:border-white/20 transition-colors">
//           <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/70" fill="none" stroke="currentColor">
//             <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
//             <path d="m21 21-4.3-4.3" strokeWidth="2"></path>
//           </svg>
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search videos, descriptions, #tags…"
//             className="flex-1 bg-transparent outline-none text-white placeholder-white/60 px-3"
//           />
//           {search && (
//             <button
//               onClick={() => setSearch("")}
//               className="text-white/70 hover:text-white text-sm px-3 py-1 rounded hover:bg-white/10 transition-colors"
//             >
//               Clear
//             </button>
//           )}
//         </div>
//       </div>

//       {loading && !specificVideo && (
//         <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden mb-4">
//           <div className="h-full w-1/3 animate-pulse bg-white/30" />
//         </div>
//       )}

//       {loadingSpecific && (
//         <div className="flex items-center justify-center py-8">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
//         </div>
//       )}

//       {error && !loading && !specificVideo && (
//         <div className="mt-6 flex flex-col items-center text-center">
//           <svg className="w-12 h-12 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//             <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2"/>
//           </svg>
//           <p className="text-white/80 mt-2">{error}</p>
//           <button
//             onClick={() => loadFeed({ reset: true })}
//             className="mt-3 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-black font-semibold transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       )}

//       {!error && !loading && !specificVideo && videos.length === 0 && (
//         <div className="mt-12 flex flex-col items-center text-center">
//           <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//             <path d="M23 7l-7 5 7 5V7z" strokeWidth="2" />
//             <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="2" />
//           </svg>
//           <p className="text-white/80 text-lg mt-4 font-semibold">No videos found</p>
//           <p className="text-white/50 mt-1">Try a different search or check back later</p>
//         </div>
//       )}

//       <div className="space-y-4">
//         {specificVideo && renderVideoCard(specificVideo, 0, true)}

//         {videos.map((v, i) => renderVideoCard(v, i, false))}

//         {hasNextPage && videos.length > 0 && (
//           <div ref={sentinelRef} className="py-8 flex items-center justify-center">
//             {fetchingMore ? (
//               <div className="flex items-center gap-2 text-white/80 text-sm">
//                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
//                 <span>Loading more videos...</span>
//               </div>
//             ) : (
//               <div className="text-white/40 text-sm">Scroll to load more</div>
//             )}
//           </div>
//         )}

//         {!hasNextPage && videos.length > 0 && (
//           <div className="py-8 text-center text-white/40 text-sm">
//             You've reached the end
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FeedScreen;

// src/pages/FeedScreen.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";

// ✅ Lucide icons to match CompetitionScreen style
import {
  Search,
  X,
  Star,
  Play,
  Square,
  User as UserIcon,
  Eye,
  Heart,
  Clock3,
  Tag as TagIcon,
  Film,
  AlertTriangle,
} from "lucide-react";

const useDebounced = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

const Pill = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background text-primary-text/90 border border-border text-sm font-semibold">
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </span>
);

const TagChip = ({ text }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background text-primary-text/80 border border-border text-xs">
    <TagIcon className="w-3.5 h-3.5" />
    {text}
  </span>
);

const FeedScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const videoIdFromUrl = searchParams.get("video");
  const videoUrlParam = searchParams.get("videoUrl");
  const videoTitleParam = searchParams.get("title") || "";
  const videoDescParam = searchParams.get("desc") || "";

  const [navUser, setNavUser] = useState(authService.getUser?.() || null);
  const isLoggedIn = useMemo(() => !!authService.getToken(), []);

  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 400);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [hasNextPage, setHasNextPage] = useState(true);

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [specificVideo, setSpecificVideo] = useState(null);
  const [loadingSpecific, setLoadingSpecific] = useState(false);

  const sentinelRef = useRef(null);

  const normalizeMedia = (v) => {
    const copy = { ...v };
    const fix = (u) => (typeof u === "string" ? u : "");
    copy.url = fix(v.url);
    copy.thumbnail_url = fix(v.thumbnail_url ?? v.thumbnailUrl);
    return copy;
  };

  const fmtAgo = (iso) => {
    if (!iso) return "—";
    const dt = new Date(iso);
    const diff = Date.now() - dt.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const fmtLen = (sec) => {
    const s = Number(sec || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const loadSpecificVideo = async (videoId) => {
    setLoadingSpecific(true);
    try {
      const res = await apiService.getVideoById(videoId);
      if (res?.success) {
        const videoData = res.data?.video || res.video;
        if (videoData) {
          const normalized = normalizeMedia(videoData);
          setSpecificVideo(normalized);
          setExpandedIndex("specific");
          setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
        }
      }
    } catch {
      setError("Failed to load video");
    } finally {
      setLoadingSpecific(false);
    }
  };

  const loadFeed = async ({ reset }) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasNextPage(true);
        setExpandedIndex(null);
      } else {
        if (!hasNextPage || fetchingMore) return;
        setFetchingMore(true);
      }

      const res = await apiService.getFeed({
        page: reset ? 1 : page,
        limit,
        search: debounced || undefined,
      });

      if (res?.success) {
        const data = res.data || res;
        const fetched = (data?.videos || []).map((v) => ({ ...v })).map(normalizeMedia) ?? [];
        const next = !!(data?.pagination || {}).hasNextPage;

        setVideos((prev) => (reset ? fetched : [...prev, ...fetched]));
        setHasNextPage(next);
        setPage((p) => (reset ? 2 : p + 1));
        setError(null);
      } else {
        setError(res?.message || "Failed to load feed");
      }
    } catch (e) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  // URL-driven selection (ID or direct URL)
  useEffect(() => {
    if (videoUrlParam) {
      const url = decodeURIComponent(videoUrlParam);
      setSpecificVideo({
        id: "url-featured",
        url,
        thumbnail_url: "",
        title: videoTitleParam || "Shared video",
        description: videoDescParam || "",
        tags: [],
        views_count: 0,
        likes_count: 0,
        length_sec: 0,
      });
      setExpandedIndex("specific");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
      return;
    }

    if (videoIdFromUrl) {
      try {
        const decoded = decodeURIComponent(videoIdFromUrl);
        const looksLikeUrl = /^https?:\/\//i.test(decoded);
        if (looksLikeUrl) {
          setSpecificVideo({
            id: "url-featured",
            url: decoded,
            thumbnail_url: "",
            title: videoTitleParam || "Shared video",
            description: videoDescParam || "",
            tags: [],
            views_count: 0,
            likes_count: 0,
            length_sec: 0,
          });
          setExpandedIndex("specific");
          setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
        } else {
          loadSpecificVideo(decoded);
        }
      } catch {
        loadSpecificVideo(videoIdFromUrl);
      }
    }
  }, [videoIdFromUrl, videoUrlParam, videoTitleParam, videoDescParam]);

  useEffect(() => {
    setNavUser(authService.getUser?.() || null);
    loadFeed({ reset: true });
  }, [debounced]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadFeed({ reset: false });
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelRef.current, hasNextPage, loading, fetchingMore]); // eslint-disable-line

  const onTogglePlay = (idx) => setExpandedIndex((cur) => (cur === idx ? null : idx));

  const closeSpecificVideo = () => {
    setSpecificVideo(null);
    setExpandedIndex(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("video");
    newParams.delete("videoUrl");
    newParams.delete("title");
    newParams.delete("desc");
    setSearchParams(newParams);
  };

  const renderVideoCard = (v, i, isSpecific = false) => {
    const title = String(v.title ?? "");
    const desc = String(v.description ?? "");
    const tags = Array.isArray(v.tags) ? v.tags.map(String) : [];
    const views = v.views_count ?? v.viewsCount ?? 0;
    const likes = v.likes_count ?? v.likesCount ?? 0;
    const lenSec = v.length_sec ?? v.lengthSec ?? 0;
    const createdAt = v.created_at ?? v.createdAt;
    const uploader =
      (v.uploader && typeof v.uploader === "object" ? v.uploader.name : v.uploader_name) || "Unknown";
    const isExpanded = isSpecific ? expandedIndex === "specific" : expandedIndex === i;

    return (
      <div
        key={isSpecific ? "specific" : (v._id || v.id || i)}
        className={[
          "rounded-xl p-6 border transition-colors",
          isSpecific
            ? "bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-border"
            : "bg-surface border-border hover:bg-border",
        ].join(" ")}
      >
        {isSpecific && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-primary-text text-sm font-semibold">Featured Video</span>
            </div>
            <button
              onClick={closeSpecificVideo}
              className="text-secondary-text hover:text-primary-text text-xl font-bold leading-none px-2 py-1 bg-surface hover:bg-border border border-border rounded transition-colors"
              title="Close"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() =>
              isSpecific
                ? setExpandedIndex((cur) => (cur === "specific" ? null : "specific"))
                : onTogglePlay(i)
            }
            className="relative w-[160px] h-[90px] shrink-0 rounded-lg overflow-hidden bg-background border border-border hover:opacity-90 transition-opacity"
            title={isExpanded ? "Close" : "Play"}
          >
            {v.thumbnail_url ? (
              <img
                src={v.thumbnail_url}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-10 h-10 text-secondary-text" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              {isExpanded ? (
                <Square className="w-9 h-9 text-white drop-shadow-lg" />
              ) : (
                <Play className="w-9 h-9 text-white drop-shadow-lg" />
              )}
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="text-primary-text text-lg font-bold line-clamp-2">{title}</h3>
            {desc && <p className="text-secondary-text text-sm mt-1 line-clamp-2">{desc}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill icon={UserIcon}>{uploader}</Pill>
              <Pill icon={Eye}>{views}</Pill>
              <Pill icon={Heart}>{likes}</Pill>
              {createdAt && <Pill icon={Clock3}>{fmtAgo(createdAt)}</Pill>}
            </div>
          </div>

          {!isExpanded && (
            <div className="self-start">
              <span className="px-2 py-1 rounded bg-background text-primary-text/90 border border-border text-[11px] font-bold inline-flex items-center gap-1">
                <Clock3 className="w-3.5 h-3.5" />
                {fmtLen(lenSec)}
              </span>
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 8).map((t, idx) => {
              let txt = t.trim();
              if (txt.startsWith("#")) txt = txt.slice(1).trim();
              if (!txt) return null;
              return <TagChip key={`${txt}-${idx}`} text={txt} />;
            })}
          </div>
        )}

        {isExpanded && v.url && (
          <div className="mt-5 rounded-xl overflow-hidden border border-border">
            <div className="aspect-video bg-black">
              <video src={v.url} controls autoPlay className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* Header — mirrors CompetitionScreen typography */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-primary-text">Feed</h2>
              <p className="text-secondary-text">Watch 60-sec submissions from the community</p>
            </div>
          </div>

          {/* Search — same shell as CompetitionScreen */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-secondary-text" />
            </div>
            <input
              type="text"
              placeholder="Search videos, descriptions, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {!!search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-primary-text"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Loaders / errors — same palette as CompetitionScreen */}
        {loading && !specificVideo && (
          <div className="mb-4">
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary/40 animate-pulse"></div>
            </div>
          </div>
        )}

        {loadingSpecific && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {error && !loading && !specificVideo && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Error loading feed</p>
                <p className="text-red-400/90 text-sm">{error}</p>
              </div>
              <button
                onClick={() => loadFeed({ reset: true })}
                className="px-3 py-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 rounded-lg text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!error && !loading && !specificVideo && videos.length === 0 && (
          <div className="text-center py-16">
            <Film className="w-14 h-14 text-secondary-text mx-auto mb-4" />
            <h3 className="text-primary-text text-lg font-medium mb-2">No videos found</h3>
            <p className="text-secondary-text">Try a different search or check back later</p>
          </div>
        )}

        {/* List */}
        <div className="grid gap-6">
          {specificVideo && renderVideoCard(specificVideo, 0, true)}
          {videos.map((v, i) => renderVideoCard(v, i, false))}
        </div>

        {/* Infinite scroll sentinel / endcap */}
        {hasNextPage && videos.length > 0 && (
          <div ref={sentinelRef} className="py-8 flex items-center justify-center">
            {fetchingMore ? (
              <div className="flex items-center gap-2 text-secondary-text text-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                <span>Loading more videos...</span>
              </div>
            ) : (
              <div className="text-secondary-text text-sm opacity-60">Scroll to load more</div>
            )}
          </div>
        )}

        {!hasNextPage && videos.length > 0 && (
          <div className="py-8 text-center text-secondary-text text-sm opacity-60">
            You’ve reached the end
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedScreen;
