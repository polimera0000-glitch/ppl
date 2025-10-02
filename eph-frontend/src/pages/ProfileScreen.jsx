// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { apiService } from "../services/apiService";
// import { authService } from "../services/authService";

// /**
//  * Web ProfileScreen
//  * - name/role/xp/badges/verified + editable details (college/branch/year/skills/phone/org/country)
//  * - loads local user first (from authService), then fetches fresh /auth/profile
//  * - update profile via PUT /auth/profile
//  * - simple skill chips add/remove (comma-separated or single)
//  */

// const Pill = ({ children }) => (
//   <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold">
//     {children}
//   </span>
// );

// const SkillChip = ({ text, canRemove, onRemove }) => (
//   <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm">
//     <span className="truncate max-w-[160px]">{text}</span>
//     {canRemove && (
//       <button
//         type="button"
//         onClick={() => onRemove?.(text)}
//         className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-md hover:bg-white/10"
//         title="Remove"
//       >
//         ×
//       </button>
//     )}
//   </span>
// );

// const LabelValue = ({ label, children }) => (
//   <div className="flex flex-col sm:flex-row sm:items-start gap-2">
//     <div className="sm:w-32 shrink-0 text-white/70 font-semibold">{label}</div>
//     <div className="text-white">{children ?? "-"}</div>
//   </div>
// );

// /** Generic text input with label; forwards refs and extra props */
// const TextField = React.forwardRef(
//   ({ label, hint, type = "text", defaultValue, onChange, ...rest }, ref) => (
//     <div className="flex flex-col sm:flex-row gap-2">
//       <div className="sm:w-32 shrink-0 text-white/70 font-semibold">
//         {label}
//       </div>
//       <input
//         ref={ref}
//         type={type}
//         defaultValue={defaultValue}
//         onChange={onChange}
//         placeholder={hint}
//         className="flex-1 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/60 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
//         {...rest}
//       />
//     </div>
//   )
// );

// const ProfileScreen = () => {
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [editing, setEditing] = useState(false);
//   const [error, setError] = useState(null);

//   const [user, setUser] = useState(null); // canonical copy
//   const [navUser, setNavUser] = useState(null); // for header name/avatar

//   // form refs
//   const nameRef = useRef(null);
//   const collegeRef = useRef(null);
//   const branchRef = useRef(null);
//   const yearRef = useRef(null);
//   const skillInputRef = useRef(null);
//   const phoneRef = useRef(null);
//   const orgRef = useRef(null);
//   const countryRef = useRef(null);

//   const [skills, setSkills] = useState([]);
//   const isAdmin = (user?.role || "").toLowerCase() === "admin";

//   const isLoggedIn = useMemo(() => !!authService.getToken(), []);

//   // digits-only sanitizer for phone
//   const handlePhoneChange = (e) => {
//     e.target.value = e.target.value.replace(/\D/g, "").slice(0, 15);
//   };

//   // ---- load (local -> remote) ----
//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // 1) local
//         const local = authService.getUser?.();
//         if (local) {
//           applyUserToForm(local);
//           setUser(local);
//           setNavUser(local);
//         }

//         // 2) remote
//         if (authService.getToken()) {
//           const res = await apiService.getProfile();
//           if (res?.success) {
//             const remote = res?.data?.user ?? res?.user ?? res?.data ?? null;
//             if (remote) {
//               authService.setUser?.(remote); // keep storage in sync if your authService supports it
//               applyUserToForm(remote);
//               setUser(remote);
//               setNavUser(remote);
//             }
//           } else if (res && res.message) {
//             setError(res.message);
//           }
//         }
//       } catch (e) {
//         setError(e?.message || "Failed to load profile");
//       } finally {
//         setLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const applyUserToForm = (u) => {
//     // set inputs via defaultValue (uncontrolled) – update manually when editing toggled
//     if (nameRef.current) nameRef.current.value = (u?.name ?? "").toString();
//     if (collegeRef.current)
//       collegeRef.current.value = (u?.college ?? "").toString();
//     if (branchRef.current)
//       branchRef.current.value = (u?.branch ?? "").toString();
//     if (yearRef.current) yearRef.current.value = (u?.year ?? "").toString();
//     if (phoneRef.current) phoneRef.current.value = (u?.phone ?? "").toString();
//     if (orgRef.current) orgRef.current.value = (u?.org ?? "").toString();
//     if (countryRef.current)
//       countryRef.current.value = (u?.country ?? "").toString();

