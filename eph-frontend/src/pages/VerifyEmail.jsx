import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [msg, setMsg] = useState("Verifying your email...");
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    if (!token) {
      setStatus("error");
      setMsg("Invalid verification link.");
      return;
    }

    const base =
      import.meta.env.VITE_API_BASE_URL ||
      `${window.location.origin.replace(/\/$/, "")}/api/v1`;

    const url = new URL(`${base}/auth/verify-email`);
    url.searchParams.set("token", token);

    const ac = new AbortController();
    abortRef.current = ac;

    fetch(url.toString(), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: ac.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          // try json → fallback to text → fallback message
          let m = "This verification link is invalid or has expired.";
          try {
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
              const data = await res.json();
              m = data?.message || m;
            } else {
              const t = await res.text();
              if (t && t.length < 2048) m = t.replace(/<[^>]*>/g, "").trim() || m; // strip HTML if any
            }
          } catch (_e) {}
          throw new Error(m);
        }
        setStatus("success");
        setMsg("Your email has been verified. You can close this window and log in.");
        timerRef.current = setTimeout(() => navigate("/", { replace: true }), 5000);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        setStatus("error");
        setMsg(err.message || "This verification link is invalid or has expired.");
      });

    return () => {
      ac.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.search, navigate]);

  const resend = async () => {
    try {
      const base =
        import.meta.env.VITE_API_BASE_URL ||
        `${window.location.origin.replace(/\/$/, "")}/api/v1`;
      const res = await fetch(`${base}/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to resend verification email.");
      setMsg(data?.message || "Verification email sent. Check your inbox.");
    } catch (e) {
      setMsg(e.message || "Failed to resend verification email.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin inline-block w-10 h-10 border-4 border-gray-300 border-t-transparent rounded-full" />
            <p className="mt-4 text-gray-600">{msg}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="mt-4 text-2xl font-semibold">Email verified</h1>
            <p className="mt-2 text-gray-600">{msg}</p>
            <p className="mt-2 text-sm text-gray-500">Redirecting to our website…</p>
            <button
              className="mt-6 px-5 py-2 rounded-lg bg-blue-600 text-white"
              onClick={() => navigate("/", { replace: true })}
            >
              Go now
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl">❌</div>
            <h1 className="mt-4 text-2xl font-semibold">Verification failed</h1>
            <p className="mt-2 text-gray-600">{msg}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-900 text-white"
                onClick={() => navigate("/", { replace: true })}
              >
                Back to home
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-amber-500 text-white"
                onClick={resend}
                title="Resend verification email"
              >
                Resend link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
