import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function EmailVerificationNotice() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [msg, setMsg] = useState("We sent a verification link to your email.");
  const [busy, setBusy] = useState(false);

  const base =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.origin.replace(/\/$/, "")}/api/v1`;

  const handleResend = async () => {
    try {
      setBusy(true);
      setMsg("Sending verification email...");
      const res = await fetch(`${base}/auth/resend-verification-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to resend email");
      setMsg(data?.message || "Verification email sent. Check your inbox.");
    } catch (e) {
      setMsg(e.message || "Failed to resend verification email.");
    } finally {
      setBusy(false);
    }
  };

  const openMail = () => {
    if (email.endsWith("@gmail.com")) window.open("https://mail.google.com", "_blank");
    else if (/@(outlook|hotmail)\.com$/.test(email)) window.open("https://outlook.live.com", "_blank");
    else window.location.href = `mailto:${email}`;
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-6xl">📫</div>
        <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 text-gray-600">{msg}</p>

        <div className="mt-4">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>

        <div className="mt-4 flex gap-2 justify-center">
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            onClick={handleResend}
            disabled={busy || !email}
          >
            {busy ? "Sending..." : "Resend link"}
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gray-900 text-white"
            onClick={openMail}
            disabled={!email}
          >
            Open email
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Already verified?{" "}
          <button className="underline" onClick={() => navigate("/login")}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