//     // skills can be array or comma-separated string
//     const raw = u?.skills;
//     let next = [];
//     if (Array.isArray(raw)) {
//       next = raw.map(String).filter(Boolean);
//     } else if (typeof raw === "string") {
//       next = raw
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean);
//     }
//     setSkills(next);
//   };

//   const toggleEditing = () => {
//     setEditing((e) => !e);
//     // ensure inputs reflect latest user state
//     if (!editing && user) applyUserToForm(user);
//   };

//   const addSkillsFromInput = () => {
//     const val = skillInputRef.current?.value?.trim();
//     if (!val) return;
//     const parts = val.split(",").map((p) => p.trim()).filter(Boolean);
//     setSkills((prev) => {
//       const set = new Set(prev);
//       parts.forEach((p) => set.add(p));
//       return Array.from(set);
//     });
//     if (skillInputRef.current) skillInputRef.current.value = "";
//   };

//   const removeSkill = (text) => {
//     setSkills((prev) => prev.filter((s) => s !== text));
//   };

//   const saveProfile = async () => {
//     try {
//       if (!authService.getToken()) {
//         alert("Please login to update profile.");
//         return;
//       }
//       setSaving(true);
//       setError(null);

//       const name = nameRef.current?.value?.trim() ?? "";
//       const college = collegeRef.current?.value?.trim() ?? "";
//       const branch = branchRef.current?.value?.trim() ?? "";
//       const yearStr = (yearRef.current?.value ?? "").toString().trim();
//       const year =
//         yearStr.length > 0 ? Number.parseInt(yearStr, 10) : undefined;
//       const phone = phoneRef.current?.value?.trim() ?? "";
//       const org = orgRef.current?.value?.trim() ?? "";
//       const country = countryRef.current?.value?.trim() ?? "";

//       if (Number.isNaN(year)) {
//         alert("Year must be a number");
//         setSaving(false);
//         return;
//       }

//       const payload = {
//         name,
//         college,
//         branch,
//         year,
//         skills,
//         phone,
//         org,
//         country,
//       };

//       const res = await apiService.updateProfile(payload);
//       if (res?.success) {
//         const updated = res?.data?.user ?? res?.user ?? res?.data ?? payload;
//         setUser((prev) => ({ ...(prev ?? {}), ...(updated ?? payload) }));
//         authService.setUser?.(updated ?? payload);
//         setEditing(false);
//       } else {
//         setError(res?.message || "Failed to update profile");
//       }
//     } catch (e) {
//       setError(e?.message || "Network error while saving profile");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       await apiService.logout().catch(() => {});
//     } finally {
//       authService.clear?.();
//       window.location.replace("/");
//     }
//   };

//   const initials = (navUser?.name?.[0] || "U").toString().toUpperCase();

//   return (
//     <div className="flex-1 p-6">
//       {/* Top header (logo + name + menu) */}
//       <div className="mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-white mb-1">Profile</h1>
//           <p className="text-white/60">Manage your account and view your activity</p>
//         </div>
//       </div>

//       {/* main content card */}
//       <div className="space-y-4">
//         {/* Top summary */}
//         <div className="bg-white/5 rounded-xl p-4 border border-white/10">
//           {loading ? (
//             <div className="text-white/70">Loading...</div>
//           ) : (
//             <div>
//               <div className="flex items-center gap-3">
//                 <div className="text-xl font-bold text-white flex-1">
//                   {user?.name || "-"}
//                 </div>
//                 <Pill>{(user?.role || "student").toString().toUpperCase()}</Pill>
//               </div>

//               <div className="mt-3 flex flex-wrap gap-2">
//                 {/* <Pill>XP&nbsp;{user?.xp ?? 0}</Pill>
//                 <Pill>
//                   Badges&nbsp;
//                   {Array.isArray(user?.badges) ? user.badges.length : 0}
//                 </Pill> */}
//                 <Pill>Verified&nbsp;{user?.verified ? "Yes" : "No"}</Pill>
//               </div>

