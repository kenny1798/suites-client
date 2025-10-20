import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function NotFound() {
  const [seconds, setSeconds] = useState(5);
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // tick countdown
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    // final redirect
    const timeout = setTimeout(() => nav("/", { replace: true }), 5000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [nav]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center rounded-2xl bg-gray-100 h-16 w-16 text-gray-700 font-semibold mb-4">
          404
        </div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-gray-600">
          We couldn't find <span className="font-mono break-all">{location.pathname}</span>.
        </p>

        <div className="mt-6 text-sm text-gray-500" aria-live="polite">
          Redirecting to home in <span className="font-semibold">{seconds}</span> second{seconds === 1 ? "" : "s"}…
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            to="/"
            replace
            className="inline-flex items-center rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-900"
          >
            Go home now
          </Link>
          <button
            onClick={() => nav(-1)}
            className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
