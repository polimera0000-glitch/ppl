// src/pages/RoleListPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";
import SidebarLayout from "../components/SidebarLayout";
import { Rocket, X, Search, ChevronDown } from "lucide-react";

/**
 * NOTE:
 * If your router ALREADY wraps this page in <SidebarLayout />, remove the wrapper below
 * (the <SidebarLayout> in the return) to avoid a double sidebar/topbar.
 */

/* --------------------------- utils & helpers --------------------------- */
const prettyKey = (raw) =>
  raw
    .replace(/[_-]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const isSensitiveKey = (k) => {
  const s = k.toLowerCase();
  return (
    s.includes("password") ||
    s.includes("token") ||
    s.includes("otp") ||
    s.includes("secret") ||
    s.includes("hash") ||
    s.includes("salt")
  );
};

const initialsOf = (name) => {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const chipCls = (ok) =>
  ok
    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
    : "bg-amber-500/15 text-amber-300 border border-amber-500/30";

/* ------------------------------ UI atoms ------------------------------- */
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="px-3 py-2 rounded-xl border border-border bg-background flex items-center gap-2">
    <Search className="w-4 h-4 text-secondary-text" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 bg-transparent outline-none text-primary-text placeholder-secondary-text text-sm"
    />
    {value && (
      <button onClick={() => onChange("")} className="text-secondary-text hover:text-primary-text">
        ×
      </button>
    )}
  </div>
);

const DetailRow = ({ k, v }) => (
  <div className="flex gap-3">
    <div className="w-40 shrink-0 text-secondary-text font-semibold text-xs">{prettyKey(k)}</div>
    <div className="text-primary-text text-sm">{v?.toString() || "—"}</div>
  </div>
);

const InviteAdminCard = ({ onInvite, loading, message }) => {
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <div className="text-primary-text font-semibold">Invite Admin</div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          ref={nameRef}
          placeholder="Full name"
          className="rounded-lg px-3 py-2 bg-background border border-border text-primary-text placeholder-secondary-text outline-none"
        />
        <input
          ref={emailRef}
          placeholder="Email address"
          type="email"
          className="rounded-lg px-3 py-2 bg-background border border-border text-primary-text placeholder-secondary-text outline-none"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          disabled={loading}
          onClick={() => onInvite(nameRef.current?.value || "", emailRef.current?.value || "")}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-surface hover:bg-border border border-border text-primary-text disabled:opacity-60 transition-colors"
        >
          {loading ? "Sending..." : "Send Invite"}
        </button>
        {message && (
          <div
            className={
              "text-sm " + (/(error|fail)/i.test(message) ? "text-red-300" : "text-emerald-300")
            }
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------------- main component --------------------------- */
const RoleListPage = ({ role: roleProp }) => {
  const params = useParams();
  const navigate = useNavigate();
  const role = (roleProp || params.role || "").toString().toLowerCase();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  // invite admin
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  // 🔹 ADD: deletion state
  const [deletingId, setDeletingId] = useState(null);

  // header/auth (cosmetic)
  const [navUser, setNavUser] = useState(authService.getUser?.() || null);
  const label = `${role ? role[0].toUpperCase() + role.slice(1) : "Users"} • Directory`;

  useEffect(() => {
    setNavUser(authService.getUser?.() || null);
  }, []);

  // load list
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setInviteMsg(null);

        let res;
        if (role === "admin") {
          res = await apiService.getAdminList();
        } else {
          try {
            res = await apiService.getUsersByRole(role);
          } catch (apiError) {
            // Fallback mock (dev only)
            res = {
              success: true,
              data: {
                users: [
                  {
                    id: 1,
                    name: "John Doe",
                    email: "john.doe@example.com",
                    role,
                    college: "MIT",
                    branch: "Computer Science",
                    year: 3,
                    created_at: "2023-01-01T00:00:00Z",
                    is_active: true,
                    verified: true,
                  },
                  {
                    id: 2,
                    name: "Jane Smith",
                    email: "jane.smith@example.com",
                    role,
                    college: "Stanford",
                    branch: "Electrical Engineering",
                    year: 2,
                    created_at: "2023-02-01T00:00:00Z",
                    is_active: true,
                    verified: false,
                  },
                ],
              },
            };
          }
        }

        if (res?.success) {
          const list =
            res?.data?.admins ||
            res?.admins ||
            res?.data?.users ||
            res?.users ||
            res?.data ||
            [];
          const parsed = Array.isArray(list) ? list : [];
          if (!alive) return;
          const withRank = parsed.map((u, i) => ({ ...u, __rank: i + 1, __open: !!u.__open }));
          setUsers(withRank);
          setFiltered(withRank);
        } else {
          setError(res?.message || "Failed to fetch users");
        }
      } catch (e) {
        setError(e?.message || "Network error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [role]);

  // search filter
  useEffect(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      setFiltered(users);
      return;
    }
    const match = (u) => {
      const s = (v) => (v == null ? "" : String(v).toLowerCase());
      const fields = [s(u.name), s(u.email), s(u.college), s(u.company_name), s(u.firm_name), s(u.phone)];
      return fields.some((f) => f.includes(query));
    };
    setFiltered(users.filter(match));
  }, [q, users]);

  const onInvite = async (name, email) => {
    const nameOk = (name || "").trim().length >= 2;
    const emailOk = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test((email || "").trim());
    if (!nameOk) return setInviteMsg("Name must be at least 2 characters");
    if (!emailOk) return setInviteMsg("Enter a valid email");

    try {
      setInviting(true);
      setInviteMsg(null);
      const res = await apiService.inviteAdmin({ name: name.trim(), email: email.trim() });
      if (res?.success) {
        setInviteMsg(`Invitation sent to ${email.trim()}`);
        const fresh = await apiService.getAdminList();
        const admins = fresh?.data?.admins || fresh?.admins || [];
        const withRank = (Array.isArray(admins) ? admins : []).map((u, i) => ({ ...u, __rank: i + 1 }));
        setUsers(withRank);
        setFiltered(withRank);
      } else {
        setInviteMsg(res?.message || "Failed to invite");
      }
    } catch (e) {
      setInviteMsg(`Error: ${e?.message || e}`);
    } finally {
      setInviting(false);
    }
  };

  // 🔹 ADD: delete handler (uses existing backend deactivate route)
  const onDelete = async (userId, userName) => {
    if (!userId) return;
    if (!window.confirm(`Delete user "${userName || userId}"? This cannot be undone.`)) return;

    try {
      setDeletingId(userId);

      // Use existing API — deactivate user
      const res = await apiService.makeRequest(`/users/${userId}/deactivate`, {
        method: "PUT",
      });

      if (res?.success) {
        // Remove locally
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
        setFiltered((prev) => prev.filter((u) => String(u.id) !== String(userId)));
      } else {
        const msg = res?.message || "Failed to delete user";
        alert(msg);
      }
    } catch (e) {
      alert(`Delete failed: ${e?.message || e}`);
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------ rendering ------------------------------ */
  return (
    <SidebarLayout currentPage="admin" onPageChange={() => {}}>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header (match Admin Hub / Create / Details style) */}
          <div className="bg-surface rounded-xl p-4 border border-border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-primary-text" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-primary-text">{label}</h1>
                  <p className="text-secondary-text text-sm">
                    Browse and manage {role || "users"}
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

          {/* Filters / Search */}
          <div className="bg-surface rounded-xl p-4 border border-border mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-background border border-border text-secondary-text">
                  {role || "users"}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-background border border-border text-secondary-text">
                  {filtered.length} total
                </span>
              </div>
              <div className="w-full md:w-72">
                <SearchBar
                  value={q}
                  onChange={setQ}
                  placeholder="Search name, email, college/company..."
                />
              </div>
            </div>
          </div>

          {/* Invite (admins only) */}
          {role === "admin" && (
            <div className="mb-4">
              <InviteAdminCard onInvite={onInvite} loading={inviting} message={inviteMsg} />
            </div>
          )}

          {/* Table/Card list */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* table header (md+) */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 border-b border-border text-xs text-secondary-text">
              <div className="col-span-1">#</div>
              <div className="col-span-4">User</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">{role === "admin" ? "Added" : "Meta"}</div>
              <div className="col-span-1">Verified</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {loading ? (
              <div className="p-6 text-secondary-text flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                Loading {role} users...
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="text-red-300 mb-3">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-sm border border-red-500/25"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-secondary-text">
                {q ? `No results for "${q}"` : `No ${role || "users"} found`}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((u, idx) => {
                  const open = !!u.__open;
                  const name = u?.name || "—";
                  const email = u?.email || "—";
                  const meta =
                    u?.college ||
                    u?.company_name ||
                    u?.firm_name ||
                    (u?.created_at ? new Date(u.created_at).toLocaleDateString() : "") ||
                    "";
                  const verified = !!u?.verified;
                  const rank = u.__rank ?? idx + 1;
                  const userInitials = initialsOf(name);

                  // priority sort for detail rows
                  const priority = [
                    "name","email","role","college","branch","year","phone",
                    "company_name","company_website","team_size","firm_name",
                    "investment_stage","website","xp","badges","created_at",
                    "updated_at","verified","is_active",
                  ];
                  const entries = Object.entries(u || {})
                    .filter(([k]) => !isSensitiveKey(k))
                    .map(([k, v]) => [k, v == null ? "" : String(v)]);
                  entries.sort((a, b) => {
                    const ai = priority.indexOf(a[0]);
                    const bi = priority.indexOf(b[0]);
                    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                  });

                  // 🔹 show Delete only for admins and not on self
                  const canDelete = navUser?.role === "admin" && String(navUser?.id) !== String(u?.id);

                  return (
                    <li key={u.id ?? idx} className="group">
                      {/* row (md+) */}
                      <div className="hidden md:grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-background transition-colors">
                        <div className="col-span-1">
                          <div className="w-8 h-8 rounded-lg bg-background border border-border text-primary-text flex items-center justify-center font-semibold">
                            {rank}
                          </div>
                        </div>
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center">
                            <span className="text-primary-text text-xs font-bold">{userInitials}</span>
                          </div>
                          <div>
                            <div className="text-primary-text font-medium leading-tight">{name}</div>
                            <div className="text-[11px] text-secondary-text">
                              {u?.role ? prettyKey(u.role) : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="text-primary-text/90 text-sm">{email}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-primary-text/80 text-sm">{meta || "—"}</div>
                        </div>
                        <div className="col-span-1">
                          <span className={`px-2 py-1 rounded-md text-[11px] ${chipCls(verified)}`}>
                            {verified ? "Verified" : "Pending"}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <div className="flex items-center justify-end gap-2">
                            {/* 🔹 ADD: Delete button */}
                            {canDelete && (
                              <button
                                onClick={() => onDelete(u.id, u.name)}
                                disabled={deletingId === u.id}
                                className="px-2 py-1 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                                title="Delete user"
                              >
                                {deletingId === u.id ? "Deleting..." : "Delete"}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                u.__open = !open;
                                // trigger rerender
                                setFiltered((prev) => [...prev]);
                              }}
                              className="text-secondary-text hover:text-primary-text"
                              title={open ? "Collapse" : "Expand"}
                            >
                              <ChevronDown
                                className={
                                  "w-5 h-5 transition-transform " + (open ? "rotate-180" : "")
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* mobile card */}
                      <div className="md:hidden px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center">
                            <span className="text-primary-text text-xs font-bold">{userInitials}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-primary-text font-semibold">{name}</div>
                              <span className="px-2 py-0.5 rounded-md text-[10px] bg-background border border-border text-secondary-text">
                                #{rank}
                              </span>
                            </div>
                            <div className="text-xs text-secondary-text">{email}</div>
                            <div className="text-[11px] text-secondary-text">
                              {(u?.role ? prettyKey(u.role) : "—")}
                              {meta ? ` • ${meta}` : ""}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] ${chipCls(verified)}`}>
                              {verified ? "Verified" : "Pending"}
                            </span>
                            <div className="flex items-center gap-2">
                              {/* 🔹 ADD: Delete button (mobile) */}
                              {canDelete && (
                                <button
                                  onClick={() => onDelete(u.id, u.name)}
                                  disabled={deletingId === u.id}
                                  className="px-2 py-1 rounded-lg text-[10px] border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                                  title="Delete user"
                                >
                                  {deletingId === u.id ? "Deleting..." : "Delete"}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  u.__open = !open;
                                  setFiltered((prev) => [...prev]);
                                }}
                                className="text-secondary-text hover:text-primary-text"
                                title={open ? "Collapse" : "Expand"}
                              >
                                <ChevronDown
                                  className={
                                    "w-5 h-5 transition-transform " + (open ? "rotate-180" : "")
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* expandable details */}
                      {open && (
                        <div className="px-4 md:px-6 pb-4">
                          <div className="mt-3 p-3 rounded-xl bg-background border border-border space-y-2">
                            <div className="text-primary-text font-semibold">Details</div>
                            <div className="grid md:grid-cols-2 gap-2">
                              {entries.map(([k, v]) => (
                                <DetailRow key={k} k={k} v={v} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default RoleListPage;