//               <div className="mt-2 flex justify-end">
//                 <button
//                   onClick={toggleEditing}
//                   className="text-white/90 hover:text-white text-sm"
//                 >
//                   {editing ? "Cancel" : "Edit"}
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Details */}
//         <div className="bg-white/5 rounded-xl p-5 border border-white/10">
//           {loading ? (
//             <div className="text-white/70">Loading details...</div>
//           ) : (
//             <div className="space-y-4">
//               {/* Email readonly */}
//               <LabelValue label="Email">{user?.email || "-"}</LabelValue>

//               {/* Name */}
//               {editing ? (
//                 <TextField
//                   label="Full name"
//                   hint="Enter your full name"
//                   defaultValue={user?.name || ""}
//                   ref={nameRef}
//                 />
//               ) : (
//                 <LabelValue label="Name">{user?.name || "-"}</LabelValue>
//               )}

//               {/* College */}
//               {editing ? (
//                 <TextField
//                   label="College"
//                   hint="College name"
//                   defaultValue={user?.college || ""}
//                   ref={collegeRef}
//                 />
//               ) : (
//                 <LabelValue label="College">{user?.college || "-"}</LabelValue>
//               )}

//               {/* Branch */}
//               {editing ? (
//                 <TextField
//                   label="Branch"
//                   hint="e.g. Computer Science"
//                   defaultValue={user?.branch || ""}
//                   ref={branchRef}
//                 />
//               ) : (
//                 <LabelValue label="Branch">{user?.branch || "-"}</LabelValue>
//               )}

//               {/* Year */}
//               {editing ? (
//                 <TextField
//                   label="Year"
//                   hint="e.g. 3"
//                   type="number"
//                   defaultValue={user?.year ?? ""}
//                   ref={yearRef}
//                 />
//               ) : (
//                 <LabelValue label="Year">
//                   {user?.year?.toString() || "-"}
//                 </LabelValue>
//               )}

//               {/* Phone (digits only) */}
//               {editing ? (
//                 <TextField
//                   label="Phone"
//                   hint="contact number"
//                   defaultValue={user?.phone || ""}
//                   ref={phoneRef}
//                   onChange={handlePhoneChange}
//                   type="tel"
//                   inputMode="numeric"
//                   pattern="\d*"
//                 />
//               ) : (
//                 <LabelValue label="Phone">{user?.phone || "-"}</LabelValue>
//               )}

//               {/* Organization */}
//               {editing ? (
//                 <TextField
//                   label="Organization"
//                   hint="Your organization"
//                   defaultValue={user?.org || ""}
//                   ref={orgRef}
//                 />
//               ) : (
//                 <LabelValue label="Organization">{user?.org || "-"}</LabelValue>
//               )}

//               {/* Country */}
//               {editing ? (
//                 <TextField
//                   label="Country"
//                   hint="Country"
//                   defaultValue={user?.country || ""}
//                   ref={countryRef}
//                 />
//               ) : (
//                 <LabelValue label="Country">{user?.country || "-"}</LabelValue>
//               )}

//               {/* Skills */}
//               <div className="flex flex-col sm:flex-row gap-2">
//                 <div className="sm:w-32 shrink-0 text-white/70 font-semibold">
//                   Skills
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex flex-wrap gap-2">
//                     {skills.length > 0 ? (
//                       skills.map((s) => (
//                         <SkillChip
//                           key={s}
//                           text={s}
//                           canRemove={editing}
//                           onRemove={removeSkill}
//                         />
//                       ))
//                     ) : editing ? (
//                       <span className="text-white/60 text-sm">
//                         Add skills (comma separated)
//                       </span>
//                     ) : (
//                       <span className="text-white/60">—</span>
//                     )}
//                     {editing && (
//                       <div className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 px-2 py-1">
//                         <input
//                           ref={skillInputRef}
//                           placeholder="Add skill"
//                           onKeyDown={(e) => {
//                             if (e.key === "Enter") {
//                               e.preventDefault();
//                               addSkillsFromInput();
//                             }
//                           }}
//                           className="bg-transparent outline-none text-white placeholder-white/60 text-sm w-40"
//                         />
//                         <button
//                           type="button"
//                           onClick={addSkillsFromInput}
//                           className="ml-1 px-2 py-0.5 rounded-md hover:bg-white/10 text-white/80"
//                           title="Add"
//                         >
//                           +
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* last_login & active */}
//               {/* <LabelValue label="Last active">
//                 {user?.last_login ? String(user.last_login) : "-"}
//               </LabelValue> */}
//               <LabelValue label="Active">
//                 {user?.is_active ? "Yes" : "No"}
//               </LabelValue>

