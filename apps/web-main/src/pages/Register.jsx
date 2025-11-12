// packages/app/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { apiAuth } from '@suite/api-clients';
import { Input, Button } from '@suite/ui';

function normaliseRedirect(location) {
  const fromState = location.state?.from;
  const stateTarget = fromState
    ? `${fromState.pathname || ''}${fromState.search || ''}${fromState.hash || ''}`
    : null;

  const qs = new URLSearchParams(location.search);
  const redirectParam = qs.get('redirect');

  const raw = stateTarget || redirectParam || '/';
  if (!raw) return '/';

  try {
    const u = raw.startsWith('http')
      ? new URL(raw)
      : new URL(raw, window.location.origin);
    return `${u.pathname}${u.search}${u.hash}` || '/';
  } catch {
    return raw.startsWith('/') ? raw : '/';
  }
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const nav = useNavigate();
  const location = useLocation();

  const postAuthTarget = normaliseRedirect(location);

  const submit = async (e) => {
    e.preventDefault();
    setErrMsg('');
    setBusy(true);
    try {
      await apiAuth.post('/auth/register', { name, email, password });

      // ✅ New flow: user perlu verify email dulu
      // Hantar ke verify-pending page, siap bawa email + redirect target
      const search = new URLSearchParams({
        email,
        redirect: postAuthTarget || '/',
      }).toString();

      nav(`/verify-pending?${search}`, { replace: true });
    } catch (err) {
      const code = err?.response?.data?.error;
      let msg =
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong. Please try again.';

      if (code === 'EMAIL_TAKEN') {
        msg = 'This email is already registered. Try signing in instead.';
      } else if (code === 'REGISTER_FAILED') {
        msg = 'Unable to create your account right now. Please try again in a moment.';
      } else if (code === 'EMAIL_PASSWORD_REQUIRED') {
        msg = 'Email and password are required.';
      }

      setErrMsg(msg);
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => nav(-1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back */}
        <button
          onClick={goBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <span className="rounded-md border px-2 py-1">←</span> Back
        </button>

        {/* Brand */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
            BTS
          </div>
          <span className="ml-2 text-lg font-semibold tracking-tight">
            Business Tool Suite
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h1 className="mb-1 text-xl font-semibold">Create your account</h1>
          <p className="mb-4 text-sm text-gray-500">
            It’s quick and easy — we’ll send you a verification email before you get started.
          </p>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          {errMsg && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errMsg}
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to={`/login?redirect=${encodeURIComponent(postAuthTarget || '/')}`}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          By signing up you agree to our{' '}
          <Link to="/terms" className="underline">
            Terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
