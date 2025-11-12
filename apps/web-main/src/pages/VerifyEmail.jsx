import React from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiAuth } from '@suite/api-clients';
import { Button, Input } from '@suite/ui';

function resolveRedirect(params, fallback = '/') {
  const r = params.get('redirect');
  if (!r) return fallback;
  try {
    const u = r.startsWith('http') ? new URL(r) : new URL(r, window.location.origin);
    return `${u.pathname}${u.search}${u.hash}` || fallback;
  } catch {
    return r.startsWith('/') ? r : fallback;
  }
}

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const token = params.get('token') || '';
  const redirect = resolveRedirect(params, '/');
  const [status, setStatus] = React.useState(token ? 'VERIFYING' : 'MISSING');
  const [message, setMessage] = React.useState('');
  const [resendBusy, setResendBusy] = React.useState(false);
  const [email, setEmail] = React.useState(params.get('email') || '');

  // fire verification once
React.useEffect(() => {
  let alive = true;

  async function go() {
    if (!token) return;
    setStatus('VERIFYING');
    setMessage('');

    try {
      // 1) Try POST (abaikan kalau 404)
      await apiAuth.post('/auth/verify-email/confirm', { token });
      if (!alive) return;
      setStatus('SUCCESS');
      setMessage('Your email has been verified successfully.');
      return;
    } catch (e1) {
      // proceed to GET
    }

    try {
      // 2) GET dengan token (+ email kalau ada)
      const qs = new URLSearchParams({ token, ...(email ? { email } : {}) }).toString();
      const r = await apiAuth.get(`/auth/verify-email?${qs}`);
      if (!alive) return;

      // BE success -> either EMAIL_VERIFIED or USER_ALREADY_VERIFIED
      setStatus('SUCCESS');
      setMessage(r?.data?.message === 'USER_ALREADY_VERIFIED'
        ? 'Your email is already verified.'
        : 'Your email has been verified successfully.'
      );
      return;
    } catch (e2) {
      if (!alive) return;

      const code =
        e2?.response?.data?.error ||
        e2?.response?.data?.code ||
        'UNKNOWN';

      // Normalise BE codes
      const normalized =
        code === 'INVALID_OR_EXPIRED_TOKEN' ? 'TOKEN_INVALID' :
        code;

      // 3) Fallback terakhir: kalau token invalid tapi kita ada email,
      // check status guna email sahaja (tanpa token)
      if (normalized === 'TOKEN_INVALID' && email) {
        try {
          const qs2 = new URLSearchParams({ email }).toString();
          const r2 = await apiAuth.get(`/auth/verify-email?${qs2}`);
          if (!alive) return;
          if (r2?.data?.message === 'USER_ALREADY_VERIFIED') {
            setStatus('SUCCESS');
            setMessage('Your email is already verified.');
            return;
          }
        } catch {}
      }

      // Papar mesej ikut kod
      if (normalized === 'TOKEN_EXPIRED') {
        setStatus('FAILED');
        setMessage('This verification link has expired.');
      } else if (normalized === 'TOKEN_INVALID') {
        setStatus('FAILED');
        setMessage('This verification link is invalid.');
      } else {
        setStatus('FAILED');
        setMessage('Verification failed. The link may be invalid or expired.');
      }
    }
  }

  go();
  return () => { alive = false; };
}, [token, email]);


  // Auto-redirect after success
  React.useEffect(() => {
    if (status !== 'SUCCESS') return;
    const t = setTimeout(() => {
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
    }, 5000);
    return () => clearTimeout(t);
  }, [status, redirect, navigate]);

  const handleResend = async () => {
    if (!email) {
      setMessage('Please enter your email to resend.');
      return;
    }
    setResendBusy(true);
    setMessage('');
    try {
      await apiAuth.post('/auth/resend-verification', { email });
      setMessage('Verification email resent. Please check your inbox.');
    } catch (err) {
      const code = err?.response?.data?.error;
      let msg = err?.response?.data?.error || 'Failed to resend verification email.';
      if (code === 'EMAIL_NOT_FOUND') msg = 'Email is not registered.';
      setMessage(msg);
    } finally {
      setResendBusy(false);
    }
  };

  const loginHref = `/login?redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">BTS</div>
          <span className="ml-2 text-lg font-semibold tracking-tight">Business Tool Suite</span>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-6">
          {status === 'VERIFYING' && (
            <>
              <h1 className="text-xl font-semibold">Verifying your email…</h1>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we confirm your verification link.
              </p>
            </>
          )}

          {status === 'SUCCESS' && (
            <>
              <h1 className="text-xl font-semibold text-emerald-700">Email verified</h1>
              <p className="mt-2 text-sm text-gray-700">{message}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild>
                  <Link to={loginHref}>Continue to sign in</Link>
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  You’ll be redirected automatically in 5 seconds…
                </p>
              </div>
            </>
          )}

          {status === 'FAILED' && (
            <>
              <h1 className="text-xl font-semibold text-amber-700">Verification failed</h1>
              <p className="mt-2 text-sm text-gray-700">{message}</p>

              <div className="mt-4 space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Resend to</label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={handleResend} disabled={resendBusy}>
                      {resendBusy ? 'Sending…' : 'Resend'}
                    </Button>
                  </div>
                </div>

                {message && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {message}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  Or go back to{' '}
                  <Link to={`/verify-pending?email=${encodeURIComponent(email || '')}&redirect=${encodeURIComponent(redirect)}`} className="underline">
                    Verify Pending
                  </Link>
                  .
                </div>
              </div>
            </>
          )}

          {status === 'MISSING' && (
            <>
              <h1 className="text-xl font-semibold">Missing token</h1>
              <p className="mt-2 text-sm text-gray-600">
                The verification link is incomplete. Please open the link from your email again.
              </p>
              <div className="mt-4">
                <Link to="/verify-pending" className="underline text-sm">Back to Verify Pending</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
