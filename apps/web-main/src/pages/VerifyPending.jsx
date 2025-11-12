import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiAuth } from '@suite/api-clients';
import { Button, Input } from '@suite/ui';

export default function VerifyPending() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const initialEmail = params.get('email') || '';
  const redirect = params.get('redirect') || '/';

  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const loginHref = useMemo(() => {
    const qs = new URLSearchParams({ redirect }).toString();
    return `/login?${qs}`;
  }, [redirect]);

  const handleResend = async (e) => {
    e?.preventDefault?.();
    setOkMsg(''); setErrMsg(''); setBusy(true);
    try {
      await apiAuth.post('/auth/resend-verification', { email });
      setOkMsg('Verification email sent. Please check your inbox.');
    } catch (err) {
      const code = err?.response?.data?.error;
      let msg = err?.response?.data?.error || 'Failed to resend email.';
      if (code === 'EMAIL_NOT_FOUND') msg = 'Email is not registered.';
      setErrMsg(msg);
    } finally {
      setBusy(false);
    }
  };

  const openGmail = () => {
    // Workspace/Gmail default
    window.open('https://mail.google.com/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">BTS</div>
          <span className="ml-2 text-lg font-semibold tracking-tight">Business Tool Suite</span>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h1 className="text-xl font-semibold">Verify your email</h1>
          <p className="mt-1 text-sm text-gray-600">
            We’ve sent a verification email to <b>{initialEmail || 'your inbox'}</b>. Please click the link inside to activate your account.
          </p>

          <div className="mt-4 space-y-2">
            <Button onClick={openGmail} className="w-full">Open Gmail</Button>

            <div className="pt-2 border-t mt-3">
              <label className="text-sm font-medium text-gray-700">Didn’t receive it? Resend to</label>
              <div className="mt-1 flex gap-2">
                <Input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="you@domain.com" />
                <Button onClick={handleResend} disabled={busy}>{busy ? 'Sending…' : 'Resend'}</Button>
              </div>
            </div>

            {okMsg && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{okMsg}</div>
            )}
            {errMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errMsg}</div>
            )}

            <div className="mt-2 text-sm text-gray-600">
              After verifying, continue to sign in:
              <div className="mt-2">
                <Link to={loginHref} className="underline">Go to Login</Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Need help? <button className="underline" onClick={()=>navigate('/support')}>Contact support</button>
        </p>
      </div>
    </div>
  );
}
