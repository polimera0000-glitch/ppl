// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { authService } from "../services/authService";
// import { apiService } from "../services/apiService";

// const Tile = ({ icon, colorClass, title, subtitle, onClick }) => (
//   <button
//     onClick={onClick}
//     className="text-left rounded-xl p-6 w-full transition border bg-white/5 border-white/10 hover:bg-white/10"
//   >
//     <div className="flex items-center gap-3 mb-3">
//       <div className={`w-10 h-10 ${colorClass} bg-opacity-20 rounded-lg flex items-center justify-center`}>
//         {icon}
//       </div>
//       <h3 className="text-white font-semibold">{title}</h3>
//     </div>
//     <p className="text-white/70 text-sm">{subtitle}</p>
//   </button>
// );

// const AdminHubScreen = () => {
//   const navigate = useNavigate();

//   // header/auth (purely cosmetic; access is guarded by <ProtectedRoute>)
//   const [navUser, setNavUser] = useState(authService.getUser?.() || null);
//   const initials = (navUser?.name?.[0] || "U").toString().toUpperCase();

//   useEffect(() => {
//     setNavUser(authService.getUser?.() || null);
//   }, []);

//   const logout = async () => {
//     try {
//       await apiService.logout().catch(() => {});
//     } finally {
//       authService.clear?.();
//       navigate("/roles", { replace: true });
//     }
//   };

//   const goRole = (role) => navigate(`/admin/roles/${role}`);

//   return (
//     <div className="flex-1 p-6">
//       {/* Top header */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-white mb-1">Admin Hub</h1>
//             <p className="text-white/60">Manage users by role and access admin tools</p>
//           </div>
          
//         </div>
//       </div>

//       {/* Tiles */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         <Tile
//           colorClass="bg-blue-500"
//           title="Students"
//           subtitle="Browse and manage student accounts"
//           onClick={() => goRole("student")}
//           icon={
//             <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 20.5a12.083 12.083 0 01-6.16-9.922L12 14z" />
//             </svg>
//           }
//         />
//         {/* <Tile
//           colorClass="bg-green-500"
//           title="Hiring"
//           subtitle="View hiring team accounts"
//           onClick={() => goRole("hiring")}
//           icon={
//             <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//           }
//         />
//         <Tile
//           colorClass="bg-indigo-500"
//           title="Investor"
//           subtitle="View investor/mentor accounts"
//           onClick={() => goRole("investor")}
//           icon={
//             <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V7a4 4 0 118 0v4" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
//             </svg>
//           }
//         /> */}
//         <Tile
//           colorClass="bg-pink-500"
//           title="Admins"
//           subtitle="See all admins and invite new admins"
//           onClick={() => goRole("admin")}
//           icon={
//             <svg className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.28 0 4-1.72 4-4s-1.72-4-4-4-4 1.72-4 4 1.72 4 4 4z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20a6 6 0 1112 0H6z" />
//             </svg>
//           }
//         />
//       </div>
//     </div>
//   );
// };

// export default AdminHubScreen;


// src/screens/AdminHubScreen.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { apiService } from "../services/apiService";
import { Rocket, X } from "lucide-react";

const Tile = ({ icon, title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="text-left rounded-xl p-5 w-full transition bg-surface border border-border hover:bg-border"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-primary-text font-semibold">{title}</h3>
    </div>
    <p className="text-secondary-text text-sm">{subtitle}</p>
  </button>
);

const AdminHubScreen = () => {
  const navigate = useNavigate();

  // header/auth (purely cosmetic; access is guarded by <ProtectedRoute>)
  const [navUser, setNavUser] = useState(authService.getUser?.() || null);
  const initials = (navUser?.name?.[0] || "U").toString().toUpperCase();

  useEffect(() => {
    setNavUser(authService.getUser?.() || null);
  }, []);

  const logout = async () => {
    try {
      await apiService.logout().catch(() => {});
    } finally {
      authService.clear?.();
      navigate("/roles", { replace: true });
    }
  };

  const goRole = (role) => navigate(`/admin/roles/${role}`);

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* Header (same shell as CompetitionDetails/Create screens) */}
        <div className="bg-surface rounded-xl p-4 border border-border mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                <Rocket className="w-5 h-5 text-primary-text" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-text">Admin Hub</h1>
                <p className="text-secondary-text text-sm">
                  Manage users by role and access admin tools
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              

              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-surface hover:bg-border border border-border transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-secondary-text" />
              </button>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          {/* Hint row (optional) */}
          <div className="mb-5 grid sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
              <span className="w-2 h-2 rounded-full bg-primary/70" />
              <span className="text-secondary-text text-sm">Role-based management</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
              <span className="w-2 h-2 rounded-full bg-primary/70" />
              <span className="text-secondary-text text-sm">View & organize users</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border">
              <span className="w-2 h-2 rounded-full bg-primary/70" />
              <span className="text-secondary-text text-sm">Invite & update access</span>
            </div>
          </div>

          {/* Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Tile
              title="Students"
              subtitle="Browse and manage student accounts"
              onClick={() => goRole("student")}
              icon={
                <svg
                  className="w-5 h-5 text-primary-text"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422A12.083 12.083 0 0112 20.5a12.083 12.083 0 01-6.16-9.922L12 14z"
                  />
                </svg>
              }
            />

            {/* Uncomment to add more roles */}
            {/*
            <Tile
              title="Hiring"
              subtitle="View hiring team accounts"
              onClick={() => goRole("hiring")}
              icon={<svg className="w-5 h-5 text-primary-text" ... />}
            />
            <Tile
              title="Investors/Mentors"
              subtitle="View investor/mentor accounts"
              onClick={() => goRole("investor")}
              icon={<svg className="w-5 h-5 text-primary-text" ... />}
            />
            */}

            <Tile
              title="Admins"
              subtitle="See all admins and invite new admins"
              onClick={() => goRole("admin")}
              icon={
                <svg
                  className="w-5 h-5 text-primary-text"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.28 0 4-1.72 4-4s-1.72-4-4-4-4 1.72-4 4 1.72 4 4 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20a6 6 0 1112 0H6z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHubScreen;