//               {error && <div className="text-red-300 text-sm">{error}</div>}

//               <div className="pt-2">
//                 {editing ? (
//                   <button
//                     disabled={saving}
//                     onClick={saveProfile}
//                     className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 disabled:opacity-60"
//                   >
//                     {saving ? "Saving..." : "Save changes"}
//                   </button>
//                 ) : (
//                   <button
//                     onClick={logout}
//                     className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15"
//                   >
//                     Logout
//                   </button>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileScreen;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";
import {
  BadgeCheck,
  User as UserIcon,
  Mail,
  School,
  Waypoints,
  Hash,
  Phone,
  Building2,
  Globe2,
  PencilLine,
  X,
  Tag as TagIcon, // ✅ FIX
} from "lucide-react";

/** Pills & chips styled like CompetitionScreen */
const Pill = ({ children, icon: Icon }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background text-primary-text/90 border border-border text-sm font-semibold">
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </span>
);

const SkillChip = ({ text, canRemove, onRemove }) => (
  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-background text-primary-text/80 border border-border text-sm">
    <span className="truncate max-w-[160px]">{text}</span>
    {canRemove && (
      <button
        type="button"
        onClick={() => onRemove?.(text)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-md hover:bg-border"
        title="Remove"
      >
        <X className="w-3.5 h-3.5 text-secondary-text" />
      </button>
    )}
  </span>
);

/** Label + value row (view mode) */
const LabelValue = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
    <div className="sm:w-44 shrink-0 text-secondary-text font-semibold inline-flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </div>
    <div className="text-primary-text">{children ?? "—"}</div>
  </div>
);

