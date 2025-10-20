// packages/app/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@suite/auth';
import { Input, Button } from '@suite/ui';

function resolveRedirect(location) {
  const qs = new URLSearchParams(location.search);
  const qsTarget = qs.get('redirect');

  const from = location.state?.from
    ? `${location.state.from.pathname || ''}${location.state.from.search || ''}${location.state.from.hash || ''}`
    : null;

  const raw = qsTarget || from || '/';

  // normalise ke path tempatan
  let path = '/';
  try {
    const u = raw.startsWith('http')
      ? new URL(raw)
      : new URL(raw, window.location.origin);
    path = `${u.pathname}${u.search}${u.hash}`;
  } catch { path = raw.startsWith('/') ? raw : '/'; }

  const BLOCKED = ['/auth', '/auth-success', '/login', '/register'];
  if (BLOCKED.some(p => path === p || path.startsWith(p + '/'))) return '/';

  return path || '/';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const { loginWithEmail } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const postLoginTarget = resolveRedirect(location);

  console.log(loginWithEmail)

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrMsg(''); setBusy(true);
    try {
      await loginWithEmail(email, password);
      const target = resolveRedirect(location)
        || localStorage.getItem('postLoginRedirect')
        || '/';
      localStorage.removeItem('postLoginRedirect');
      console.debug('[postLoginTarget]', target);
      nav(target, { replace: true });
    } catch (err) {
      setErrMsg(err?.response?.data?.error || err?.message || String(err));
    } finally { setBusy(false); }
  };
  
  const handleGoogle = () => {
    localStorage.setItem('postLoginRedirect', postLoginTarget);
    const base = import.meta.env.VITE_SERVER;
    window.location.href = `${base}/auth/google?redirect=${encodeURIComponent(postLoginTarget)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">BTS</div>
          <span className="ml-2 text-lg font-semibold tracking-tight">Business Tool Suite</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
          <p className="mb-4 text-sm text-gray-500">Welcome back! Please enter your details.</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot" className="text-xs text-blue-600 hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" className="pr-10" />
                <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="my-4 flex items-center">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="mx-3 text-xs text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Button onClick={handleGoogle} className="w-full bg-red-600 hover:bg-red-700" disabled={busy}>
            Continue with Google
          </Button>

          {errMsg && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errMsg}
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            No account?{' '}
            <Link to={`/register?redirect=${encodeURIComponent(postLoginTarget)}`} className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          By continuing you agree to our <Link to="/terms" className="underline">Terms</Link>.
        </p>
      </div>
    </div>
  );
}
