// packages/auth/src/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

function buildLocalRedirect(location) {
  // Normalise current path to a local URL (avoid absolute external)
  try {
    const u = new URL(
      `${location.pathname || ''}${location.search || ''}${location.hash || ''}`,
      window.location.origin
    );
    return `${u.pathname}${u.search}${u.hash}` || '/';
  } catch {
    const raw = `${location.pathname || ''}${location.search || ''}${location.hash || ''}`;
    return raw.startsWith('/') ? raw : '/';
  }
}

// Routes that should not trigger verify redirect (avoid loops)
const SAFE_ROUTES = new Set([
  '/login',
  '/register',
  '/auth-success',
  '/verify-pending',
  '/verify-email',
]);

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Basic loading gate
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border bg-white shadow-sm p-4 text-sm text-gray-600">
          Loading your account…
        </div>
      </div>
    );
  }

  const redirectTarget = buildLocalRedirect(location);
  const here = (location.pathname || '').toLowerCase();

  // Not logged in → send to login
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
        state={{ from: location }}
      />
    );
  }

  // Logged in but not verified → send to verify-pending (except on safe routes)
  const isSafe = Array.from(SAFE_ROUTES).some(
    (p) => here === p || here.startsWith(`${p}/`)
  );

  if (user && user.isValidated === false && !isSafe) {
    const email = user.email || '';
    const q = new URLSearchParams({
      email,
      redirect: redirectTarget,
    }).toString();

    return <Navigate to={`/verify-pending?${q}`} replace />;
  }

  // All good
  return children;
}

export default ProtectedRoute;