/** TextField styled like CompetitionScreen inputs */
const TextField = React.forwardRef(
  (
    { label, hint, type = "text", icon: Icon, defaultValue, onChange, ...rest },
    ref
  ) => (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="sm:w-44 shrink-0 text-secondary-text font-semibold inline-flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <input
        ref={ref}
        type={type}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={hint}
        className="flex-1 rounded-xl border border-border bg-surface text-primary-text placeholder-secondary-text px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
        {...rest}
      />
    </div>
  )
);

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [navUser, setNavUser] = useState(null);

  // refs for form fields
  const nameRef = useRef(null);
  const collegeRef = useRef(null);
  const branchRef = useRef(null);
  const yearRef = useRef(null);
  const skillInputRef = useRef(null);
  const phoneRef = useRef(null);
  const orgRef = useRef(null);
  const countryRef = useRef(null);

  const [skills, setSkills] = useState([]);
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const isLoggedIn = useMemo(() => !!authService.getToken(), []);

  const handlePhoneChange = (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 15);
  };

  // load (local -> remote)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const local = authService.getUser?.();
        if (local) {
          applyUserToForm(local);
          setUser(local);
          setNavUser(local);
        }

        if (authService.getToken()) {
          const res = await apiService.getProfile();
          if (res?.success) {
            const remote = res?.data?.user ?? res?.user ?? res?.data ?? null;
            if (remote) {
              authService.setUser?.(remote);
              applyUserToForm(remote);
              setUser(remote);
              setNavUser(remote);
            }
          } else if (res && res.message) {
            setError(res.message);
          }
        }
      } catch (e) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyUserToForm = (u) => {
    if (nameRef.current) nameRef.current.value = (u?.name ?? "").toString();
    if (collegeRef.current)
      collegeRef.current.value = (u?.college ?? "").toString();
    if (branchRef.current)
      branchRef.current.value = (u?.branch ?? "").toString();
    if (yearRef.current) yearRef.current.value = (u?.year ?? "").toString();
    if (phoneRef.current) phoneRef.current.value = (u?.phone ?? "").toString();
    if (orgRef.current) orgRef.current.value = (u?.org ?? "").toString();
    if (countryRef.current)
      countryRef.current.value = (u?.country ?? "").toString();

    const raw = u?.skills;
    let next = [];
    if (Array.isArray(raw)) next = raw.map(String).filter(Boolean);
    else if (typeof raw === "string")
      next = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setSkills(next);
  };

  const toggleEditing = () => {
    setEditing((e) => !e);
    if (!editing && user) applyUserToForm(user);
  };

  const addSkillsFromInput = () => {
    const val = skillInputRef.current?.value?.trim();
    if (!val) return;
    const parts = val.split(",").map((p) => p.trim()).filter(Boolean);
    setSkills((prev) => {
      const set = new Set(prev);
      parts.forEach((p) => set.add(p));
      return Array.from(set);
    });
    if (skillInputRef.current) skillInputRef.current.value = "";
  };

  const removeSkill = (text) => setSkills((prev) => prev.filter((s) => s !== text));

  const saveProfile = async () => {
    try {
      if (!authService.getToken()) {
        alert("Please login to update profile.");
        return;
      }
      setSaving(true);
      setError(null);

      const name = nameRef.current?.value?.trim() ?? "";
      const college = collegeRef.current?.value?.trim() ?? "";
      const branch = branchRef.current?.value?.trim() ?? "";
      const yearStr = (yearRef.current?.value ?? "").toString().trim();
      const year = yearStr.length > 0 ? Number.parseInt(yearStr, 10) : undefined;
      const phone = phoneRef.current?.value?.trim() ?? "";
      const org = orgRef.current?.value?.trim() ?? "";
      const country = countryRef.current?.value?.trim() ?? "";

      if (Number.isNaN(year)) {
        alert("Year must be a number");
        setSaving(false);
        return;
      }

      const payload = { name, college, branch, year, skills, phone, org, country };

      const res = await apiService.updateProfile(payload);
      if (res?.success) {
        const updated = res?.data?.user ?? res?.user ?? res?.data ?? payload;
        setUser((prev) => ({ ...(prev ?? {}), ...(updated ?? payload) }));
        authService.setUser?.(updated ?? payload);
        setEditing(false);
      } else {
        setError(res?.message || "Failed to update profile");
      }
    } catch (e) {
      setError(e?.message || "Network error while saving profile");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout().catch(() => {});
    } finally {
      authService.clear?.();
      window.location.replace("/");
    }
  };

  const initials = (navUser?.name?.[0] || "U").toString().toUpperCase();

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* Header (match CompetitionScreen) */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary-text">Profile</h2>
          <p className="text-secondary-text">Manage your account and view your activity</p>
        </div>

        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-surface rounded-xl p-5 border border-border">
            {loading ? (
              <div className="text-secondary-text">Loading...</div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                    <span className="text-primary-text font-bold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-primary-text text-xl font-bold truncate">
                      {user?.name || "-"}
                    </div>
                    <div className="text-secondary-text text-sm truncate">{user?.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill>{(user?.role || "student").toString().toUpperCase()}</Pill>
                    <Pill icon={BadgeCheck}>
                      {user?.verified ? "Verified" : "Unverified"}
                    </Pill>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={toggleEditing}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-border border border-border text-primary-text transition-colors"
                  >
                    {editing ? (
                      <>
                        <X className="w-4 h-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <PencilLine className="w-4 h-4" />
                        Edit
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* Details card */}
          <div className="bg-surface rounded-xl p-5 border border-border">
            {loading ? (
              <div className="text-secondary-text">Loading details...</div>
            ) : (
              <div className="space-y-5">
                <LabelValue label="Email" icon={Mail}>
                  {user?.email || "-"}
                </LabelValue>

                {editing ? (
                  <TextField
                    label="Full name"
                    hint="Enter your full name"
                    defaultValue={user?.name || ""}
                    ref={nameRef}
                    icon={UserIcon}
                  />
                ) : (
                  <LabelValue label="Name" icon={UserIcon}>
                    {user?.name || "-"}
                  </LabelValue>
                )}

                {editing ? (
                  <TextField
                    label="College"
                    hint="College name"
                    defaultValue={user?.college || ""}
                    ref={collegeRef}
                    icon={School}
                  />
                ) : (
                  <LabelValue label="College" icon={School}>
                    {user?.college || "-"}
                  </LabelValue>
                )}

                {editing ? (
                  <TextField
                    label="Branch"
                    hint="e.g. Computer Science"
                    defaultValue={user?.branch || ""}
                    ref={branchRef}
                    icon={Waypoints}
                  />
                ) : (
                  <LabelValue label="Branch" icon={Waypoints}>
                    {user?.branch || "-"}
                  </LabelValue>
                )}

                {editing ? (
                  <TextField
                    label="Year"
                    hint="e.g. 3"
                    type="number"
                    defaultValue={user?.year ?? ""}
                    ref={yearRef}
                    icon={Hash}
                  />
                ) : (
                  <LabelValue label="Year" icon={Hash}>
                    {user?.year?.toString() || "-"}
                  </LabelValue>
                )}

                {editing ? (
                  <TextField
                    label="Phone"
                    hint="Contact number"
                    defaultValue={user?.phone || ""}
                    ref={phoneRef}
                    onChange={handlePhoneChange}
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    icon={Phone}
                  />
                ) : (
                  <LabelValue label="Phone" icon={Phone}>
                    {user?.phone || "-"}
                  </LabelValue>
                )}

                {editing ? (
                  <TextField
                    label="Organization"
                    hint="Your organization"
                    defaultValue={user?.org || ""}
                    ref={orgRef}
                    icon={Building2}
                  />
                ) : (
                  <LabelValue label="Organization" icon={Building2}>
                    {user?.org || "-"}
                  </LabelValue>
                )}

                {editing ? (
                  <TextField
                    label="Country"
                    hint="Country"
                    defaultValue={user?.country || ""}
                    ref={countryRef}
                    icon={Globe2}
                  />
                ) : (
                  <LabelValue label="Country" icon={Globe2}>
                    {user?.country || "-"}
                  </LabelValue>
                )}

                {/* Skills */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="sm:w-44 shrink-0 text-secondary-text font-semibold inline-flex items-center gap-2">
                    <TagIcon className="w-4 h-4" />
                    Skills
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {skills.length > 0 ? (
                        skills.map((s) => (
                          <SkillChip
                            key={s}
                            text={s}
                            canRemove={editing}
                            onRemove={removeSkill}
                          />
                        ))
                      ) : editing ? (
                        <span className="text-secondary-text text-sm">
                          Add skills (comma separated)
                        </span>
                      ) : (
                        <span className="text-secondary-text">—</span>
                      )}

                      {editing && (
                        <div className="inline-flex items-center rounded-lg bg-surface border border-border px-2 py-1">
                          <input
                            ref={skillInputRef}
                            placeholder="Add skill"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSkillsFromInput();
                              }
                            }}
                            className="bg-transparent outline-none text-primary-text placeholder-secondary-text text-sm w-40"
                          />
                          <button
                            type="button"
                            onClick={addSkillsFromInput}
                            className="ml-1 px-2 py-0.5 rounded-md hover:bg-border text-secondary-text"
                            title="Add"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <LabelValue label="Active">
                  {user?.is_active ? "Yes" : "No"}
                </LabelValue>

                {error && (
                  <div className="text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2 text-sm">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  {editing ? (
                    <button
                      disabled={saving}
                      onClick={saveProfile}
                      className={[
                        "inline-flex items-center justify-center px-4 py-2 rounded-lg",
                        "bg-surface hover:bg-border border border-border text-primary-text transition-colors",
                        saving && "opacity-60 cursor-not-allowed",
                      ].join(" ")}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  ) : (
                    <button
                      onClick={logout}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-surface hover:bg-border border border-border text-primary-text transition-colors"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
